import "dotenv/config";

import { auth } from "auth.test";
import { eq } from "drizzle-orm";
import type { Page, TestInfo } from "playwright/test";
import { test as base } from "playwright/test";
import { user } from "@/server/db/auth-schema";
import type { User } from "@/types/types";
import { Role } from "@/types/types";
import { assertE2EDatabaseSafety, assertLocalE2EOrigin, e2eDb } from "../db";

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

const getTestBaseURL = (testInfo: TestInfo) =>
	testInfo.project.use.baseURL ??
	process.env.PLAYWRIGHT_BASE_URL ??
	"http://127.0.0.1:3000";

export const test = base.extend<AuthFixtures & AuthOptions>({
	authUserOptions: [{ role: Role.PARTICIPANT }, { option: true }],

	authUser: async ({ authUserOptions }, use, testInfo) => {
		assertLocalE2EOrigin(getTestBaseURL(testInfo));
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
			assertE2EDatabaseSafety();
			await testUtils.deleteUser(savedUser.id);
		}
	},

	// biome-ignore lint/correctness/noEmptyPattern: This fixture has no dependencies.
	registerUserForCleanup: async ({}, use, testInfo) => {
		const emails = new Set<string>();
		assertLocalE2EOrigin(getTestBaseURL(testInfo));

		await use((email: string) => {
			emails.add(email);
		});

		assertE2EDatabaseSafety();
		for (const email of emails) {
			await e2eDb.delete(user).where(eq(user.email, email));
		}
	},

	authenticatedPage: async ({ context, page, authUser }, use, testInfo) => {
		const testUtils = (await auth.$context).test;
		const baseURL = getTestBaseURL(testInfo);
		assertLocalE2EOrigin(baseURL);
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
