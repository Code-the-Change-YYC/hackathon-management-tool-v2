import { TRPCError } from "@trpc/server";
import { addMinutes } from "date-fns";
import { and, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { ARRIVAL_BUFFER_MINUTES } from "@/lib/judging";
import { buildPanelSchedule, findLateTeamSlots } from "@/lib/judging-schedule";
import { submittedScorecards } from "@/server/api/judging-results";
import { adminProcedure, createTRPCRouter } from "@/server/api/trpc";
import type { db as dbType } from "@/server/db";
import { organization, user } from "@/server/db/auth-schema";
import {
	judgingAssignments,
	judgingRounds,
	judgingScores,
	judgingTableJudges,
	judgingTables,
	judgingVotes
} from "@/server/db/judging-schema";

export type DbClient =
	| typeof dbType
	| Parameters<Parameters<typeof dbType.transaction>[0]>[0];

const ScheduleSettingsSchema = z.object({
	roundId: z.string().uuid(),
	panelSize: z.number().int().min(1),
	changeoverMinutes: z.number().int().min(0),
	breakMinutes: z.number().int().min(0),
	maxBlockMinutes: z.number().int().min(1)
});

// Scores and final-round votes both pin a round's teams and times.
export async function assertRoundHasNoScores(db: DbClient, roundId: string) {
	const scored = await db
		.select({ id: judgingScores.id })
		.from(judgingScores)
		.innerJoin(
			judgingAssignments,
			eq(judgingScores.assignmentId, judgingAssignments.id)
		)
		.innerJoin(judgingTables, eq(judgingAssignments.tableId, judgingTables.id))
		.where(eq(judgingTables.roundId, roundId))
		.limit(1);
	if (scored.length > 0) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message:
				"Cannot replace this schedule because at least one assignment has scores."
		});
	}
	const voted = await db
		.select({ id: judgingVotes.id })
		.from(judgingVotes)
		.innerJoin(
			judgingAssignments,
			eq(judgingVotes.assignmentId, judgingAssignments.id)
		)
		.innerJoin(judgingTables, eq(judgingAssignments.tableId, judgingTables.id))
		.where(eq(judgingTables.roundId, roundId))
		.limit(1);
	if (voted.length > 0) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message:
				"Cannot change this round because judges have started ranking the finalists."
		});
	}
}

async function requireRound(db: DbClient, roundId: string) {
	const round = await db.query.judgingRounds.findFirst({
		where: eq(judgingRounds.id, roundId)
	});
	if (!round) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Judging round not found."
		});
	}
	return round;
}

async function requirePanelRound(db: DbClient, roundId: string) {
	const round = await requireRound(db, roundId);
	if (round.kind !== "panel") {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "Only panel rounds use the panel schedule generator."
		});
	}
	return round;
}

async function loadPanelScheduleInput(
	db: DbClient,
	settings: z.infer<typeof ScheduleSettingsSchema>
) {
	const round = await requirePanelRound(db, settings.roundId);
	const judges = await db.query.user.findMany({
		where: eq(user.role, "judge"),
		columns: { id: true },
		orderBy: (users, { asc }) => [asc(users.name)]
	});
	const teams = await db.query.organization.findMany({
		where: eq(organization.prescreenStatus, "passed"),
		columns: { id: true },
		orderBy: (orgs, { asc }) => [asc(orgs.name)]
	});
	return {
		round,
		input: {
			...settings,
			startTime: round.startTime,
			endTime: round.endTime,
			judgeIds: judges.map((judge) => judge.id),
			teamIds: teams.map((team) => team.id)
		}
	};
}

async function getRoundTableIds(db: DbClient, roundId: string) {
	const tables = await db.query.judgingTables.findMany({
		where: eq(judgingTables.roundId, roundId),
		columns: { id: true }
	});
	return tables.map((table) => table.id);
}

type PanelRound = Awaited<ReturnType<typeof requirePanelRound>>;

