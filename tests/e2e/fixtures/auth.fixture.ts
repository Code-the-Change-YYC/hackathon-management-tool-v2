import { auth } from "auth.test";
import { eq } from "drizzle-orm";
import type { Page, TestInfo } from "playwright/test";
import { test as base } from "playwright/test";
import { db } from "@/server/db";
import { user } from "@/server/db/auth-schema";
import type { User } from "@/types/types";
import { Role } from "@/types/types";
import { assertE2EDatabaseSafety, assertLocalE2EOrigin } from "../db";

type AuthUserOptions = Partial<
	Pick<User, "email" | "name" | "role" | "dietaryRestrictions">
> & {
	role?: Role;
};

type AuthFixtures = {
	authUser: User;
	authenticatedPage: Page;
	registerUserForCleanup: (email: string) => void;
	authUserOptions: AuthUserOptions;
};

const getTestBaseURL = (testInfo: TestInfo) =>
	testInfo.project.use.baseURL ?? "http://127.0.0.1:3000";

const DEFAULT_USER_OPTIONS = {
	name: "E2E User",
	role: Role.PARTICIPANT,
	email: `e2e-user-${Date.now()}@hackathon.com`,
	id: `e2e-participant-user${Date.now()}`,
	emailVerified: true,
	dietaryRestrictions: ["gluten_free"]
} as const satisfies Partial<User>;

export const test = base.extend<AuthFixtures>({
	authUserOptions: [DEFAULT_USER_OPTIONS, { option: true }] as const,

	authUser: async ({ authUserOptions }, use, testInfo) => {
		assertLocalE2EOrigin(getTestBaseURL(testInfo));
		const testUtils = (await auth.$context).test;
		const user = testUtils.createUser({
			...DEFAULT_USER_OPTIONS,
			...authUserOptions
		});
		const savedUser = await testUtils.saveUser(user);

		await use(savedUser as User);
		await testUtils.deleteUser(savedUser.id);
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
