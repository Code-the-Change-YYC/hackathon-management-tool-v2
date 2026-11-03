/**
 * Teams router (backed by the organization table). Team names and invite
 * codes are validated with the schemas in lib/validation/team.ts, which the
 * client forms share.
 *
 * Team codes and one-team-per-user are both race-prone under concurrent
 * requests, so both lean on DB constraints instead of check-then-act:
 * `create`/`getMyTeam` retry code generation on a unique-constraint
 * conflict, and `ensureNotInTeam` is backstopped by a unique index on
 * member.userId (isDuplicateMembershipError recognizes that race via the
 * Postgres error code/constraint name and turns it into a friendly error).
 * `join` takes a per-team Postgres advisory lock before counting members
 * against MAX_TEAM_SIZE, so concurrent joins to the same team can't both
 * slip past the cap.
 *
 * Only owners can update team details (besides app admins). When the owner
 * leaves, the earliest-joined remaining member becomes owner; a team left
 * with zero members is deleted.
 */

import crypto from "node:crypto";
import { TRPCError } from "@trpc/server";
import { isValid } from "date-fns";
import { and, asc, desc, eq, isNull, not, sql } from "drizzle-orm";
import { z } from "zod";
import { resolveAvatarSrc } from "@/lib/avatars";
import { tryCatch } from "@/lib/utils";
import {
	joinTeamSchema,
	prescreenSchema,
	registerTeamSchema,
	TEAM_CODE_LENGTH,
	teamNameSchema
} from "@/lib/validation/team";
import { submittedScorecards } from "@/server/api/judging-results";
import {
	adminProcedure,
	createTRPCRouter,
	protectedProcedure
} from "@/server/api/trpc";
import type { db as dbType } from "@/server/db";
import { hackathonSettings } from "@/server/db/admin-schema";
import { member, organization } from "@/server/db/auth-schema";
import {
	judgingAssignments,
	judgingRounds,
	judgingScores,
	judgingTableJudges,
	judgingVotes
} from "@/server/db/judging-schema";
import { MEMBER_ROLES, type TeamRanking } from "@/types/types";

type TeamMetadata = {
	devpostLink?: string | null;
};

type HackathonMetadata = {
	devpostSubmissionCloseAt?: string | null;
};

const MAX_TEAM_SIZE = 5;

const TEAM_CODE_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

const MAX_TEAM_CODE_ATTEMPTS = 5;

const PG_UNIQUE_VIOLATION = "23505";

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
		(error as { code?: unknown }).code === PG_UNIQUE_VIOLATION
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
	return isValid(date) ? date : null;
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

type Transaction = Parameters<Parameters<typeof dbType.transaction>[0]>[0];

// Scores and final-round votes are judges' work, and every team's ranking is
// normalized against them, so an assignment that has either has to stay.
const hasJudgingResults = sql`(
	EXISTS (SELECT 1 FROM ${judgingScores} WHERE ${judgingScores.assignmentId} = ${judgingAssignments.id})
	OR EXISTS (SELECT 1 FROM ${judgingVotes} WHERE ${judgingVotes.assignmentId} = ${judgingAssignments.id})
)`;

const JUDGED_TEAM_MESSAGE =
	"This team has judging scores or final-round votes, so it can’t be deleted.";

async function isTeamJudged(tx: Transaction, organizationId: string) {
	const [judged] = await tx
		.select({ id: judgingAssignments.id })
		.from(judgingAssignments)
		.where(
			and(eq(judgingAssignments.teamId, organizationId), hasJudgingResults)
		)
		.limit(1);
	return Boolean(judged);
}

// Only for teams without judging results: their slots in the schedule free up.
async function deleteTeam(tx: Transaction, organizationId: string) {
	await tx
		.delete(judgingAssignments)
		.where(eq(judgingAssignments.teamId, organizationId));
	await tx.delete(member).where(eq(member.organizationId, organizationId));
	return tx
		.delete(organization)
		.where(eq(organization.id, organizationId))
		.returning({ id: organization.id });
}

