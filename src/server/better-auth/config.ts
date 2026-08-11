import { type BetterAuthOptions, betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin, organization } from "better-auth/plugins";

import { env } from "@/env";
import { db } from "@/server/db";
import { DIETARY_RESTRICTIONS, PROGRAMS } from "@/server/db/auth-schema";

const trustedOrigins = env.BETTER_AUTH_TRUSTED_ORIGINS
	? env.BETTER_AUTH_TRUSTED_ORIGINS.split(",")
			.map((origin) => origin.trim())
			.filter(Boolean)
	: env.NODE_ENV === "production"
		? []
		: ["http://localhost:3000", "http://127.0.0.1:3000"];

export const betterAuthConfig = {
	baseURL: env.BETTER_AUTH_URL,
	database: drizzleAdapter(db, {
		provider: "pg"
	}),
	trustedOrigins,
	emailAndPassword: {
		enabled: true
	},
	plugins: [organization(), admin()],
	user: {
		additionalFields: {
			dietaryRestrictions: {
				type: "string[]",
				required: true,
				defaultValue: [],
				input: false
			},
			school: {
				type: "string",
				required: false,
				input: false
			},
			program: {
				type: [...PROGRAMS],
				required: false,
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
export const auth = betterAuth(betterAuthConfig);
export type Session = typeof auth.$Infer.Session;
