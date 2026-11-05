import { type BetterAuthOptions, betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { admin, emailOTP } from "better-auth/plugins";
import { eq } from "drizzle-orm";

import { env } from "@/env";
import {
	VERIFICATION_CODE_LENGTH,
	VERIFICATION_CODE_MAX_ATTEMPTS
} from "@/lib/validation/auth";
import { db } from "@/server/db";
import { LEVELS_OF_STUDY, PROGRAMS, user } from "@/server/db/auth-schema";
import { judgingScores, judgingVotes } from "@/server/db/judging-schema";
import { sendEmail } from "@/server/email";
import {
	existingAccountEmail,
	judgeSignInCodeEmail,
	passwordChangedEmail,
	passwordResetCodeEmail,
	unfinishedSignUpEmail,
	verificationCodeEmail
} from "@/server/email/templates";
import { Role } from "@/types/types";

const VERIFICATION_CODE_TTL_MINUTES = 10;

const JUDGE_NOT_FOUND = {
	code: "JUDGE_NOT_FOUND",
	message: "We couldn’t find a judge account for that email"
};

const USER_HAS_SCORES = {
	code: "USER_HAS_SCORES",
	message:
		"This judge has submitted scores or a ranking, so they can’t be deleted. Remove them from their tables instead."
};

async function isJudge(email: string) {
	const found = await db.query.user.findFirst({
		columns: { role: true },
		where: eq(user.email, email.trim().toLowerCase())
	});
	return found?.role === Role.JUDGE;
}

async function hasSubmittedScores(userId: string) {
	const [score, vote] = await Promise.all([
		db.query.judgingScores.findFirst({
			columns: { id: true },
			where: eq(judgingScores.judgeId, userId)
		}),
		db.query.judgingVotes.findFirst({
			columns: { id: true },
			where: eq(judgingVotes.judgeId, userId)
		})
	]);
	return Boolean(score || vote);
}

const trustedOrigins = env.BETTER_AUTH_TRUSTED_ORIGINS
	? env.BETTER_AUTH_TRUSTED_ORIGINS.split(",")
			.map((origin) => origin.trim())
			.filter(Boolean)
	: env.NODE_ENV === "production"
		? []
		: ["http://localhost:3000", "http://127.0.0.1:3000"];

export const betterAuthDefaultConfig = {
	baseURL: env.BETTER_AUTH_URL,
	socialProviders: {
		google: {
			clientId: env.GOOGLE_CLIENT_ID,
			clientSecret: env.GOOGLE_CLIENT_SECRET
		}
	},
	database: drizzleAdapter(db, {
		provider: "pg"
	}),
	trustedOrigins,
	// Limits are per IP, and everyone on the venue Wi-Fi shares one, so the
	// defaults (3 sign-ins per 10 seconds, 3 codes per minute) would lock out
	// most of the room. Each code still only allows a few wrong guesses.
	rateLimit: {
		customRules: {
			"/sign-in/*": { window: 10, max: 30 },
			"/sign-up/*": { window: 10, max: 30 },
			"/email-otp/send-verification-otp": { window: 60, max: 30 },
			"/email-otp/verify-email": { window: 60, max: 30 },
			"/email-otp/request-password-reset": { window: 60, max: 30 },
			"/email-otp/reset-password": { window: 60, max: 30 }
		}
	},
	emailAndPassword: {
		enabled: true,
		// Email sign-ups confirm their address with a one-time code before they
		// get a session. Signing up with a taken email looks the same as a new
		// sign-up (so accounts can't be enumerated); the owner gets a heads-up.
		requireEmailVerification: true,
		async onExistingUserSignUp({ user }): Promise<void> {
			// Someone who never verified is most likely signing up again, and is
			// now on the verify page waiting for a code, so send them one.
			if (!user.emailVerified) {
				const code = await auth.api.createVerificationOTP({
					body: { email: user.email, type: "email-verification" }
				});
				await sendEmail({
					to: user.email,
					...unfinishedSignUpEmail({
						code,
						expiresInMinutes: VERIFICATION_CODE_TTL_MINUTES,
						forgotPasswordUrl: `${env.BETTER_AUTH_URL}/forgot-password`
					})
				});
				return;
			}
			await sendEmail({
				to: user.email,
				...existingAccountEmail({ loginUrl: `${env.BETTER_AUTH_URL}/login` })
			});
		},
		// Forgotten passwords are reset with an emailed code (see emailOTP
		// below). Resetting logs the account out everywhere, in case someone
		// else knew the old password, and tells the owner it happened.
		revokeSessionsOnPasswordReset: true,
		async onPasswordReset({ user }) {
			// The password has already changed, so a failed notice shouldn't
			// make the reset look like it failed.
			try {
				await sendEmail({
					to: user.email,
					...passwordChangedEmail({
						forgotPasswordUrl: `${env.BETTER_AUTH_URL}/forgot-password`
					})
				});
			} catch (error) {
				console.error("Couldn't send the password changed email", error);
			}
		}
	},
	emailVerification: {
		sendOnSignUp: true,
		// Unverified users who try to log in get a fresh code.
		sendOnSignIn: true,
		autoSignInAfterVerification: true
	},
	// Email OTP endpoints the app doesn't use: codes verify emails, reset
	// passwords, and sign judges in. Checking a code on its own would reveal
	// which emails have accounts, so a reset code is only checked along with
	// the new password.
	disabledPaths: [
		"/email-otp/check-verification-otp",
		// Deprecated alias of /email-otp/request-password-reset.
		"/forget-password/email-otp",
		"/email-otp/request-email-change",
		"/email-otp/change-email",
		// Names and avatars are saved through the users router, which checks them.
		"/update-user"
	],
	hooks: {
		before: createAuthMiddleware(async (ctx) => {
			// Only judges sign in with an emailed code; everyone else has a
			// password or Google. Judges aren't secret, so an email that isn't a
			// judge's gets an error instead of a code that never arrives.
			const isJudgeCodeRequest =
				ctx.path === "/email-otp/send-verification-otp" &&
				ctx.body?.type === "sign-in";
			if (
				(isJudgeCodeRequest || ctx.path === "/sign-in/email-otp") &&
				!(
					typeof ctx.body?.email === "string" && (await isJudge(ctx.body.email))
				)
			) {
				throw APIError.from("BAD_REQUEST", JUDGE_NOT_FOUND);
			}

			// Scores and votes keep their judge, so deleting a judge who has scored would
			// fail partway (after their sessions are gone).
			if (
				ctx.path === "/admin/remove-user" &&
				typeof ctx.body?.userId === "string" &&
				(await hasSubmittedScores(ctx.body.userId))
			) {
				throw APIError.from("BAD_REQUEST", USER_HAS_SCORES);
			}
		})
	},
	// Teams live in the organization tables but are managed only through the
	// teams router, so Better Auth's organization plugin (and the REST endpoints
	// that skip the team rules) isn't installed.
	plugins: [
		admin(),
		emailOTP({
			otpLength: VERIFICATION_CODE_LENGTH,
			allowedAttempts: VERIFICATION_CODE_MAX_ATTEMPTS,
			expiresIn: VERIFICATION_CODE_TTL_MINUTES * 60,
			disableSignUp: true,
			overrideDefaultEmailVerification: true,
			async sendVerificationOTP({ email, otp, type }) {
				const content = {
					code: otp,
					expiresInMinutes: VERIFICATION_CODE_TTL_MINUTES
				};
				if (type === "email-verification") {
					await sendEmail({ to: email, ...verificationCodeEmail(content) });
				} else if (type === "forget-password") {
					await sendEmail({ to: email, ...passwordResetCodeEmail(content) });
				} else if (type === "sign-in") {
					await sendEmail({ to: email, ...judgeSignInCodeEmail(content) });
				}
			}
		})
	],
	user: {
		additionalFields: {
			dietaryRestrictions: {
				type: "string[]",
				required: true,
				defaultValue: [],
				input: false
			},
			firstName: {
				type: "string",
				required: false,
				input: false
			},
			lastName: {
				type: "string",
				required: false,
				input: false
			},
			age: {
				type: "number",
				required: false,
				input: false
			},
			phoneNumber: {
				type: "string",
				required: false,
				input: false
			},
			countryOfResidence: {
				type: "string",
				required: false,
				input: false
			},
			school: {
				type: "string",
				required: false,
				input: false
			},
			levelOfStudy: {
				type: [...LEVELS_OF_STUDY],
				required: false,
				input: false
			},
			program: {
				type: [...PROGRAMS],
				required: false,
				input: false
			},
			wantsFood: {
				type: "boolean",
				required: false,
				input: false
			},
			mlhCodeOfConductAcceptedAt: {
				type: "date",
				required: false,
				input: false
			},
			mlhDataSharingAcceptedAt: {
				type: "date",
				required: false,
				input: false
			},
			mlhEmailOptIn: {
				type: "boolean",
				required: false,
				defaultValue: false,
				input: false
			},
			completedRegistration: {
				type: "boolean",
				required: false,
				input: false
			},
			checkedIn: {
				type: "boolean",
				required: false,
				defaultValue: false,
				input: false
			}
		}
	}
} satisfies BetterAuthOptions;
export const auth = betterAuth(betterAuthDefaultConfig);