async function fetchTeamRankings(db: typeof dbType): Promise<TeamRanking[]> {
	const result = await db.execute(sql<TeamRanking>`
		SELECT o.id, o.name,
			COALESCE(AVG(card.main_score), 0)::float8 AS "totalScore",
			COUNT(card.judge_id)::int AS "submittedScorecards",
			(SELECT COUNT(*)::int FROM ${judgingAssignments} a
				INNER JOIN ${judgingTableJudges} tj ON tj.table_id = a.table_id
				WHERE a.team_id = o.id) AS "expectedScorecards"
		FROM ${organization} o
		LEFT JOIN ${submittedScorecards} card ON card.team_id = o.id
		GROUP BY o.id, o.name
		ORDER BY "totalScore" DESC, o.name ASC, o.id ASC
	`);

	return result as unknown as TeamRanking[];
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

	getAll: adminProcedure.query(async ({ ctx }) => {
		const teams = await ctx.db.query.organization.findMany({
			orderBy: [desc(organization.createdAt)]
		});
		return teams;
	}),

	// A team advanced past a round when the next round schedules it, so a round
	// stays empty (null) until the next one is scheduled. The final round gets
	// no column because winners aren't recorded.
	getTeamsWithMembers: adminProcedure.query(async ({ ctx }) => {
		const [rows, rounds, judged] = await Promise.all([
			ctx.db.query.organization.findMany({
				orderBy: [desc(organization.createdAt)],
				columns: {
					id: true,
					name: true,
					teamCode: true,
					prescreenStatus: true,
					prescreenComments: true
				},
				with: {
					members: {
						orderBy: [asc(member.createdAt)],
						with: { user: { columns: { name: true, email: true } } }
					}
				}
			}),
			ctx.db.query.judgingRounds.findMany({
				orderBy: [asc(judgingRounds.startTime)],
				columns: { id: true, name: true, kind: true },
				with: {
					tables: {
						columns: {},
						with: { assignments: { columns: { teamId: true } } }
					}
				}
			}),
			ctx.db
				.selectDistinct({ teamId: judgingAssignments.teamId })
				.from(judgingAssignments)
				.where(hasJudgingResults)
		]);
		const judgedTeamIds = new Set(judged.map(({ teamId }) => teamId));

		const advancedTeamIds = rounds.flatMap((round, index) => {
			if (round.kind === "final") return [];
			const teamIds = (rounds[index + 1]?.tables ?? []).flatMap((table) =>
				table.assignments.map((assignment) => assignment.teamId)
			);
			return [
				{
					id: round.id,
					name: round.name,
					teamIds: teamIds.length > 0 ? new Set(teamIds) : null
				}
			];
		});

		return {
			rounds: advancedTeamIds.map(({ id, name }) => ({ id, name })),
			teams: rows.map(({ members, ...team }) => ({
				id: team.id,
				name: team.name,
				teamCode: team.teamCode,
				prescreen: team.prescreenStatus,
				feedback: team.prescreenComments,
				// Judged teams can't be deleted.
				judged: judgedTeamIds.has(team.id),
				members: members.map(({ user }) => ({
					name: user.name,
					email: user.email
				})),
				// Whether the team advanced past each round, by round ID.
				rounds: Object.fromEntries(
					advancedTeamIds.map(({ id, teamIds }) => [
						id,
						teamIds ? teamIds.has(team.id) : null
					])
				)
			}))
		};
	}),

	// Feedback is only required when a team fails.
	setPrescreen: adminProcedure
		.input(prescreenSchema)
		.mutation(async ({ ctx, input }) => {
			return ctx.db.transaction(async (tx) => {
				const [updated] = await tx
					.update(organization)
					.set({
						prescreenStatus: input.status,
						prescreenComments: input.comments || null,
						prescreenedBy: ctx.session.user.id,
						prescreenedAt: new Date()
					})
					.where(eq(organization.id, input.teamId))
					.returning();
				if (!updated) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Team not found"
					});
				}
				// A failed team won't present, so slots judges haven't scored or
				// ranked free up. The rest stay, but failed teams aren't ranked.
				const removed =
					input.status === "failed"
						? await tx
								.delete(judgingAssignments)
								.where(
									and(
										eq(judgingAssignments.teamId, input.teamId),
										not(hasJudgingResults)
									)
								)
								.returning({ id: judgingAssignments.id })
						: [];
				return { ...updated, removedSlots: removed.length };
			});
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
				const { data: rows, error } = await tryCatch(
					ctx.db
						.update(organization)
						.set({ teamCode: generateTeamCode() })
						.where(
							and(eq(organization.id, team.id), isNull(organization.teamCode))
						)
						.returning({ teamCode: organization.teamCode })
				);
				if (error) {
					if (
						isUniqueViolation(error) &&
						attempt < MAX_TEAM_CODE_ATTEMPTS - 1
					) {
						continue;
					}
					throw error;
				}

				const updated = rows[0];
				if (updated) {
					teamCode = updated.teamCode;
				} else {
					const refreshed = await ctx.db.query.organization.findFirst({
						where: eq(organization.id, team.id)
					});
					teamCode = refreshed?.teamCode ?? null;
				}
				break;
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
				avatarSrc: resolveAvatarSrc(m.user.image),
				role: m.role,
				isYou: m.userId === userId
			}))
		};
	}),

	create: protectedProcedure
		.input(registerTeamSchema)
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session.user.id;
			await ensureNotInTeam(ctx.db, userId);

			const slug = input.name
				// Drops accents so "Équipe" becomes "equipe" rather than "quipe".
				.normalize("NFD")
				.replace(/\p{M}/gu, "")
				.toLowerCase()
				.replace(/\s+/g, "-")
				.replace(/[^a-z0-9-]/g, "");

			for (let attempt = 0; attempt < MAX_TEAM_CODE_ATTEMPTS; attempt++) {
				const teamId = crypto.randomUUID();
				const teamCode = generateTeamCode();
				const { data: newTeam, error } = await tryCatch(
					ctx.db.transaction(async (tx) => {
						const [created] = await tx
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

						return created;
					})
				);
				if (!error) {
					return newTeam;
				}
				if (isDuplicateMembershipError(error)) {
					throw alreadyInTeamError();
				}
				if (isUniqueViolation(error) && attempt < MAX_TEAM_CODE_ATTEMPTS - 1) {
					continue;
				}
				throw error;
			}

			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "Could not generate a unique team code"
			});
		}),

	join: protectedProcedure
		.input(joinTeamSchema)
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

			const { data, error } = await tryCatch(
				ctx.db.transaction(async (tx) => {
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
				})
			);
			if (error) {
				if (isDuplicateMembershipError(error)) {
					throw alreadyInTeamError();
				}
				throw error;
			}
			return data;
		}),

	leave: protectedProcedure.mutation(async ({ ctx }) => {
		const userId = ctx.session.user.id;
		const { organizationId } = await getUserMembership(ctx.db, userId);

		await ctx.db.transaction(async (tx) => {
			// Serializes with joins and other leaves, so two members leaving at
			// once can't both skip the promotion or the empty-team cleanup.
			await tx.execute(
				sql`select pg_advisory_xact_lock(hashtext(${organizationId}))`
			);

			await tx
				.delete(member)
				.where(
					and(
						eq(member.userId, userId),
						eq(member.organizationId, organizationId)
					)
				);

			const remainingMembers = await tx.query.member.findMany({
				where: eq(member.organizationId, organizationId),
				orderBy: [asc(member.createdAt), asc(member.id)]
			});

			const [earliest] = remainingMembers;
			if (!earliest) {
				// A judged team stays without members, so its scores and votes,
				// and the rankings built on them, don't change.
				if (!(await isTeamJudged(tx, organizationId))) {
					await deleteTeam(tx, organizationId);
				}
				return;
			}

			if (!remainingMembers.some((m) => m.role === MEMBER_ROLES.OWNER)) {
				await tx
					.update(member)
					.set({ role: MEMBER_ROLES.OWNER })
					.where(eq(member.id, earliest.id));
			}
		});

		return { success: true };
	}),

	update: protectedProcedure
		.input(
			z.object({
				id: z.string(),
				name: teamNameSchema.optional(),
				slug: z.string().trim().min(1).optional(),
				logo: z.string().optional().nullable(),
				metadata: z.string().optional().nullable()
			})
		)
		.mutation(async ({ ctx, input }) => {
			const { id, ...data } = input;
			const userId = ctx.session.user.id;
			const isAppAdmin = ctx.session.user.role === "admin";

			if (!isAppAdmin) {
				// Owners can only rename; the other details are admin-only.
				if (
					data.slug !== undefined ||
					data.logo !== undefined ||
					data.metadata !== undefined
				) {
					throw new TRPCError({
						code: "FORBIDDEN",
						message:
							"Only app admins can change team details other than the name"
					});
				}
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

			const { data: rows, error } = await tryCatch(
				ctx.db
					.update(organization)
					.set(data)
					.where(eq(organization.id, id))
					.returning()
			);
			if (error) {
				if (isUniqueViolation(error)) {
					throw new TRPCError({
						code: "CONFLICT",
						message: "Another team already uses that slug"
					});
				}
				throw error;
			}
			return rows[0];
		}),
	getRankings: adminProcedure.query(({ ctx }) => fetchTeamRankings(ctx.db)),
	delete: adminProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const deleted = await ctx.db.transaction(async (tx) => {
				// Serialize with joins/leaves for this team.
				await tx.execute(
					sql`select pg_advisory_xact_lock(hashtext(${input.id}))`
				);

				if (await isTeamJudged(tx, input.id)) {
					throw new TRPCError({
						code: "CONFLICT",
						message: JUDGED_TEAM_MESSAGE
					});
				}
				const [row] = await deleteTeam(tx, input.id);
				return row;
			});

			if (!deleted) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Team not found"
				});
			}

			return { success: true, id: deleted.id };
		})
});
