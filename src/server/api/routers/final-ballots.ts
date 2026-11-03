import { TRPCError } from "@trpc/server";
import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { getBallotPlaces } from "@/lib/judging";
import { areScoresReleased } from "@/server/api/participant-judging";
import { createTRPCRouter, judgeProcedure } from "@/server/api/trpc";
import { hackathonSettings } from "@/server/db/admin-schema";
import { judgingRounds, judgingVotes } from "@/server/db/judging-schema";

export const finalBallotsRouter = createTRPCRouter({
	// Replaces the judge's ballot with the given finalists, from 1st place.
	// Ballots open when the final round starts and close once scores are released.
	submit: judgeProcedure
		.input(z.object({ assignmentIds: z.array(z.string().uuid()).min(1) }))
		.mutation(async ({ ctx, input }) => {
			const judgeId = ctx.session.user.id;
			const [round, settings] = await Promise.all([
				ctx.db.query.judgingRounds.findFirst({
					where: eq(judgingRounds.kind, "final"),
					with: {
						tables: {
							with: {
								judges: { columns: { judgeId: true } },
								assignments: { columns: { id: true } }
							}
						}
					}
				}),
				ctx.db.query.hackathonSettings.findFirst({
					where: eq(hackathonSettings.id, 1)
				})
			]);
			const table = round?.tables[0];
			if (
				!round?.publishedAt ||
				!table?.judges.some((judge) => judge.judgeId === judgeId)
			) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You are not judging the final round."
				});
			}
			if (round.startTime > new Date()) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Ranking opens when the final round starts."
				});
			}
			if (areScoresReleased(settings)) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Ranking closed when the winners were announced."
				});
			}

			const finalistIds = new Set(table.assignments.map(({ id }) => id));
			const places = getBallotPlaces(finalistIds.size);
			if (
				new Set(input.assignmentIds).size !== input.assignmentIds.length ||
				input.assignmentIds.length !== places ||
				input.assignmentIds.some((id) => !finalistIds.has(id))
			) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: `Rank ${places} different finalists.`
				});
			}

			return ctx.db.transaction(async (tx) => {
				await tx
					.delete(judgingVotes)
					.where(
						and(
							eq(judgingVotes.judgeId, judgeId),
							inArray(judgingVotes.assignmentId, [...finalistIds])
						)
					);
				return tx
					.insert(judgingVotes)
					.values(
						input.assignmentIds.map((assignmentId, index) => ({
							assignmentId,
							judgeId,
							place: index + 1
						}))
					)
					.returning();
			});
		})
});
