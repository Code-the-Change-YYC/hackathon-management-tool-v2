/**
 * Teams router (backed by the organization table). Team names are validated
 * against teamNameSchema, mirrored client-side in teamName.ts.
 *
 * Team codes and one-team-per-user are both race-prone under concurrent
 * requests, so both lean on DB constraints instead of check-then-act:
 * `create`/`getMyTeam` retry code generation on a unique-constraint
 * conflict, and `ensureNotInTeam` is backstopped by a unique index on
 * member.userId (isDuplicateMembershipError recognizes that race via the
 * Postgres error code/constraint name and turns it into a friendly error).
 * `join`/`acceptInvite` take a per-team Postgres advisory lock before
 * counting members against MAX_TEAM_SIZE, so concurrent joins to the same
 * team can't both slip past the cap.
 *
 * Only owners can invite or update team details (besides app admins).
 * Leaving requires confirmDelete for owners (deletes the team); a team left
 * with zero members is cleaned up automatically.
 */

import crypto from "node:crypto";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import type { db as dbType } from "@/server/db";
import {
	invitation,
	member,
	organization,
	user
} from "@/server/db/auth-schema";
import { hackathonSettings } from "@/server/db/schema";
import { MEMBER_ROLES, type TeamRanking } from "@/types/types";

type TeamMetadata = {
	devpostLink?: string | null;
};

type HackathonMetadata = {
	devpostSubmissionCloseAt?: string | null;
};

const teamNameSchema = z
	.string()
	.min(1, "Team name is required")
	.max(50, "Team name must be 50 characters or less")
	.regex(
		/^[a-zA-Z0-9 _-]+$/,
		"Team name can only contain letters, numbers, spaces, hyphens, and underscores"
	);

const MAX_TEAM_SIZE = 5;

const TEAM_CODE_LENGTH = 6;
const TEAM_CODE_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

const MAX_TEAM_CODE_ATTEMPTS = 5;

function generateTeamCode(): string {
	const bytes = crypto.randomBytes(TEAM_CODE_LENGTH);
	let code = "";
	for (const byte of bytes) {
		code += TEAM_CODE_ALPHABET[byte % TEAM_CODE_ALPHABET.length];
	}
	return code;
}

function isUniqueViolation(error: unknown): boolean {
	return (
		typeof error === "object" &&
		error !== null &&
		"code" in error &&
		(error as { code?: unknown }).code === "23505"
	);
}

function isDuplicateMembershipError(error: unknown): boolean {
	return (
		isUniqueViolation(error) &&
		typeof error === "object" &&
		error !== null &&
		"constraint_name" in error &&
		(error as { constraint_name?: unknown }).constraint_name ===
			"member_userId_idx"
	);
}

function alreadyInTeamError(): TRPCError {
	return new TRPCError({
		code: "BAD_REQUEST",
		message: "You are already a member of a team"
	});
}

function parseMetadata<T extends Record<string, unknown>>(
	raw: string | null
): T {
	if (!raw) {
		return {} as T;
	}

	try {
		const parsed = JSON.parse(raw) as unknown;
		if (typeof parsed === "object" && parsed !== null) {
			return parsed as T;
		}
		return {} as T;
	} catch {
		return {} as T;
	}
}

function parseDeadline(value: string | null | undefined): Date | null {
	if (!value) {
		return null;
	}

	const date = new Date(value);
	if (Number.isNaN(date.getTime())) {
		return null;
	}

	return date;
}

async function ensureNotInTeam(db: typeof dbType, userId: string) {
	const existing = await db.query.member.findFirst({
		where: eq(member.userId, userId)
	});
	if (existing) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "You are already a member of a team"
		});
	}
}

async function getUserMembership(db: typeof dbType, userId: string) {
	const membership = await db.query.member.findFirst({
		where: eq(member.userId, userId)
	});
	if (!membership) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "You are not a member of any team"
		});
	}
	return membership;
}

async function deleteTeamAndInvitations(
	tx: Parameters<Parameters<typeof dbType.transaction>[0]>[0],
	organizationId: string
) {
	await tx
		.delete(invitation)
		.where(eq(invitation.organizationId, organizationId));
	await tx.delete(member).where(eq(member.organizationId, organizationId));
	await tx.delete(organization).where(eq(organization.id, organizationId));
}

