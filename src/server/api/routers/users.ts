/**
 * tRPC router for user management.
 *
 * Onboarding saves each step as the user goes (`updateProfile`,
 * `updateFoodPreferences`), then `completeRegistration` marks the account
 * registered. It also upgrades `role` to PARTICIPANT when it isn't already a
 * real app role: better-auth gives new sign-ups a generic default role
 * ("user") that isn't one of this app's roles, so left as-is, they would get
 * redirected out of every role-gated page (e.g. `/participant`). The SQL
 * `case` guards against downgrading an existing admin/judge.
 */

import { TRPCError } from "@trpc/server";
import { desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { AVATAR_IDS, getAvatarSrc } from "@/lib/avatars";
import { getFullName } from "@/lib/names";
import { hasRegistrationDetails } from "@/lib/onboarding";
import { profileSchema } from "@/lib/validation/profile";
import {
	dietaryRestrictionsSchema,
	foodPreferencesSchema,
	PROGRAMS
} from "@/lib/validation/signup";
import {
	adminProcedure,
	createTRPCRouter,
	protectedProcedure
} from "@/server/api/trpc";
import { user } from "@/server/db/auth-schema";
import { Role } from "@/types/types";

export const usersRouter = createTRPCRouter({
	getAll: protectedProcedure.query(async ({ ctx }) => {
		const users = await ctx.db.query.user.findMany({
			orderBy: [desc(user.createdAt)]
		});
		return users;
	}),
	updateUserDietaryRestrictions: protectedProcedure
		.input(
			z.object({
				dietaryRestrictions: dietaryRestrictionsSchema
			})
		)
		.mutation(async ({ ctx, input }) => {
			const [updated] = await ctx.db
				.update(user)
				.set({ dietaryRestrictions: input.dietaryRestrictions })
				.where(eq(user.id, ctx.session.user.id))
				.returning();

			if (!updated) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "User not found"
				});
			}

			return updated;
		}),
	updateProfile: protectedProcedure
		.input(profileSchema)
		.mutation(async ({ ctx, input }) => {
			const [updated] = await ctx.db
				.update(user)
				.set({
					name: getFullName(input.firstName, input.lastName),
					school: input.school,
					program: input.program
				})
				.where(eq(user.id, ctx.session.user.id))
				.returning();

			if (!updated) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "User not found"
				});
			}

			return updated;
		}),
	updateFoodPreferences: protectedProcedure
		.input(foodPreferencesSchema)
		.mutation(async ({ ctx, input }) => {
			const [updated] = await ctx.db
				.update(user)
				.set({
					wantsFood: input.wantsFood,
					dietaryRestrictions: input.dietaryRestrictions
				})
				.where(eq(user.id, ctx.session.user.id))
				.returning();

			if (!updated) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "User not found"
				});
			}

			return updated;
		}),
	updateAvatar: protectedProcedure
		.input(z.object({ avatarId: z.enum(AVATAR_IDS) }))
		.mutation(async ({ ctx, input }) => {
			const [updated] = await ctx.db
				.update(user)
				.set({ image: getAvatarSrc(input.avatarId) })
				.where(eq(user.id, ctx.session.user.id))
				.returning();

			if (!updated) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "User not found"
				});
			}

			return updated;
		}),
	update: adminProcedure
		.input(
			z.object({
				id: z.string(),
				name: z.string().min(1).optional(),
				email: z.string().email().optional(),
				role: z.string().optional().nullable(),
				dietaryRestrictions: dietaryRestrictionsSchema.optional(),
				school: z.string().optional().nullable(),
				program: z.enum(PROGRAMS).optional().nullable(),
				completedRegistration: z.boolean().optional(),
				banned: z.boolean().optional()
			})
		)
		.mutation(async ({ ctx, input }) => {
			const { id, ...data } = input;
			const [updated] = await ctx.db
				.update(user)
				.set(data)
				.where(eq(user.id, id))
				.returning();
			return updated;
		}),
	completeRegistration: protectedProcedure.mutation(async ({ ctx }) => {
		if (!hasRegistrationDetails(ctx.session.user)) {
			throw new TRPCError({
				code: "PRECONDITION_FAILED",
				message: "Finish your personal details and food preferences first"
			});
		}

		const [updated] = await ctx.db
			.update(user)
			.set({
				completedRegistration: true,
				role: sql`case when ${user.role} in (${Role.ADMIN}, ${Role.JUDGE}, ${Role.PARTICIPANT}) then ${user.role} else ${Role.PARTICIPANT} end`
			})
			.where(eq(user.id, ctx.session.user.id))
			.returning({ role: user.role });

		if (!updated) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Authenticated user not found"
			});
		}

		return updated;
	})
});
