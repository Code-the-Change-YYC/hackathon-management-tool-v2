import assert from "node:assert/strict";
import { auth } from "auth.test";
import { desc, eq } from "drizzle-orm";
import { beforeEach, describe, expect, it, onTestFinished, vi } from "vitest";
import { db } from "@/server/db";
import { account, session, user, verification } from "@/server/db/auth-schema";
import { sendEmail } from "@/server/email";
import {
	createTestUserWithPassword,
	getVerificationCode
} from "../../utils/auth";

vi.mock("@/server/email", () => ({ sendEmail: vi.fn() }));
const password = "OriginalPassword123!";
async function target(verified = false) {
	const result = await createTestUserWithPassword(password, {
		emailVerified: verified
	});
	onTestFinished(async () => {
		await db
			.delete(verification)
			.where(
				eq(
					verification.identifier,
					`email-verification-otp-${result.user.email}`
				)
			);
		await result.cleanup();
	});
	return result.user;
}
async function issue(email: string) {
	await auth.api.sendVerificationOTP({
		body: { email, type: "email-verification" }
	});
	const otp = await getVerificationCode(email);
	assert(otp);
	return otp;
}
beforeEach(() => vi.mocked(sendEmail).mockClear());

describe("HMTV2-64 email verification and signup recovery", () => {
	it.each([
		true,
		false
	])("PUB05: repeated signup preserves a verified=%s account and password", async (emailVerified) => {
		const owner = await target(emailVerified);
		const before = await db.query.account.findFirst({
			where: eq(account.userId, owner.id)
		});
		const response = await auth.api.signUpEmail({
			body: {
				name: "Replacement identity",
				email: owner.email,
				password: "ReplacementPassword456!"
			}
		});
		expect(response.token).toBeNull();
		expect(
			await db.query.user.findMany({ where: eq(user.email, owner.email) })
		).toHaveLength(1);
		expect(
			await db.query.account.findFirst({ where: eq(account.userId, owner.id) })
		).toMatchObject({ password: before?.password });
		const emails = vi
			.mocked(sendEmail)
			.mock.calls.map(([email]) => email)
			.filter((email) => email.to === owner.email);
		expect(emails).toHaveLength(1);
		expect(emails[0]?.text).toContain(emailVerified ? "/login" : "code");
		expect(
			await db.query.session.findMany({ where: eq(session.userId, owner.id) })
		).toHaveLength(0);
	});

	it.each([
		"expired",
		"locked"
	])("PUB06: recovers an %s code and rejects its replay", async (cause) => {
		const owner = await target();
		const oldCode = await issue(owner.email);
		if (cause === "expired") {
			await db
				.update(verification)
				.set({ expiresAt: new Date(Date.now() - 1_000) })
				.where(
					eq(verification.identifier, `email-verification-otp-${owner.email}`)
				);
		} else {
			const wrong = oldCode === "000000" ? "111111" : "000000";
			for (let attempt = 0; attempt < 3; attempt++)
				await expect(
					auth.api.verifyEmailOTP({ body: { email: owner.email, otp: wrong } })
				).rejects.toThrow();
		}
		await expect(
			auth.api.verifyEmailOTP({ body: { email: owner.email, otp: oldCode } })
		).rejects.toThrow();
		expect(
			await db.query.session.findMany({ where: eq(session.userId, owner.id) })
		).toHaveLength(0);
		const replacement = await issue(owner.email);
		const verified = await auth.api.verifyEmailOTP({
			body: { email: owner.email, otp: replacement }
		});
		expect(verified.user).toMatchObject({ id: owner.id, emailVerified: true });
		expect(verified.token).toBeTruthy();
		await expect(
			auth.api.verifyEmailOTP({ body: { email: owner.email, otp: oldCode } })
		).rejects.toThrow();
	});

	it("ACC02: unverified sign-in sends a fresh code without granting a session", async () => {
		const owner = await target();
		await issue(owner.email);
		await db
			.update(verification)
			.set({ expiresAt: new Date(Date.now() - 1_000) })
			.where(
				eq(verification.identifier, `email-verification-otp-${owner.email}`)
			);
		vi.mocked(sendEmail).mockClear();
		await expect(
			auth.api.signInEmail({ body: { email: owner.email, password } })
		).rejects.toMatchObject({ body: { code: "EMAIL_NOT_VERIFIED" } });
		expect(sendEmail).toHaveBeenCalledOnce();
		const fresh = await db.query.verification.findFirst({
			orderBy: desc(verification.createdAt),
			where: eq(
				verification.identifier,
				`email-verification-otp-${owner.email}`
			)
		});
		expect(fresh?.expiresAt.getTime()).toBeGreaterThan(Date.now());
		expect(
			await db.query.session.findMany({ where: eq(session.userId, owner.id) })
		).toHaveLength(0);
	});
});
