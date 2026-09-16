import { auth } from "auth.test";
import { Role, type User } from "@/types/types";
import { assertE2EDatabaseSafety } from "../e2e/db";

export type TestUserOptions = Partial<User>;

export async function createTestUser(options: TestUserOptions = {}) {
	assertE2EDatabaseSafety();

	const testUtils = (await auth.$context).test;
	const identifier = crypto.randomUUID();
	const createdUser = testUtils.createUser({
		dietaryRestrictions: [],
		email: `test-user-${identifier}@hackathon.com`,
		emailVerified: true,
		id: `test-user-${identifier}`,
		name: "Test User",
		role: Role.PARTICIPANT,
		...options
	});
	const user = (await testUtils.saveUser(createdUser)) as User;

	return {
		cleanup: async () => {
			assertE2EDatabaseSafety();
			await testUtils.deleteUser(user.id);
		},
		user
	};
}

export async function getTestUserCookies(userId: string, domain: string) {
	const testUtils = (await auth.$context).test;
	return testUtils.getCookies({ domain, userId });
}
