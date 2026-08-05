import "dotenv/config";

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin, testUtils } from "better-auth/plugins";

import { e2eDb } from "./tests/e2e/db";

const secret = process.env.BETTER_AUTH_SECRET;

if (!secret) {
	throw new Error("BETTER_AUTH_SECRET must be set for E2E auth tests");
}

export const auth = betterAuth({
	database: drizzleAdapter(e2eDb, {
		provider: "pg"
	}),
	secret,
	plugins: [admin(), testUtils()]
});
