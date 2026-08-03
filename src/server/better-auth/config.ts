import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin, organization } from "better-auth/plugins";

import { db } from "@/server/db";
import { DIETARY_RESTRICTIONS, PROGRAMS } from "@/server/db/auth-schema";

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: "pg"
	}),
	emailAndPassword: {
		enabled: true
	},
	plugins: [organization(), admin()],
	user: {
		additionalFields: {
			dietaryRestrictions: {
				type: "string[]",
				options: DIETARY_RESTRICTIONS,
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
				type: "string",
				required: false,
				options: PROGRAMS,
				input: false
			},
			completedRegistration: {
				type: "boolean",
				required: false,
				input: false
			}
		}
	}
});

export type Session = typeof auth.$Infer.Session;
