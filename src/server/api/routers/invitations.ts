import { eq } from "drizzle-orm";
import { z } from "zod";
import { env } from "@/env";
import { adminProcedure, createTRPCRouter } from "@/server/api/trpc";
import type { db as dbType } from "@/server/db";
import { user } from "@/server/db/auth-schema";
import { roleInvitation } from "@/server/db/schema";
import { sendEmail } from "@/server/email";
import { Role } from "@/types/types";

const INVITABLE_ROLES = [Role.JUDGE, Role.ADMIN, Role.PARTICIPANT] as const;

function inviteEmailHtml(role: string, signupUrl: string) {
	return `<p>You've been invited to join the hackathon as a <strong>${role}</strong>.</p>
<p><a href="${signupUrl}">Create your account</a> using this email address to get access.</p>`;
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

			const existing = await ctx.db.query.user.findFirst({
				where: eq(user.email, email)
			});
			if (existing) {
				await ctx.db
					.update(user)
					.set({ role: input.role })
					.where(eq(user.id, existing.id));
			}

			await ctx.db
				.insert(roleInvitation)
				.values({
					email,
					role: input.role,
					invitedById: ctx.session.user.id
				})
				.onConflictDoUpdate({
					target: roleInvitation.email,
					set: {
						role: input.role,
						invitedById: ctx.session.user.id,
						acceptedAt: null
					}
				});

			const signupUrl = `${env.BETTER_AUTH_URL}/signup`;
			await sendEmail({
				to: email,
				subject: "You've been invited to the hackathon",
				html: inviteEmailHtml(input.role, signupUrl)
			});

			return { ok: true };
		})
});

export async function applyInvitedRole(
	db: typeof dbType,
	userId: string,
	email: string
) {
	const invite = await db.query.roleInvitation.findFirst({
		where: eq(roleInvitation.email, email.trim().toLowerCase())
	});
	if (!invite || invite.acceptedAt) return null;

	await db.update(user).set({ role: invite.role }).where(eq(user.id, userId));
	await db
		.update(roleInvitation)
		.set({ acceptedAt: new Date() })
		.where(eq(roleInvitation.email, invite.email));
	return invite.role;
}
