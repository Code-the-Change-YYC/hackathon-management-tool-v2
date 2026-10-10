import { auth } from "auth.test";
import { eq } from "drizzle-orm";
import {
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
	onTestFinished,
	vi
} from "vitest";
import { db } from "@/server/db";
import { session, verification } from "@/server/db/auth-schema";
import { sendEmail } from "@/server/email";
import { assertE2EDatabaseSafety } from "../../e2e/db";
import {
	createTestUser,
	createTestUserWithPassword,
	getTestUserCookies
} from "../../utils/auth";

// .env may hold a real Resend key, so catch emails instead of sending them.
vi.mock("@/server/email", () => ({ sendEmail: vi.fn() }));

const OLD_PASSWORD = "Password123!";
const NEW_PASSWORD = "NewPassword456!";

function getEmailsTo(email: string) {
	return vi
		.mocked(sendEmail)
		.mock.calls.map(([sent]) => sent)
		.filter((sent) => sent.to === email);
}

async function requestResetCode(email: string) {
	// Unused codes outlive the user, so remove them too.
	onTestFinished(async () => {
		await db
			.delete(verification)
			.where(eq(verification.identifier, `forget-password-otp-${email}`));
	});
	await auth.api.requestPasswordResetEmailOTP({ body: { email } });
	const resetEmail = getEmailsTo(email).find((sent) =>
		sent.subject.includes("password reset code")
	);
	const code = resetEmail?.text.match(/\b(\d{6})\b/)?.[1];
	if (!code) throw new Error(`No password reset code was sent to ${email}`);
	return code;
}

function logIn(email: string, password: string) {
	return auth.api.signInEmail({ body: { email, password } });
}

describe("forgot password", () => {
	beforeAll(() => {
		assertE2EDatabaseSafety();
	});

	beforeEach(() => {
		vi.mocked(sendEmail).mockClear();
	});

	it("resets the password with the emailed code and logs out everywhere else", async () => {
		const { cleanup, user } = await createTestUserWithPassword(OLD_PASSWORD);
		onTestFinished(cleanup);
		await getTestUserCookies(user.id, "127.0.0.1");

		const code = await requestResetCode(user.email);
		await auth.api.resetPasswordEmailOTP({
			body: { email: user.email, otp: code, password: NEW_PASSWORD }
		});

		await expect(logIn(user.email, OLD_PASSWORD)).rejects.toMatchObject({
			body: { code: "INVALID_EMAIL_OR_PASSWORD" }
		});
		const sessions = await db.query.session.findMany({
			where: eq(session.userId, user.id)
		});
		expect(sessions).toHaveLength(0);
		await expect(logIn(user.email, NEW_PASSWORD)).resolves.toMatchObject({
			user: { id: user.id }
		});
		expect(getEmailsTo(user.email).map(({ subject }) => subject)).toContain(
			"Your Hack the Change password was changed"
		);
	});

	it("keeps the old password when the code is wrong", async () => {
		const { cleanup, user } = await createTestUserWithPassword(OLD_PASSWORD);
		onTestFinished(cleanup);

		const code = await requestResetCode(user.email);
		const wrongCode = code === "000000" ? "111111" : "000000";
		await expect(
			auth.api.resetPasswordEmailOTP({
				body: { email: user.email, otp: wrongCode, password: NEW_PASSWORD }
			})
		).rejects.toMatchObject({ body: { code: "INVALID_OTP" } });

		await expect(logIn(user.email, OLD_PASSWORD)).resolves.toMatchObject({
			user: { id: user.id }
		});
	});

	it("doesn't reveal whether an email has an account", async () => {
		const email = `test-user-${crypto.randomUUID()}@hackathon.com`;

		await expect(
			auth.api.requestPasswordResetEmailOTP({ body: { email } })
		).resolves.toEqual({ success: true });
		expect(getEmailsTo(email)).toHaveLength(0);
	});

	it("lets someone who signed up with Google add a password", async () => {
		const { cleanup, user } = await createTestUser();
		onTestFinished(cleanup);

		const code = await requestResetCode(user.email);
		await auth.api.resetPasswordEmailOTP({
			body: { email: user.email, otp: code, password: NEW_PASSWORD }
		});

		await expect(logIn(user.email, NEW_PASSWORD)).resolves.toMatchObject({
			user: { id: user.id }
		});
	});
});