export const teamsRouter = createTRPCRouter({
	getMyDevpostSubmissionStatus: protectedProcedure.query(async ({ ctx }) => {
		const membership = await getUserMembership(ctx.db, ctx.session.user.id);

		const team = await ctx.db.query.organization.findFirst({
			where: eq(organization.id, membership.organizationId)
		});
		if (!team) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Team not found"
			});
		}

		const settings = await ctx.db.query.hackathonSettings.findFirst({
			where: eq(hackathonSettings.id, 1)
		});

		const teamMetadata = parseMetadata<TeamMetadata>(team.metadata);
		const hackathonMetadata = parseMetadata<HackathonMetadata>(
			settings?.metadata ?? null
		);

		const devpostLink = teamMetadata.devpostLink?.trim() || null;
		const submissionCloseAt = parseDeadline(
			hackathonMetadata.devpostSubmissionCloseAt
		);
		const now = new Date();
		const isBeforeDeadline =
			submissionCloseAt !== null && now.getTime() < submissionCloseAt.getTime();
		const showWarning = isBeforeDeadline && !devpostLink;

		return {
			teamId: team.id,
			teamName: team.name,
			devpostLink,
			submissionCloseAt,
			showWarning
		};
	}),

	getAll: protectedProcedure.query(async ({ ctx }) => {
		const teams = await ctx.db.query.organization.findMany({
			orderBy: [desc(organization.createdAt)]
		});
		return teams;
	}),

	getMyTeam: protectedProcedure.query(async ({ ctx }) => {
		const userId = ctx.session.user.id;

		const membership = await ctx.db.query.member.findFirst({
			where: eq(member.userId, userId)
		});
		if (!membership) {
			return null;
		}

		const team = await ctx.db.query.organization.findFirst({
			where: eq(organization.id, membership.organizationId)
		});
		if (!team) {
			return null;
		}

		const members = await ctx.db.query.member.findMany({
			where: eq(member.organizationId, membership.organizationId),
			with: { user: true }
		});

		const sorted = [...members].sort((a, b) => {
			const aOwner = a.role === MEMBER_ROLES.OWNER;
			const bOwner = b.role === MEMBER_ROLES.OWNER;
			if (aOwner !== bOwner) {
				return aOwner ? -1 : 1;
			}
			return a.createdAt.getTime() - b.createdAt.getTime();
		});

		let teamCode = team.teamCode;
		if (!teamCode) {
			for (let attempt = 0; attempt < MAX_TEAM_CODE_ATTEMPTS; attempt++) {
				try {
					const [updated] = await ctx.db
						.update(organization)
						.set({ teamCode: generateTeamCode() })
						.where(
							and(eq(organization.id, team.id), isNull(organization.teamCode))
						)
						.returning({ teamCode: organization.teamCode });

					if (updated) {
						teamCode = updated.teamCode;
					} else {
						const refreshed = await ctx.db.query.organization.findFirst({
							where: eq(organization.id, team.id)
						});
						teamCode = refreshed?.teamCode ?? null;
					}
					break;
				} catch (error) {
					if (
						isUniqueViolation(error) &&
						attempt < MAX_TEAM_CODE_ATTEMPTS - 1
					) {
						continue;
					}
					throw error;
				}
			}
		}

		return {
			id: team.id,
			name: team.name,
			teamCode,
			maxMembers: MAX_TEAM_SIZE,
			myRole: membership.role,
			members: sorted.map((m) => ({
				id: m.id,
				userId: m.userId,
				name: m.user.name,
				email: m.user.email,
				role: m.role,
				isYou: m.userId === userId
			}))
		};
	}),

	create: protectedProcedure
		.input(
			z.object({
				name: teamNameSchema
			})
		)
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session.user.id;
			await ensureNotInTeam(ctx.db, userId);

			const slug = input.name
				.toLowerCase()
				.replace(/\s+/g, "-")
				.replace(/[^a-z0-9-]/g, "");

			for (let attempt = 0; attempt < MAX_TEAM_CODE_ATTEMPTS; attempt++) {
				const teamId = crypto.randomUUID();
				const teamCode = generateTeamCode();
				try {
					return await ctx.db.transaction(async (tx) => {
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
				} catch (error) {
					if (isDuplicateMembershipError(error)) {
						throw alreadyInTeamError();
					}
					if (
						isUniqueViolation(error) &&
						attempt < MAX_TEAM_CODE_ATTEMPTS - 1
					) {
						continue;
					}
					throw error;
				}
			}

			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "Could not generate a unique team code"
			});
		}),

	join: protectedProcedure
		.input(
			z.object({
				teamCode: z
					.string()
					.length(
						TEAM_CODE_LENGTH,
						`Team code must be exactly ${TEAM_CODE_LENGTH} characters`
					)
					.toUpperCase()
			})
		)
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session.user.id;
			await ensureNotInTeam(ctx.db, userId);

			const team = await ctx.db.query.organization.findFirst({
				where: eq(organization.teamCode, input.teamCode)
			});
			if (!team) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "No team found with that code"
				});
			}

			try {
				return await ctx.db.transaction(async (tx) => {
					await tx.execute(
						sql`select pg_advisory_xact_lock(hashtext(${team.id}))`
					);

					const [row] = await tx
						.select({ count: sql<number>`count(*)::int` })
						.from(member)
						.where(eq(member.organizationId, team.id));
					const memberCount = row?.count ?? 0;
					if (memberCount >= MAX_TEAM_SIZE) {
						throw new TRPCError({
							code: "BAD_REQUEST",
							message: `This team is full (${MAX_TEAM_SIZE} members maximum)`
						});
					}

					await tx.insert(member).values({
						id: crypto.randomUUID(),
						organizationId: team.id,
						userId,
						role: MEMBER_ROLES.MEMBER,
						createdAt: new Date()
					});

					return team;
				});
			} catch (error) {
				if (isDuplicateMembershipError(error)) {
					throw alreadyInTeamError();
				}
				throw error;
			}
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
			await ensureNotInTeam(ctx.db, userId);

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

			try {
				await ctx.db.transaction(async (tx) => {
					await tx.execute(
						sql`select pg_advisory_xact_lock(hashtext(${inv.organizationId}))`
					);

					const [row] = await tx
						.select({ count: sql<number>`count(*)::int` })
						.from(member)
						.where(eq(member.organizationId, inv.organizationId));
					if ((row?.count ?? 0) >= MAX_TEAM_SIZE) {
						throw new TRPCError({
							code: "BAD_REQUEST",
							message: `This team is full (${MAX_TEAM_SIZE} members maximum)`
						});
					}

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
			} catch (error) {
				if (isDuplicateMembershipError(error)) {
					throw alreadyInTeamError();
				}
				throw error;
			}

			return { success: true };
		}),

	leave: protectedProcedure
		.input(
			z
				.object({
					confirmDelete: z.boolean().optional()
				})
				.optional()
		)
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session.user.id;
			const membership = await getUserMembership(ctx.db, userId);
			const isOwner = membership.role === MEMBER_ROLES.OWNER;

			if (isOwner && !input?.confirmDelete) {
				return {
					success: false,
					warning:
						"You are the team owner. Leaving will delete the entire team " +
						"and all pending invitations. Set confirmDelete: true to proceed."
				};
			}

			await ctx.db.transaction(async (tx) => {
				if (isOwner) {
					await deleteTeamAndInvitations(tx, membership.organizationId);
				} else {
					await tx.delete(member).where(eq(member.id, membership.id));

					const remainingMembers = await tx.query.member.findMany({
						where: eq(member.organizationId, membership.organizationId)
					});

					if (remainingMembers.length === 0) {
						await deleteTeamAndInvitations(tx, membership.organizationId);
					}
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
			const userId = ctx.session.user.id;
			const isAppAdmin = ctx.session.user.role === "admin";

			if (!isAppAdmin) {
				const membership = await ctx.db.query.member.findFirst({
					where: and(
						eq(member.userId, userId),
						eq(member.organizationId, id),
						eq(member.role, MEMBER_ROLES.OWNER)
					)
				});
				if (!membership) {
					throw new TRPCError({
						code: "FORBIDDEN",
						message: "Only app admins or team owners can update team details"
					});
				}
			}

			const [updated] = await ctx.db
				.update(organization)
				.set(data)
				.where(eq(organization.id, id))
				.returning();
			return updated;
		}),
	getRankings: protectedProcedure.query(async ({ ctx }) => {
		const result = await ctx.db.execute(
			sql<TeamRanking>`
          SELECT 
            o.id,
            o.name,
            COALESCE(SUM(s.value), 0) AS "totalScore"
          FROM hackathon_organization o
          LEFT JOIN hackathon_judging_assignment a 
            ON a.team_id = o.id
          LEFT JOIN hackathon_score s 
            ON s.assignment_id = a.id
          GROUP BY o.id, o.name
          ORDER BY "totalScore" DESC
        `
		);

		return result as unknown as TeamRanking[];
	})
});
