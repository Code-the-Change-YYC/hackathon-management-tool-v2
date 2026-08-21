import { TRPCError } from "@trpc/server";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { DIETARY_RESTRICTIONS, PROGRAMS, user } from "@/server/db/auth-schema";
import { nameRegex } from "@/types/validation";

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
				banned: z.boolean().optional(),
				fname: z.string().min(1).optional(),
				lname: z.string().min(1).optional()
			})
		)
		.mutation(async ({ ctx, input }) => {
			const { id, ...data } = input;

			//--Input check--
			if (
				data.school &&
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
				!(
					(data.fname && data.lname && data.name) ||
					(!data.fname && !data.lname && !data.name)
				)
			) {
				//Somehow gave some of the required field forms (ex. fname but no lname)
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Missing required name inputs"
				});
			} else if (
				data.fname &&
				data.lname &&
				data.name &&
				(!nameRegex.test(data.fname) ||
					!nameRegex.test(data.lname) ||
					data.name !== `${data.fname} ${data.lname}`)
			) {
				//All name-related inputs given but improper
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Invalid name given"
				});
			}
			//---------------

			try {
				const [updated] = await ctx.db
					.update(user)
					.set(data)
					.where(eq(user.id, id))
					.returning();

				if (!updated) {
					//Did not update anything
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Specified user not found"
					});
				}

				return updated;
			} catch (errorObject) {
				if (errorObject instanceof Error) {
					throw new TRPCError({
						code: "INTERNAL_SERVER_ERROR",
						message: errorObject.message
					});
				}
			}
		}),
	completeRegistration: protectedProcedure
		.input(
			z.object({
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
