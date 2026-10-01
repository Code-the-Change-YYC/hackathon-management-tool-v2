import { type BetterAuthOptions, betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin, emailOTP, organization } from "better-auth/plugins";

import { env } from "@/env";
import { VERIFICATION_CODE_LENGTH } from "@/lib/validation/auth";
import { db } from "@/server/db";
import { LEVELS_OF_STUDY, PROGRAMS } from "@/server/db/auth-schema";
import { sendEmail } from "@/server/email";
import {
	existingAccountEmail,
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
		}
	},
	emailVerification: {
		sendOnSignUp: true,
		// Unverified users who try to log in get a fresh code.
		sendOnSignIn: true,
		autoSignInAfterVerification: true
	},
	// Email OTP endpoints the app doesn't use: codes only verify emails.
	disabledPaths: [
		"/sign-in/email-otp",
		"/email-otp/check-verification-otp",
		"/email-otp/request-password-reset",
		"/email-otp/reset-password",
		"/forget-password/email-otp",
		"/email-otp/request-email-change",
		"/email-otp/change-email"
	],
	plugins: [
		organization(),
		admin(),
		emailOTP({
			otpLength: VERIFICATION_CODE_LENGTH,
			expiresIn: VERIFICATION_CODE_TTL_MINUTES * 60,
			disableSignUp: true,
			overrideDefaultEmailVerification: true,
			async sendVerificationOTP({ email, otp, type }) {
				if (type !== "email-verification") return;

				await sendEmail({
					to: email,
					...verificationCodeEmail({
						code: otp,
						expiresInMinutes: VERIFICATION_CODE_TTL_MINUTES
					})
				});
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
