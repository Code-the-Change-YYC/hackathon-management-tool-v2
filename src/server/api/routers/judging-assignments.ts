import { TRPCError } from "@trpc/server";
import { and, asc, eq, inArray, isNotNull } from "drizzle-orm";
import { z } from "zod";
import { getTeamSchedule } from "@/server/api/participant-judging";
import {
	adminProcedure,
	createTRPCRouter,
	judgeProcedure,
	protectedProcedure
} from "@/server/api/trpc";
import { member } from "@/server/db/auth-schema";
import {
	judgingAssignments,
	judgingRounds,
	judgingScores,
	judgingTableJudges,
	judgingTables,
	judgingVotes
} from "@/server/db/judging-schema";

const tableWithRoundAndJudges = {
	with: {
		round: true,
		judges: {
			with: {
				judge: { columns: { id: true, name: true, image: true } }
			}
		}
	}
} as const;

export const judgingAssignmentsRouter = createTRPCRouter({
	// Get all assignments
	getAll: adminProcedure.query(async ({ ctx }) => {
		return ctx.db.query.judgingAssignments.findMany({
			with: {
				team: true,
				table: tableWithRoundAndJudges,
				scores: true,
				votes: { columns: { id: true } }
			},
			orderBy: (rows, { asc }) => [asc(rows.startsAt)]
		});
	}),

	// Get assignments at every table a judge sits at in published rounds, with only their own scores and votes
	getByJudge: protectedProcedure
		.input(z.object({ judgeId: z.string() }))
		.query(async ({ ctx, input }) => {
			if (
				ctx.session.user.role !== "admin" &&
				input.judgeId !== ctx.session.user.id
			) {
				throw new TRPCError({ code: "FORBIDDEN" });
			}

			const tableJudgeRows = await ctx.db.query.judgingTableJudges.findMany({
				where: eq(judgingTableJudges.judgeId, input.judgeId),
				columns: { tableId: true }
			});
			const tableIds = tableJudgeRows.map((row) => row.tableId);
			if (tableIds.length === 0) return [];

			const assignments = await ctx.db.query.judgingAssignments.findMany({
				where: inArray(judgingAssignments.tableId, tableIds),
				with: {
					team: true,
					table: tableWithRoundAndJudges,
					scores: { where: eq(judgingScores.judgeId, input.judgeId) },
					votes: { where: eq(judgingVotes.judgeId, input.judgeId) }
				},
				orderBy: (rows, { asc }) => [asc(rows.startsAt)]
			});
			// Judges, like teams, only see a round's schedule once it is published
			return assignments.filter((assignment) =>
				Boolean(assignment.table.round.publishedAt)
			);
		}),

	// Every presentation time in the published rounds the judge sits in, across
	// all tables, by round ID. Without it, an empty slot at the judge's table
	// would look like a break.
	getRoundSlotTimes: judgeProcedure.query(async ({ ctx }) => {
		const seats = await ctx.db
			.select({ roundId: judgingTables.roundId })
			.from(judgingTableJudges)
			.innerJoin(
				judgingTables,
				eq(judgingTableJudges.tableId, judgingTables.id)
			)
			.where(eq(judgingTableJudges.judgeId, ctx.session.user.id));
		const roundIds = [...new Set(seats.map(({ roundId }) => roundId))];
		if (roundIds.length === 0) return {};

		const rows = await ctx.db
			.selectDistinct({
				roundId: judgingTables.roundId,
				startsAt: judgingAssignments.startsAt
			})
			.from(judgingAssignments)
			.innerJoin(
				judgingTables,
				eq(judgingAssignments.tableId, judgingTables.id)
			)
			.innerJoin(judgingRounds, eq(judgingTables.roundId, judgingRounds.id))
			.where(
				and(
					inArray(judgingTables.roundId, roundIds),
					isNotNull(judgingRounds.publishedAt)
				)
			)
			.orderBy(asc(judgingAssignments.startsAt));
		const slotTimes: Record<string, Date[]> = {};
		for (const { roundId, startsAt } of rows) {
			slotTimes[roundId] = [...(slotTimes[roundId] ?? []), startsAt];
		}
		return slotTimes;
	}),

	// The signed-in participant's team schedule, grouped by published round
	getMine: protectedProcedure.query(async ({ ctx }) => {
		const membership = await ctx.db.query.member.findFirst({
			where: eq(member.userId, ctx.session.user.id),
			columns: { organizationId: true }
		});
		if (!membership) return [];
		return getTeamSchedule(ctx.db, membership.organizationId);
	})
});
