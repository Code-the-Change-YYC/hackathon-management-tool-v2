import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin, organization } from "better-auth/plugins";

import { db } from "@/server/db";
import { PROGRAMS } from "@/server/db/auth-schema";

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
			allergies: {
				type: "string",
				required: false
			},
			school: {
				type: "string",
				required: false
			},
			program: {
				type: "string",
				required: false,
				options: PROGRAMS
			},
			completedRegistration: {
				type: "boolean",
				required: false
			}
		}
	}
});

export type Session = typeof auth.$Infer.Session;
