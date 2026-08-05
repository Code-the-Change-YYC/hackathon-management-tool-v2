import { auth } from "auth.test";
import type { Page } from "playwright/test";
import { test as base } from "playwright/test";
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
