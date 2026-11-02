import { TRPCError } from "@trpc/server";
import { eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { getTeamSchedule } from "@/server/api/participant-judging";
import {
	adminProcedure,
	createTRPCRouter,
	protectedProcedure
} from "@/server/api/trpc";
import { member } from "@/server/db/auth-schema";
import {
	judgingAssignments,
	judgingScores,
	judgingTableJudges,
	judgingTables
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
				scores: true
			},
			orderBy: (rows, { asc }) => [asc(rows.startsAt)]
		});
	}),

	// Get assignments by round ID
	getByRound: adminProcedure
		.input(z.object({ roundId: z.string().uuid() }))
		.query(async ({ ctx, input }) => {
			const roundTables = await ctx.db
				.select({ id: judgingTables.id })
				.from(judgingTables)
				.where(eq(judgingTables.roundId, input.roundId));
			const tableIds = roundTables.map((table) => table.id);
			if (tableIds.length === 0) return [];

			return ctx.db.query.judgingAssignments.findMany({
				where: inArray(judgingAssignments.tableId, tableIds),
				with: {
					team: true,
					table: tableWithRoundAndJudges,
					scores: true
				},
				orderBy: (rows, { asc }) => [asc(rows.startsAt)]
			});
		}),

	// Get assignments at every table a judge sits at in published rounds, with only their own scores
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
					scores: { where: eq(judgingScores.judgeId, input.judgeId) }
				},
				orderBy: (rows, { asc }) => [asc(rows.startsAt)]
			});
			// Judges, like teams, only see a round's schedule once it is published
			return assignments.filter((assignment) =>
				Boolean(assignment.table.round.publishedAt)
			);
		}),

	// Get assignments for a specific team
	getByTeam: adminProcedure
		.input(z.object({ teamId: z.string() }))
		.query(async ({ ctx, input }) => {
			return ctx.db.query.judgingAssignments.findMany({
				where: eq(judgingAssignments.teamId, input.teamId),
				with: {
					table: { with: { round: true } },
					scores: true
				},
				orderBy: (rows, { asc }) => [asc(rows.startsAt)]
			});
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
