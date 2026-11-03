/**
 * Admins add judges by name and email. Judges skip participant onboarding and
 * have no password: the access email points them to the judge login page,
 * where they sign in with an emailed one-time code.
 */

import { TRPCError } from "@trpc/server";
import { generateId } from "better-auth";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { env } from "@/env";
import { getFullName } from "@/lib/names";
import { getJudgeLoginHref } from "@/lib/routes";
import { addJudgeSchema } from "@/lib/validation/judge";
import { adminProcedure, createTRPCRouter } from "@/server/api/trpc";
import { user } from "@/server/db/auth-schema";
import { sendEmail } from "@/server/email";
import { judgeAccessEmail } from "@/server/email/templates";
import { Role } from "@/types/types";

const EMAIL_TAKEN_MESSAGE = "A user with this email already exists.";

async function sendJudgeAccessEmail(judge: {
	email: string;
	firstName: string;
}) {
	await sendEmail({
		to: judge.email,
		...judgeAccessEmail({
			firstName: judge.firstName,
			loginUrl: `${env.BETTER_AUTH_URL}${getJudgeLoginHref(judge.email)}`
		})
	});
}

function isUniqueViolation(error: unknown) {
	return (
		typeof error === "object" &&
		error !== null &&
		"code" in error &&
		error.code === "23505"
	);
}

export const judgesRouter = createTRPCRouter({
	create: adminProcedure
		.input(addJudgeSchema)
		.mutation(async ({ ctx, input }) => {
			// Case-insensitive, so a mixed-case address from an older sign-up counts.
			const existing = await ctx.db.query.user.findFirst({
				columns: { id: true },
				where: sql`lower(${user.email}) = ${input.email}`
			});
			if (existing) {
				throw new TRPCError({ code: "CONFLICT", message: EMAIL_TAKEN_MESSAGE });
			}

			const id = generateId();
			try {
				await ctx.db.insert(user).values({
					id,
					name: getFullName(input.firstName, input.lastName),
					email: input.email,
					// Signing in with an emailed code verifies it.
					emailVerified: false,
					role: Role.JUDGE,
					firstName: input.firstName,
					lastName: input.lastName,
					completedRegistration: true
				});
			} catch (error) {
				// Someone else signed up with this email at the same moment.
				if (isUniqueViolation(error)) {
					throw new TRPCError({
						code: "CONFLICT",
						message: EMAIL_TAKEN_MESSAGE
					});
				}
				throw error;
			}

			// The judge exists either way, so a failed email can be resent later
			// instead of making the admin start over.
			try {
				await sendJudgeAccessEmail(input);
				return { id, emailSent: true };
			} catch (error) {
				console.error("Couldn't send the judge access email", error);
				return { id, emailSent: false };
			}
		}),
	resendAccessEmail: adminProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const judge = await ctx.db.query.user.findFirst({
				columns: { email: true, firstName: true, name: true, role: true },
				where: eq(user.id, input.id)
			});
			if (!judge) {
				throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
			}
			if (judge.role !== Role.JUDGE) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Only judges sign in with an access email."
				});
			}

			try {
				await sendJudgeAccessEmail({
					email: judge.email,
					firstName: judge.firstName || judge.name
				});
			} catch (error) {
				console.error("Couldn't resend the judge access email", error);
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "We couldn’t send the email. Try again."
				});
			}
		})
});