// The next free pair a late team could still arrive in time for.
async function findOpenLateTeamSlots(db: DbClient, round: PanelRound) {
	if (round.presentationMinutes === null) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "Generate a schedule before adding teams."
		});
	}
	const tables = await db.query.judgingTables.findMany({
		where: eq(judgingTables.roundId, round.id),
		columns: { id: true, tableNumber: true }
	});
	const assignments =
		tables.length === 0
			? []
			: await db.query.judgingAssignments.findMany({
					where: inArray(
						judgingAssignments.tableId,
						tables.map((table) => table.id)
					),
					columns: { teamId: true, tableId: true, startsAt: true }
				});
	const slots = findLateTeamSlots({
		tableIds: tables.map((table) => table.id),
		assignments,
		slotMinutes: round.presentationMinutes + round.changeoverMinutes,
		presentationMinutes: round.presentationMinutes,
		windowEnd: round.endTime,
		notBefore: addMinutes(new Date(), ARRIVAL_BUFFER_MINUTES)
	});
	const tableNumber = (tableId: string) =>
		tables.find((table) => table.id === tableId)?.tableNumber ?? 0;
	return {
		assignments,
		slots: slots && {
			first: { ...slots.first, tableNumber: tableNumber(slots.first.tableId) },
			second: {
				...slots.second,
				tableNumber: tableNumber(slots.second.tableId)
			}
		}
	};
}

const LateTeamSlotSchema = z.object({
	tableId: z.string().uuid(),
	startsAt: z.coerce.date()
});

