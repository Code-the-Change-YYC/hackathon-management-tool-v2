/**
 * tRPC router for user management.
 *
 * `completeRegistrationByEmail` upgrades `role` to PARTICIPANT when it
 * isn't already a real app role: better-auth's `signUpEmail` sets a
 * generic default role ("user") that isn't one of this app's roles, so
 * left as-is, new self-service signups would get redirected out of every
 * role-gated page (e.g. `/participant`, `/team`). The SQL `case` guards
 * against downgrading an existing admin/judge.
 */

import { TRPCError } from "@trpc/server";
import { desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import {
	createTRPCRouter,
	protectedProcedure,
	publicProcedure
} from "@/server/api/trpc";
import { DIETARY_RESTRICTIONS, PROGRAMS, user } from "@/server/db/auth-schema";
import { Role } from "@/types/types";

const dietaryRestrictionsSchema = z
	.array(z.enum(DIETARY_RESTRICTIONS))
	.max(DIETARY_RESTRICTIONS.length)
	.refine(
		(restrictions) => new Set(restrictions).size === restrictions.length,
		{ message: "Duplicate dietary restrictions are not allowed" }
	);

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
	update: protectedProcedure
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
	completeRegistrationByEmail: publicProcedure
		.input(
			z.object({
				email: z.string().email(),
				school: z.string().optional(),
				program: z.enum(PROGRAMS).optional(),
				dietaryRestrictions: dietaryRestrictionsSchema.optional(),
				wantsFood: z.enum(["yes", "no"]).optional()
			})
		)
		.mutation(async ({ ctx, input }) => {
			const [updated] = await ctx.db
				.update(user)
				.set({
					school: input.school?.trim() ? input.school.trim() : null,
					program: input.program ?? null,
					dietaryRestrictions: input.dietaryRestrictions ?? [],
					completedRegistration: true,
					role: sql`case when ${user.role} in (${Role.ADMIN}, ${Role.JUDGE}, ${Role.PARTICIPANT}) then ${user.role} else ${Role.PARTICIPANT} end`
				})
				.where(eq(user.email, input.email))
				.returning();

			if (!updated) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "User not found for registration update"
				});
			}

			return {
				user: updated,
				wantsFood: input.wantsFood,
				wantsFoodStored: false
			};
		})
});
