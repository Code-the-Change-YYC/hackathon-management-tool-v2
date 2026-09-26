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
	dietaryRestrictionsSchema,
	PROGRAMS,
	signupEventDetailsSchema
} from "@/lib/validation/signup";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { user } from "@/server/db/auth-schema";
import { Role } from "@/types/types";
import { nameRegex } from "@/types/validation";

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

			//--Input check--
			if (ctx.session.user.id !== id && ctx.session.user.role !== Role.ADMIN) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Only admins can change the information of other accounts"
				});
			} else if (data.name !== undefined && data.name !== null) {
				//Name provided
				const name = data.name.split(" ");
				if (
					name.length !== 2 ||
					name.map((name) => nameRegex.test(name)).includes(false)
				) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "Invalid name given"
					});
				}
			} else if (
				ctx.session.user.role !== Role.ADMIN &&
				ctx.session.user.role !== Role.JUDGE &&
				ctx.session.user.role !== Role.PARTICIPANT
			) {
				//Invalid user role
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Invalid user role"
				});
			} else if (
				data.school !== undefined &&
				data.school !== null &&
				![
					"University of Calgary",
					"Mount Royal University",
					"SAIT",
					"Other"
				].includes(data.school)
			) {
				//Input included but not what it's supposed to be
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Invalid institution name given"
				});
			} else if (
				data.completedRegistration !== undefined &&
				ctx.session.user.id === id &&
				ctx.session.user.role !== Role.ADMIN
			) {
				//Tries to adjust own registration bool
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Cannot bypass registration"
				});
			} else if (
				data.banned !== undefined &&
				ctx.session.user.id === id &&
				ctx.session.user.role !== Role.ADMIN
			) {
				//Tries to adjust own banned bool
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Cannot bypass ban"
				});
			}
			//---------------

			let updated = undefined as undefined | { id: string };
			try {
				[updated] = await ctx.db
					.update(user)
					.set(data)
					.where(eq(user.id, id))
					.returning({ id: user.id });
			} catch (errorObject) {
				if (errorObject instanceof Error) {
					throw new TRPCError({
						code: "INTERNAL_SERVER_ERROR",
						message: errorObject.message
					});
				}
			}

			if (!updated) {
				//Did not update anything
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Specified user not found"
				});
			}

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
		})
});
