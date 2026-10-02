import { auth } from "auth.test";
import { eq } from "drizzle-orm";
import { db } from "@/server/db";
import { verification } from "@/server/db/auth-schema";
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

/**
 * A verified user who can log in with an email and password. Created directly
 * in the database, so no verification email is sent.
 */
export async function createTestUserWithPassword(
	password: string,
	options: TestUserOptions = {}
) {
	const testUser = await createTestUser(options);
	const context = await auth.$context;
	await context.internalAdapter.linkAccount({
		accountId: testUser.user.id,
		password: await context.password.hash(password),
		providerId: "credential",
		userId: testUser.user.id
	});

	return testUser;
}

/** The latest email verification code sent to an address, read from the database. */
export async function getVerificationCode(email: string) {
	assertE2EDatabaseSafety();
	const stored = await db.query.verification.findFirst({
		where: eq(verification.identifier, `email-verification-otp-${email}`)
	});
	// Stored as "<code>:<failed attempts>".
	return stored?.value.split(":")[0];
}
