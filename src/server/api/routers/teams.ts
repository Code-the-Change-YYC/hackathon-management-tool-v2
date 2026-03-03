/**
 * Teams router — manages hackathon teams backed by the `organization` table.
 *
 * Key behaviours:
 * - Team names are validated to reject emojis and special characters.
 * - Each team gets a unique 4-char uppercase hex team code on creation.
 * - A user may belong to at most one team at a time.
 * - Non-leader members can join a team via its team code.
 * - Team owners can invite other users by email (creates an invitation record).
 * - When the last member leaves a team the organization row is deleted automatically.
 * - All multi-row mutations are wrapped in transactions for atomicity.
 */

import crypto from "node:crypto";
import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import {
	invitation,
	member,
	organization,
	user
} from "@/server/db/auth-schema";
import { MEMBER_ROLES } from "@/types/types";

const teamNameSchema = z
	.string()
	.min(1, "Team name is required")
	.max(50, "Team name must be 50 characters or less")
	.regex(
		/^[a-zA-Z0-9\s\-_]+$/,
		"Team name can only contain letters, numbers, spaces, hyphens, and underscores"
	);

function generateTeamCode(): string {
	return crypto.randomBytes(2).toString("hex").toUpperCase();
}

export const teamsRouter = createTRPCRouter({
	getAll: protectedProcedure.query(async ({ ctx }) => {
		const teams = await ctx.db.query.organization.findMany({
			orderBy: [desc(organization.createdAt)]
		});
		return teams;
	}),

	create: protectedProcedure
		.input(
			z.object({
				name: teamNameSchema
			})
		)
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session.user.id;

			const existing = await ctx.db.query.member.findFirst({
				where: eq(member.userId, userId)
			});
			if (existing) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "You are already a member of a team"
				});
			}

			const teamId = crypto.randomUUID();
			const teamCode = generateTeamCode();
			const slug = input.name
				.toLowerCase()
				.replace(/\s+/g, "-")
				.replace(/[^a-z0-9-]/g, "");

			const team = await ctx.db.transaction(async (tx) => {
				const [newTeam] = await tx
					.insert(organization)
					.values({
						id: teamId,
						name: input.name,
						slug: `${slug}-${crypto.randomBytes(2).toString("hex")}`,
						createdAt: new Date(),
						teamCode
					})
					.returning();

				await tx.insert(member).values({
					id: crypto.randomUUID(),
					organizationId: teamId,
					userId,
					role: MEMBER_ROLES.OWNER,
					createdAt: new Date()
				});

				return newTeam;
			});

			return team;
		}),

	join: protectedProcedure
		.input(
			z.object({
				teamCode: z
					.string()
					.length(4, "Team code must be exactly 4 characters")
					.toUpperCase()
			})
		)
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session.user.id;

			const existing = await ctx.db.query.member.findFirst({
				where: eq(member.userId, userId)
			});
			if (existing) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "You are already a member of a team"
				});
			}

			const team = await ctx.db.query.organization.findFirst({
				where: eq(organization.teamCode, input.teamCode)
			});
			if (!team) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "No team found with that code"
				});
			}

			await ctx.db.insert(member).values({
				id: crypto.randomUUID(),
				organizationId: team.id,
				userId,
				role: MEMBER_ROLES.MEMBER,
				createdAt: new Date()
			});

			return team;
		}),

	invite: protectedProcedure
		.input(
			z.object({
				email: z.string().email("Invalid email address")
			})
		)
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session.user.id;

			const ownerMembership = await ctx.db.query.member.findFirst({
				where: and(
					eq(member.userId, userId),
					eq(member.role, MEMBER_ROLES.OWNER)
				)
			});
			if (!ownerMembership) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Only team owners can send invitations"
				});
			}

			const invitedUser = await ctx.db.query.user.findFirst({
				where: eq(user.email, input.email)
			});
			if (invitedUser) {
				const alreadyInTeam = await ctx.db.query.member.findFirst({
					where: eq(member.userId, invitedUser.id)
				});
				if (alreadyInTeam) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "That user is already a member of a team"
					});
				}
			}

			const existingInvite = await ctx.db.query.invitation.findFirst({
				where: and(
					eq(invitation.organizationId, ownerMembership.organizationId),
					eq(invitation.email, input.email),
					eq(invitation.status, "pending")
				)
			});
			if (existingInvite) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "An invitation has already been sent to this email"
				});
			}

			const [newInvitation] = await ctx.db
				.insert(invitation)
				.values({
					id: crypto.randomUUID(),
					organizationId: ownerMembership.organizationId,
					email: input.email,
					role: MEMBER_ROLES.MEMBER,
					status: "pending",
					expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
					inviterId: userId
				})
				.returning();

			return newInvitation;
		}),

	acceptInvite: protectedProcedure
		.input(
			z.object({
				invitationId: z.string()
			})
		)
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session.user.id;

			const existing = await ctx.db.query.member.findFirst({
				where: eq(member.userId, userId)
			});
			if (existing) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "You are already a member of a team"
				});
			}

			const inv = await ctx.db.query.invitation.findFirst({
				where: and(
					eq(invitation.id, input.invitationId),
					eq(invitation.status, "pending")
				)
			});
			if (!inv) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Invitation not found or already used"
				});
			}

			const currentUser = await ctx.db.query.user.findFirst({
				where: eq(user.id, userId)
			});
			if (!currentUser || currentUser.email !== inv.email) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "This invitation is not addressed to you"
				});
			}

			if (inv.expiresAt < new Date()) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "This invitation has expired"
				});
			}

			await ctx.db.transaction(async (tx) => {
				await tx.insert(member).values({
					id: crypto.randomUUID(),
					organizationId: inv.organizationId,
					userId,
					role: MEMBER_ROLES.MEMBER,
					createdAt: new Date()
				});

				await tx
					.update(invitation)
					.set({ status: "accepted" })
					.where(eq(invitation.id, inv.id));
			});

			return { success: true };
		}),

	leave: protectedProcedure.mutation(async ({ ctx }) => {
		const userId = ctx.session.user.id;

		const membership = await ctx.db.query.member.findFirst({
			where: eq(member.userId, userId)
		});
		if (!membership) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "You are not a member of any team"
			});
		}

		await ctx.db.transaction(async (tx) => {
			await tx.delete(member).where(eq(member.id, membership.id));

			const remainingMembers = await tx.query.member.findMany({
				where: eq(member.organizationId, membership.organizationId)
			});

			if (remainingMembers.length === 0) {
				await tx
					.delete(invitation)
					.where(eq(invitation.organizationId, membership.organizationId));

				await tx
					.delete(organization)
					.where(eq(organization.id, membership.organizationId));
			}
		});

		return { success: true };
	}),

	update: protectedProcedure
		.input(
			z.object({
				id: z.string(),
				name: z.string().min(1).optional(),
				slug: z.string().optional(),
				logo: z.string().optional().nullable(),
				metadata: z.string().optional().nullable()
			})
		)
		.mutation(async ({ ctx, input }) => {
			const { id, ...data } = input;
			const [updated] = await ctx.db
				.update(organization)
				.set(data)
				.where(eq(organization.id, id))
				.returning();
			return updated;
		})
});
