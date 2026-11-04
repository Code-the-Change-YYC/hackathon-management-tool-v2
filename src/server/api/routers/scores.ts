import { TRPCError } from "@trpc/server";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import {
	getScoringOpensAt,
	MAIN_CRITERION_MAX_SCORE,
	SCORING_OPENS_EARLY_MINUTES
} from "@/lib/judging";
import { submittedScorecards } from "@/server/api/judging-results";
import { areScoresReleased } from "@/server/api/participant-judging";
import {
	type createTRPCContext,
	createTRPCRouter,
	judgeProcedure,
	protectedProcedure
} from "@/server/api/trpc";
import { hackathonSettings } from "@/server/db/admin-schema";
import { member } from "@/server/db/auth-schema";
import {
	judgingAssignments,
	type judgingCriteria,
	judgingRounds,
	judgingScores,
	judgingTables
} from "@/server/db/judging-schema";

type ScoreContext = Awaited<ReturnType<typeof createTRPCContext>>;

async function requireAssignment(
	db: ScoreContext["db"],
	assignmentId: string,
	judgeId: string
) {
	const assignment = await db.query.judgingAssignments.findFirst({
		where: eq(judgingAssignments.id, assignmentId),
		with: {
			table: {
				with: {
					judges: true,
					round: { columns: { kind: true, publishedAt: true } }
				}
			}
		}
	});
	if (!assignment)
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Assignment not found."
		});
	if (!assignment.table.judges.some((judge) => judge.judgeId === judgeId)) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "You are not assigned to score this team."
		});
	}
	if (!assignment.table.round.publishedAt) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "This round's schedule hasn't been published yet."
		});
	}
	if (assignment.table.round.kind === "final") {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "Finalists are ranked, not scored."
		});
	}
	return assignment;
}

// Released scores are published, so changing one would rewrite the results.
async function assertScoringOpen(db: ScoreContext["db"]) {
	const settings = await db.query.hackathonSettings.findFirst({
		where: eq(hackathonSettings.id, 1)
	});
	if (areScoresReleased(settings)) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "Scoring closed when the winners were announced."
		});
	}
}

function validateScore(
	criterion: typeof judgingCriteria.$inferSelect,
	value: number
) {
	const min = criterion.isSidepot ? 0 : 1;
	const max = criterion.isSidepot
		? criterion.maxScore
		: MAIN_CRITERION_MAX_SCORE;
	if (value < min || value > max) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: `Score must be between ${min} and ${max} for this criterion.`
		});
	}
}

export const scoresRouter = createTRPCRouter({
	// Resolve membership on the server; unreleased results never reach the client.
	getMineReleased: protectedProcedure.query(async ({ ctx }) => {
		const settings = await ctx.db.query.hackathonSettings.findFirst({
			where: eq(hackathonSettings.id, 1)
		});
		if (!areScoresReleased(settings)) return { released: false, rounds: [] };
		const membership = await ctx.db.query.member.findFirst({
			where: eq(member.userId, ctx.session.user.id),
			columns: { organizationId: true }
		});
		if (!membership) return { released: true, rounds: [] };
		const rows = await ctx.db
			.select({
				roundId: judgingRounds.id,
				criterionId: judgingScores.criteriaId,
				value: sql<number>`avg(${judgingScores.value})::float8`
			})
			.from(judgingScores)
			.innerJoin(
				judgingAssignments,
				eq(judgingScores.assignmentId, judgingAssignments.id)
			)
			.innerJoin(
				judgingTables,
				eq(judgingAssignments.tableId, judgingTables.id)
			)
			.innerJoin(judgingRounds, eq(judgingTables.roundId, judgingRounds.id))
			.innerJoin(
				sql`${submittedScorecards} AS submitted`,
				and(
					eq(judgingScores.assignmentId, sql`submitted.assignment_id`),
					eq(judgingScores.judgeId, sql`submitted.judge_id`)
				)
			)
			.where(eq(judgingAssignments.teamId, membership.organizationId))
			.groupBy(judgingRounds.id, judgingScores.criteriaId);
		return { released: true, rounds: rows };
	}),
	// Submit a score
	createMany: judgeProcedure
		.input(
			z.array(
				z.object({
					assignmentId: z.string().uuid(),
					criteriaId: z.string().uuid(),
					score: z.number().int().min(0)
				})
			)
		)
		.mutation(async ({ ctx, input }) => {
			if (input.length === 0) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "At least one score is required."
				});
			}

			const assignmentIds = [
				...new Set(input.map((item) => item.assignmentId))
			];
			if (assignmentIds.length !== 1) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "All scores must belong to the same assignment."
				});
			}

			const assignmentId = assignmentIds[0];
			if (!assignmentId) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Assignment is required."
				});
			}

			const assignment = await requireAssignment(
				ctx.db,
				assignmentId,
				ctx.session.user.id
			);
			await assertScoringOpen(ctx.db);

			const criteriaIds = [...new Set(input.map((item) => item.criteriaId))];
			if (criteriaIds.length !== input.length) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Each criterion may only appear once."
				});
			}
			const criteriaRows = await ctx.db.query.judgingCriteria.findMany();
			if (
				criteriaRows.length !== input.length ||
				criteriaRows.some((criterion) => !criteriaIds.includes(criterion.id))
			) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Complete every criterion for this round before submitting."
				});
			}
			if (getScoringOpensAt(assignment.startsAt) > new Date()) {
				const existing = await ctx.db.query.judgingScores.findFirst({
					where: and(
						eq(judgingScores.assignmentId, assignmentId),
						eq(judgingScores.judgeId, ctx.session.user.id)
					)
				});
				if (!existing)
					throw new TRPCError({
						code: "FORBIDDEN",
						message: `Scoring opens ${SCORING_OPENS_EARLY_MINUTES} minutes before the team's scheduled time.`
					});
			}
			const criteriaById = new Map(criteriaRows.map((row) => [row.id, row]));

			for (const item of input) {
				const criterion = criteriaById.get(item.criteriaId);
				if (!criterion)
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "One or more criteria were not found."
					});
				validateScore(criterion, item.score);
			}

			const results = await ctx.db
				.insert(judgingScores)
				.values(
					input.map((item) => ({
						assignmentId: item.assignmentId,
						judgeId: ctx.session.user.id,
						criteriaId: item.criteriaId,
						value: item.score
					}))
				)
				.onConflictDoUpdate({
					target: [
						judgingScores.assignmentId,
						judgingScores.criteriaId,
						judgingScores.judgeId
					],
					set: { value: sql`excluded.value` }
				})
				.returning();

			return results;
		})
});
