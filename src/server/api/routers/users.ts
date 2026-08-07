import { TRPCError } from "@trpc/server";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import {
	createTRPCRouter,
	protectedProcedure,
	publicProcedure
} from "@/server/api/trpc";
import { DIETARY_RESTRICTIONS, PROGRAMS, user } from "@/server/db/auth-schema";

const dietaryRestrictionsSchema = z
	.array(z.enum(DIETARY_RESTRICTIONS))
	.max(DIETARY_RESTRICTIONS.length)
	.refine(
		(restrictions) => new Set(restrictions).size === restrictions.length,
		{ message: "Duplicate dietary restrictions are not allowed" }
	)
	.refine(
		(restrictions) =>
			!restrictions.includes("none") || restrictions.length === 1,
		{ message: '"None" cannot be combined with another restriction' }
	);

export const usersRouter = createTRPCRouter({
	getAll: protectedProcedure.query(async ({ ctx }) => {
		const users = await ctx.db.query.user.findMany({
			orderBy: [desc(user.createdAt)]
		});
		return users;
	}),
	update: protectedProcedure
		.input(
			z.object({
				id: z.string(),
				name: z.string().min(1).optional(),
				email: z.string().email().optional(),
				role: z.string().optional().nullable(),
				dietaryRestrictions: dietaryRestrictionsSchema.optional().nullable(),
				school: z.string().optional().nullable(),
				program: z.enum(PROGRAMS).optional().nullable(),
				completedRegistration: z.boolean().optional(),
				banned: z.boolean().optional(),
				fname: z.string().min(1).optional(),
				lname: z.string().min(1).optional(),
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
				dietaryRestrictions: dietaryRestrictionsSchema.optional().nullable(),
				wantsFood: z.enum(["yes", "no"]).optional()
			})
		)
		.mutation(async ({ ctx, input }) => {
			const [updated] = await ctx.db
				.update(user)
				.set({
					school: input.school?.trim() ? input.school.trim() : null,
					program: input.program ?? null,
					dietaryRestrictions: input.dietaryRestrictions ?? null,
					completedRegistration: true
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
