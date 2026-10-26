/**
 * tRPC router for user management.
 *
 * Onboarding saves each step as the user goes (`updateProfile`,
 * `updateFoodPreferences`, `acceptMlhPolicies`), then `completeRegistration`
 * marks the account registered. It also upgrades `role` to PARTICIPANT when it isn't already a
 * real app role: better-auth gives new sign-ups a generic default role
 * ("user") that isn't one of this app's roles, so left as-is, they would get
 * redirected out of every role-gated page (e.g. `/participant`). The SQL
 * `case` guards against downgrading an existing admin/judge.
 */

import { TRPCError } from "@trpc/server";
import { and, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { AVATAR_IDS, getAvatarSrc } from "@/lib/avatars";
import { getFullName } from "@/lib/names";
import { hasRegistrationDetails } from "@/lib/onboarding";
import { mlhPoliciesSchema } from "@/lib/validation/mlh";
import { profileSchema } from "@/lib/validation/profile";
import {
	DIETARY_RESTRICTIONS,
	type DietaryRestriction,
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
import { applyInvitedRole } from "./invitations";

function getRole(role: string | null) {
	if (role === null) return null;

	switch (role.toLocaleLowerCase()) {
		case "admin":
			return Role.ADMIN;
		case "judge":
			return Role.JUDGE;
		case "participant":
			return Role.PARTICIPANT;
		default:
			return null;
	}
}

export const usersRouter = createTRPCRouter({
	getAll: adminProcedure.query(async ({ ctx }) => {
		const users = await ctx.db.query.user.findMany({
			orderBy: [desc(user.createdAt)]
		});
		return users;
	}),
	getUserWithTeam: adminProcedure.query(async ({ ctx }) => {
		const rows = await ctx.db.query.user.findMany({
			orderBy: [desc(user.createdAt)],
			columns: {
				id: true,
				firstName: true,
				lastName: true,
				email: true,
				role: true,
				school: true,
				program: true,
				wantsFood: true,
				createdAt: true,
				emailVerified: true,
				completedRegistration: true
			},
			with: {
				members: {
					with: {
						organization: {
							columns: {
								name: true
							}
						}
					}
				}
			}
		});

		return rows.map(({ members, ...person }) => {
			const team = members[0]?.organization;

			return {
				id: person.id,
				firstName: person.firstName,
				lastName: person.lastName,
				email: person.email,
				role: getRole(person.role),
				teamName: team?.name ?? null,
				signedUpAt: person.createdAt,
				emailVerified: person.emailVerified,
				completedRegistration: person.completedRegistration,
				institution: person.school,
				major: person.program,
				registeredForFood: person.wantsFood
			};
		});
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
					firstName: input.firstName,
					lastName: input.lastName,
					age: input.age,
					phoneNumber: input.phoneNumber,
					countryOfResidence: input.countryOfResidence,
					school: input.school,
					levelOfStudy: input.levelOfStudy,
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
	acceptMlhPolicies: protectedProcedure
		.input(mlhPoliciesSchema)
		.mutation(async ({ ctx, input }) => {
			// The schema only lets this through once both required boxes are ticked.
			const acceptedAt = new Date();
			const [updated] = await ctx.db
				.update(user)
				.set({
					mlhCodeOfConductAcceptedAt: acceptedAt,
					mlhDataSharingAcceptedAt: acceptedAt,
					mlhEmailOptIn: input.emailOptIn
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
			z
				.object({
					id: z.string(),
					firstName: z.string().trim().min(1).optional(),
					lastName: z.string().trim().min(1).optional(),
					email: z.string().email().optional(),
					role: z.string().optional().nullable(),
					dietaryRestrictions: dietaryRestrictionsSchema.optional(),
					school: z.string().optional().nullable(),
					program: z.enum(PROGRAMS).optional().nullable(),
					completedRegistration: z.boolean().optional(),
					banned: z.boolean().optional()
				})
				.superRefine(({ firstName, lastName }, ctx) => {
					if (firstName !== undefined && lastName === undefined) {
						ctx.addIssue({
							code: "custom",
							path: ["lastName"],
							message: "Last name is required when first name is provided"
						});
					}

					if (lastName !== undefined && firstName === undefined) {
						ctx.addIssue({
							code: "custom",
							path: ["firstName"],
							message: "First name is required when last name is provided"
						});
					}
				})
		)
		.mutation(async ({ ctx, input }) => {
			const { id, firstName, lastName, ...data } = input;

			const nameFields =
				firstName !== undefined && lastName !== undefined
					? {
							firstName,
							lastName,
							name: getFullName(firstName, lastName)
						}
					: {};

			const [updated] = await ctx.db
				.update(user)
				.set({
					...data,
					...nameFields
				})
				.where(eq(user.id, id))
				.returning();

			if (!updated) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "User not found"
				});
			}

			return updated;
		}),
	completeRegistration: protectedProcedure.mutation(async ({ ctx }) => {
		if (!hasRegistrationDetails(ctx.session.user)) {
			throw new TRPCError({
				code: "PRECONDITION_FAILED",
				message: "Finish the earlier registration steps first"
			});
		}

		return ctx.db.transaction(async (tx) => {
			const [updated] = await tx
				.update(user)
				.set({
					completedRegistration: true,
					role: sql`case when ${user.role} in (${Role.ADMIN}, ${Role.JUDGE}, ${Role.PARTICIPANT}) then ${user.role} else ${Role.PARTICIPANT} end`
				})
				.where(eq(user.id, ctx.session.user.id))
				.returning({ id: user.id, email: user.email, role: user.role });

			if (!updated) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Authenticated user not found"
				});
			}

			const invitedRole = await applyInvitedRole(tx, updated.id, updated.email);
			return { role: invitedRole ?? updated.role };
		});
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
		const counts: Record<DietaryRestriction, number> = Object.fromEntries(
			DIETARY_RESTRICTIONS.map((restriction) => [restriction, 0])
		) as Record<DietaryRestriction, number>;

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

		for (const currentUser of users) {
			const selected = new Set(currentUser.dietaryRestrictions);

			for (const restriction of DIETARY_RESTRICTIONS) {
				if (selected.has(restriction)) {
					counts[restriction] = (counts[restriction] ?? 0) + 1;
					overlaps[restriction][restriction] =
						(overlaps[restriction][restriction] ?? 0) + 1;
				}
			}

			for (const [left, right] of pairs) {
				if (selected.has(left) && selected.has(right)) {
					overlaps[left][right] = (overlaps[left][right] ?? 0) + 1;
					overlaps[right][left] = (overlaps[right][left] ?? 0) + 1;
				}
			}
		}

		return {
			counts,
			overlaps
		};
	})
});
