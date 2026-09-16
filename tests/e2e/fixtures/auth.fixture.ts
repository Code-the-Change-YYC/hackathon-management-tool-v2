import { eq } from "drizzle-orm";
import type { Page, TestInfo } from "playwright/test";
import { test as base } from "playwright/test";
import { db } from "@/server/db";
import { user } from "@/server/db/auth-schema";
import type { User } from "@/types/types";
import {
	createTestUser,
	getTestUserCookies,
	type TestUserOptions
} from "../../utils/auth";
import { assertE2EDatabaseSafety, assertLocalE2EOrigin } from "../db";

type AuthFixtures = {
	authUser: User;
	authenticatedPage: Page;
	registerUserForCleanup: (email: string) => void;
	authUserOptions: TestUserOptions;
};

const getTestBaseURL = (testInfo: TestInfo) =>
	testInfo.project.use.baseURL ?? "http://127.0.0.1:3000";

export const test = base.extend<AuthFixtures>({
	authUserOptions: [{}, { option: true }] as const,

	authUser: async ({ authUserOptions }, use, testInfo) => {
		assertLocalE2EOrigin(getTestBaseURL(testInfo));
		const { cleanup, user } = await createTestUser(authUserOptions);

		await use(user);
		await cleanup();
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
			await db.delete(user).where(eq(user.email, email));
		}
	},

	authenticatedPage: async ({ context, page, authUser }, use, testInfo) => {
		const baseURL = getTestBaseURL(testInfo);
		assertLocalE2EOrigin(baseURL);
		const domain = new URL(baseURL).hostname;

		const cookies = await getTestUserCookies(authUser.id, domain);
		await context.addCookies(cookies);

		await use(page);
	}
});

export { expect } from "playwright/test";
