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
import { and, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import {
	DIETARY_RESTRICTIONS,
	type DietaryRestriction,
	dietaryRestrictionsSchema,
	PROGRAMS,
	signupEventDetailsSchema
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
	completeRegistration: protectedProcedure
		.input(signupEventDetailsSchema)
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
				.where(eq(user.id, ctx.session.user.id))
				.returning();

			if (!updated) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Authenticated user not found"
				});
			}

			return {
				user: updated,
				wantsFood: input.wantsFood,
				wantsFoodStored: false
			};
		}),
	getDietaryAnalytics: adminProcedure.query(async ({ ctx }) => {
		const users = await ctx.db.query.user.findMany({
			columns: {
				dietaryRestrictions: true
			},
			where: and(
				eq(user.role, Role.PARTICIPANT),
				eq(user.completedRegistration, true)
			)
		});

		// Calculate totals
		const counts = Object.fromEntries(
			DIETARY_RESTRICTIONS.map((restriction) => [restriction, 0])
		);

		// Calculate overlaps
		const overlaps: Record<
			DietaryRestriction,
			Record<DietaryRestriction, number>
		> = Object.fromEntries(
			DIETARY_RESTRICTIONS.map((left) => [
				left,
				Object.fromEntries(DIETARY_RESTRICTIONS.map((right) => [right, 0]))
			])
		) as Record<DietaryRestriction, Record<DietaryRestriction, number>>;
		const pairs: [DietaryRestriction, DietaryRestriction][] =
			DIETARY_RESTRICTIONS.flatMap((left, index) =>
				DIETARY_RESTRICTIONS.slice(index + 1).map(
					(right) => [left, right] as [DietaryRestriction, DietaryRestriction]
				)
			);
		// const overlaps: Record<string, Record<string, number>> = {};
		// for (const [left, right] of pairs) {
		// 	overlaps[left] = {};
		// 	overlaps[left][right] = 0;
		// }

		for (const currentUser of users) {
			const selected = new Set(currentUser.dietaryRestrictions);

			for (const restriction of DIETARY_RESTRICTIONS) {
				if (selected.has(restriction)) {
					counts[restriction] = (counts[restriction] ?? 0) + 1;
				}
			}

			for (const [left, right] of pairs) {
				if (selected.has(left) && selected.has(right)) {
					overlaps[left][right] = (overlaps[left][right] ?? 0) + 1;
				}
			}
		}

		return {
			counts,
			overlaps
		};
	})
});