export const judgingTablesRouter = createTRPCRouter({
	getLayoutByRound: adminProcedure
		.input(z.object({ roundId: z.string().uuid() }))
		.query(async ({ ctx, input }) => {
			const round = await requireRound(ctx.db, input.roundId);
			const [tables, scorecards] = await Promise.all([
				ctx.db.query.judgingTables.findMany({
					where: eq(judgingTables.roundId, input.roundId),
					with: {
						judges: {
							with: {
								judge: { columns: { id: true, name: true, email: true } }
							}
						},
						assignments: {
							with: {
								team: {
									columns: { id: true, name: true, prescreenStatus: true }
								}
							},
							orderBy: (rows, { asc }) => [asc(rows.startsAt)]
						}
					},
					orderBy: (rows, { asc }) => [asc(rows.tableNumber)]
				}),
				ctx.db.execute(sql`
    SELECT card.assignment_id AS "assignmentId", card.judge_id AS "judgeId"
    FROM ${submittedScorecards} card
    WHERE card.round_id = ${input.roundId}
  `) as unknown as Promise<{ assignmentId: string; judgeId: string }[]>
			]);
			const submitted = new Set(
				scorecards.map((card) => `${card.assignmentId}:${card.judgeId}`)
			);
			// Only judges still at the table count toward a team's scoring progress.
			return {
				round,
				tables: tables.map((table) => ({
					...table,
					assignments: table.assignments.map((assignment) => ({
						...assignment,
						scoredJudgeCount: table.judges.filter(({ judge }) =>
							submitted.has(`${assignment.id}:${judge.id}`)
						).length
					}))
				}))
			};
		}),

	previewSchedule: adminProcedure
		.input(ScheduleSettingsSchema)
		.query(async ({ ctx, input }) => {
			const { input: scheduleInput } = await loadPanelScheduleInput(
				ctx.db,
				input
			);
			return {
				judgeCount: scheduleInput.judgeIds.length,
				teamCount: scheduleInput.teamIds.length,
				result: buildPanelSchedule(scheduleInput)
			};
		}),

	generateSchedule: adminProcedure
		.input(
			ScheduleSettingsSchema.extend({ confirm: z.boolean().default(false) })
		)
		.mutation(async ({ ctx, input }) => {
			const { confirm, ...settings } = input;
			return ctx.db.transaction(async (tx) => {
				const { round, input: scheduleInput } = await loadPanelScheduleInput(
					tx,
					settings
				);
				await assertRoundHasNoScores(tx, round.id);
				if (round.publishedAt && !confirm) {
					throw new TRPCError({
						code: "CONFLICT",
						message:
							"This round is published. Regenerating changes every team's judging time."
					});
				}

				const result = buildPanelSchedule(scheduleInput);
				if (!result.ok) {
					throw new TRPCError({ code: "BAD_REQUEST", message: result.message });
				}
				const { schedule } = result;

				await tx
					.delete(judgingTables)
					.where(eq(judgingTables.roundId, round.id));
				const tables = await tx
					.insert(judgingTables)
					.values(
						schedule.tables.map((table) => ({
							roundId: round.id,
							tableNumber: table.tableNumber
						}))
					)
					.returning();
				const tableIdByNumber = new Map(
					tables.map((table) => [table.tableNumber, table.id])
				);
				const tableId = (tableNumber: number) => {
					const id = tableIdByNumber.get(tableNumber);
					if (!id) {
						throw new TRPCError({
							code: "INTERNAL_SERVER_ERROR",
							message: `Table ${tableNumber} was not created.`
						});
					}
					return id;
				};

				await tx.insert(judgingTableJudges).values(
					schedule.tables.flatMap((table) =>
						table.judgeIds.map((judgeId) => ({
							tableId: tableId(table.tableNumber),
							judgeId
						}))
					)
				);
				await tx.insert(judgingAssignments).values(
					schedule.assignments.map((assignment) => ({
						teamId: assignment.teamId,
						tableId: tableId(assignment.tableNumber),
						startsAt: assignment.startsAt
					}))
				);
				await tx
					.update(judgingRounds)
					.set({
						panelSize: settings.panelSize,
						changeoverMinutes: settings.changeoverMinutes,
						breakMinutes: settings.breakMinutes,
						maxBlockMinutes: settings.maxBlockMinutes,
						presentationMinutes: schedule.presentationMinutes
					})
					.where(eq(judgingRounds.id, round.id));

				return schedule;
			});
		}),

	// Frees a dropped team's slots without moving anyone else.
	removeTeam: adminProcedure
		.input(z.object({ roundId: z.string().uuid(), teamId: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const tableIds = await getRoundTableIds(ctx.db, input.roundId);
			if (tableIds.length === 0) return { removed: 0 };

			const assignments = await ctx.db.query.judgingAssignments.findMany({
				where: and(
					eq(judgingAssignments.teamId, input.teamId),
					inArray(judgingAssignments.tableId, tableIds)
				),
				with: { scores: { columns: { id: true }, limit: 1 } }
			});
			if (assignments.some((assignment) => assignment.scores.length > 0)) {
				throw new TRPCError({
					code: "CONFLICT",
					message: "This team has already been scored in this round."
				});
			}
			if (assignments.length === 0) return { removed: 0 };

			await ctx.db.delete(judgingAssignments).where(
				inArray(
					judgingAssignments.id,
					assignments.map((assignment) => assignment.id)
				)
			);
			return { removed: assignments.length };
		}),

	previewLateTeamSlots: adminProcedure
		.input(z.object({ roundId: z.string().uuid() }))
		.query(async ({ ctx, input }) => {
			const round = await requirePanelRound(ctx.db, input.roundId);
			const { slots } = await findOpenLateTeamSlots(ctx.db, round);
			return slots;
		}),

	// Places a late team in the slots the admin was shown, if they're still
	// the next free pair.
	addTeam: adminProcedure
		.input(
			z.object({
				roundId: z.string().uuid(),
				teamId: z.string(),
				first: LateTeamSlotSchema,
				second: LateTeamSlotSchema
			})
		)
		.mutation(async ({ ctx, input }) => {
			const round = await requirePanelRound(ctx.db, input.roundId);
			const team = await ctx.db.query.organization.findFirst({
				where: eq(organization.id, input.teamId)
			});
			if (!team) {
				throw new TRPCError({ code: "NOT_FOUND", message: "Team not found." });
			}
			if (team.prescreenStatus !== "passed") {
				throw new TRPCError({
					code: "CONFLICT",
					message: "Only prescreen-passed teams can be judged."
				});
			}

			const { assignments, slots } = await findOpenLateTeamSlots(ctx.db, round);
			if (assignments.some((assignment) => assignment.teamId === team.id)) {
				throw new TRPCError({
					code: "CONFLICT",
					message: "This team is already scheduled in this round."
				});
			}
			if (!slots) {
				throw new TRPCError({
					code: "CONFLICT",
					message:
						"There are no back-to-back free slots left at two different tables."
				});
			}
			const sameSlot = (
				slot: z.infer<typeof LateTeamSlotSchema>,
				expected: z.infer<typeof LateTeamSlotSchema>
			) =>
				slot.tableId === expected.tableId &&
				slot.startsAt.getTime() === expected.startsAt.getTime();
			if (
				!sameSlot(slots.first, input.first) ||
				!sameSlot(slots.second, input.second)
			) {
				throw new TRPCError({
					code: "CONFLICT",
					message:
						"Those slots are no longer the next free ones. Check the new times and add the team again."
				});
			}

			await ctx.db.insert(judgingAssignments).values([
				{ teamId: team.id, ...input.first },
				{ teamId: team.id, ...input.second }
			]);
			return slots;
		}),

	// Moves a judge to a table in the round, or removes them when tableId is null.
	assignJudge: adminProcedure
		.input(
			z.object({
				roundId: z.string().uuid(),
				judgeId: z.string(),
				tableId: z.string().uuid().nullable()
			})
		)
		.mutation(async ({ ctx, input }) => {
			const judge = await ctx.db.query.user.findFirst({
				where: eq(user.id, input.judgeId),
				columns: { role: true }
			});
			if (judge?.role !== "judge") {
				throw new TRPCError({ code: "NOT_FOUND", message: "Judge not found." });
			}

			const tableIds = await getRoundTableIds(ctx.db, input.roundId);
			if (input.tableId && !tableIds.includes(input.tableId)) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "That table is not part of this round."
				});
			}

			const seat =
				tableIds.length === 0
					? undefined
					: await ctx.db.query.judgingTableJudges.findFirst({
							where: and(
								eq(judgingTableJudges.judgeId, input.judgeId),
								inArray(judgingTableJudges.tableId, tableIds)
							),
							with: {
								table: {
									columns: { tableNumber: true },
									with: { judges: { columns: { judgeId: true } } }
								}
							}
						});
			if (seat && seat.tableId !== input.tableId) {
				// A judge's scorecards count for the table they scored at, and every
				// team at a table needs a judge to be scored.
				const [scored] = await ctx.db
					.select({ id: judgingScores.id })
					.from(judgingScores)
					.innerJoin(
						judgingAssignments,
						eq(judgingScores.assignmentId, judgingAssignments.id)
					)
					.where(
						and(
							eq(judgingScores.judgeId, input.judgeId),
							eq(judgingAssignments.tableId, seat.tableId)
						)
					)
					.limit(1);
				if (scored) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: `This judge has already scored teams at Table ${seat.table.tableNumber}, so they can’t move.`
					});
				}
				if (seat.table.judges.length === 1) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: `This judge is the only one at Table ${seat.table.tableNumber}. Move another judge there first.`
					});
				}
			}

			await ctx.db.transaction(async (tx) => {
				if (tableIds.length > 0) {
					await tx
						.delete(judgingTableJudges)
						.where(
							and(
								eq(judgingTableJudges.judgeId, input.judgeId),
								inArray(judgingTableJudges.tableId, tableIds)
							)
						);
				}
				if (input.tableId) {
					await tx
						.insert(judgingTableJudges)
						.values({ tableId: input.tableId, judgeId: input.judgeId });
				}
			});
			return { success: true };
		})
});
