import { and, eq, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import { env } from "@/env";
import { adminProcedure, createTRPCRouter } from "@/server/api/trpc";
import type { db as dbType } from "@/server/db";
import { user } from "@/server/db/auth-schema";
import { roleInvitation } from "@/server/db/schema";
import { sendEmail } from "@/server/email";
import { roleInvitationEmail } from "@/server/email/templates";
import { Role } from "@/types/types";

type DbOrTx =
	| typeof dbType
	| Parameters<Parameters<typeof dbType.transaction>[0]>[0];

const INVITABLE_ROLES = [Role.JUDGE, Role.ADMIN, Role.PARTICIPANT] as const;

const ROLE_RANK: Record<string, number> = {
	[Role.PARTICIPANT]: 0,
	[Role.JUDGE]: 1,
	[Role.ADMIN]: 2
};

// Never let an invite reduce an account's privilege: keep whichever role ranks higher.
function higherRole(current: string | null, next: string) {
	const currentRank = ROLE_RANK[current ?? ""] ?? -1;
	const nextRank = ROLE_RANK[next] ?? -1;
	return current && currentRank >= nextRank ? current : next;
}

function roleLabel(role: string) {
	if (role === Role.ADMIN) return "Admin";
	if (role === Role.JUDGE) return "Judge";
	return "Participant";
}

export const invitationsRouter = createTRPCRouter({
	invite: adminProcedure
		.input(
			z.object({
				email: z.string().email(),
				role: z.enum(INVITABLE_ROLES)
			})
		)
		.mutation(async ({ ctx, input }) => {
			const email = input.email.trim().toLowerCase();

			// Case-insensitive match so a mixed-case stored address is still found.
			const existing = await ctx.db.query.user.findFirst({
				where: sql`lower(${user.email}) = ${email}`
			});
			const role = existing
				? higherRole(existing.role, input.role)
				: input.role;
			if (existing && role !== existing.role) {
				await ctx.db.update(user).set({ role }).where(eq(user.id, existing.id));
			}

			await ctx.db
				.insert(roleInvitation)
				.values({
					email,
					role,
					invitedById: ctx.session.user.id
				})
				.onConflictDoUpdate({
					target: roleInvitation.email,
					set: {
						role,
						invitedById: ctx.session.user.id,
						acceptedAt: null
					}
				});

			const signupUrl = `${env.BETTER_AUTH_URL}/signup`;
			await sendEmail({
				to: email,
				...roleInvitationEmail({ roleLabel: roleLabel(role), signupUrl })
			});

			return { ok: true };
		})
});

export async function applyInvitedRole(
	db: DbOrTx,
	userId: string,
	email: string
) {
	const normalizedEmail = email.trim().toLowerCase();

	const target = await db.query.user.findFirst({
		where: eq(user.id, userId)
	});
	// Only grant an invited role once the address is verified, so someone who
	// merely knows an invited email cannot self-register into judge/admin.
	if (!target?.emailVerified) return null;

	// Claim the pending invitation atomically: the conditional update on
	// acceptedAt IS NULL means a concurrent claim (or a re-invite that reset the
	// row) can only be consumed once, and RETURNING gives the exact role claimed.
	const [claimed] = await db
		.update(roleInvitation)
		.set({ acceptedAt: new Date() })
		.where(
			and(
				eq(roleInvitation.email, normalizedEmail),
				isNull(roleInvitation.acceptedAt)
			)
		)
		.returning();
	if (!claimed) return null;

	const role = higherRole(target.role, claimed.role);
	await db.update(user).set({ role }).where(eq(user.id, userId));
	return role;
}
