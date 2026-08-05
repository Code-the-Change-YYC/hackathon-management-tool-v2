import "dotenv/config";

import { auth } from "auth.test";
import { eq } from "drizzle-orm";
import type { Page } from "playwright/test";
import { test as base } from "playwright/test";
import { db } from "@/server/db";
import { user } from "@/server/db/auth-schema";
import type { User } from "@/types/types";
import { Role } from "@/types/types";

export type AuthUserOptions = {
	email?: string;
	name?: string;
	role?: Role;
};

type AuthFixtures = {
	authUser: User;
	authenticatedPage: Page;
	registerUserForCleanup: (email: string) => void;
};

type AuthOptions = {
	authUserOptions: AuthUserOptions;
};

export const test = base.extend<AuthFixtures & AuthOptions>({
	authUserOptions: [{ role: Role.PARTICIPANT }, { option: true }],

	authUser: async ({ authUserOptions }, use) => {
		const testUtils = (await auth.$context).test;
		const user = testUtils.createUser({
			...(authUserOptions.email ? { email: authUserOptions.email } : {}),
			name: authUserOptions.name ?? "E2E User",
			role: authUserOptions.role ?? Role.PARTICIPANT
		});
		const savedUser = (await testUtils.saveUser(user)) as User;
		const expectedRole = authUserOptions.role ?? Role.PARTICIPANT;

		try {
			if (savedUser.role !== expectedRole) {
				throw new Error(
					`Expected E2E user role to be ${expectedRole}, got ${savedUser.role}`
				);
			}
			await use(savedUser);
		} finally {
			await testUtils.deleteUser(savedUser.id);
		}
	},

	// biome-ignore lint/correctness/noEmptyPattern: This fixture has no dependencies.
	registerUserForCleanup: async ({}, use) => {
		const emails = new Set<string>();

		await use((email: string) => {
			emails.add(email);
		});

		for (const email of emails) {
			await db.delete(user).where(eq(user.email, email));
		}
	},

	authenticatedPage: async ({ context, page, authUser }, use, testInfo) => {
		const testUtils = (await auth.$context).test;
		const baseURL =
			testInfo.project.use.baseURL ??
			process.env.PLAYWRIGHT_BASE_URL ??
			"http://127.0.0.1:3000";
		const domain = new URL(baseURL).hostname;

		const cookies = await testUtils.getCookies({
			userId: authUser.id,
			domain
		});
		await context.addCookies(cookies);

		await use(page);
	}
});

export { expect } from "playwright/test";
