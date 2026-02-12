import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin, organization } from "better-auth/plugins";

import { db } from "@/server/db";

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
				type: "string",
				required: false
			},
			school: {
				type: "string",
				required: false
			},
			faculty: {
				type: "string",
				required: false
			}
		}
	}
});

export type Session = typeof auth.$Infer.Session;
