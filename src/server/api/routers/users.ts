import { TRPCError } from "@trpc/server";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import {
	dietaryRestrictionsSchema,
	PROGRAMS,
	signupEventDetailsSchema
} from "@/lib/validation/signup";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { user } from "@/server/db/auth-schema";

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
					completedRegistration: true
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
