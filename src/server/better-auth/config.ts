import { type BetterAuthOptions, betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin, emailOTP, organization } from "better-auth/plugins";

import { env } from "@/env";
import {
	VERIFICATION_CODE_LENGTH,
	VERIFICATION_CODE_MAX_ATTEMPTS
} from "@/lib/validation/auth";
import { db } from "@/server/db";
import { LEVELS_OF_STUDY, PROGRAMS } from "@/server/db/auth-schema";
import { sendEmail } from "@/server/email";
import {
	existingAccountEmail,
	passwordChangedEmail,
	passwordResetCodeEmail,
	verificationCodeEmail
} from "@/server/email/templates";

const VERIFICATION_CODE_TTL_MINUTES = 10;

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
	emailAndPassword: {
		enabled: true,
		// Email sign-ups confirm their address with a one-time code before they
		// get a session. Signing up with a taken email looks the same as a new
		// sign-up (so accounts can't be enumerated); the owner gets a heads-up.
		requireEmailVerification: true,
		async onExistingUserSignUp({ user }) {
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
	// Email OTP endpoints the app doesn't use: codes only verify emails and
	// reset passwords. Checking a code on its own would reveal which emails
	// have accounts, so a reset code is only checked along with the new password.
	disabledPaths: [
		"/sign-in/email-otp",
		"/email-otp/check-verification-otp",
		// Deprecated alias of /email-otp/request-password-reset.
		"/forget-password/email-otp",
		"/email-otp/request-email-change",
		"/email-otp/change-email"
	],
	plugins: [
		organization(),
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
			}
		}
	}
} satisfies BetterAuthOptions;
export const auth = betterAuth(betterAuthDefaultConfig);
export type Session = typeof auth.$Infer.Session;
