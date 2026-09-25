import { and, eq, isNull, ne, or } from "drizzle-orm";
import { z } from "zod";
import { RESET_CONFIRMATION_PHRASE } from "@/lib/constants";
import {
	adminProcedure,
	createTRPCRouter,
	publicProcedure
} from "@/server/api/trpc";
import { organization, user } from "@/server/db/auth-schema";
import { hackathonSettings, judgingRooms, scores } from "@/server/db/schema";
import { Role } from "@/types/types";

export const hackathonSettingsRouter = createTRPCRouter({
	// Get current hackathon settings
	get: publicProcedure.query(async ({ ctx }) => {
		const settings = await ctx.db.query.hackathonSettings.findFirst({
			where: eq(hackathonSettings.id, 1)
		});
		return settings ?? null;
	}),

	// Update hackathon settings (admin only)
	update: adminProcedure
		.input(
			z.object({
				startDate: z.date().optional(),
				endDate: z.date().optional(),
				isActive: z.boolean().optional(),
				currentRoundId: z.string().uuid().optional().nullable()
			})
		)
		.mutation(async ({ ctx, input }) => {
			const [updated] = await ctx.db
				.insert(hackathonSettings)
				.values({
					id: 1,
					...input
				})
				.onConflictDoUpdate({
					target: hackathonSettings.id,
					set: input
				})
				.returning();
			return updated;
		}),

	resetHackathon: adminProcedure
		.input(
			z
				.object({
					confirmation: z.literal(RESET_CONFIRMATION_PHRASE),
					users: z.boolean().default(false),
					teams: z.boolean().default(false),
					rooms: z.boolean().default(false),
					scores: z.boolean().default(false)
				})
				.refine(
					({ users, teams, rooms, scores }) =>
						users || teams || rooms || scores,
					{ message: "Select at least one reset field." }
				)
		)
		.mutation(async ({ ctx, input }) => {
			return ctx.db.transaction(async (tx) => {
				if (input.scores) {
					await tx.delete(scores);
				}

				if (input.rooms) {
					await tx.delete(judgingRooms);
				}

				if (input.teams) {
					await tx.delete(organization);
				}

				if (input.users) {
					// Reset users while preserving admins and judges
					await tx
						.delete(user)
						.where(
							or(
								isNull(user.role),
								and(ne(user.role, Role.ADMIN), ne(user.role, Role.JUDGE))
							)
						);
				}

				return { success: true };
			});
		})
});
