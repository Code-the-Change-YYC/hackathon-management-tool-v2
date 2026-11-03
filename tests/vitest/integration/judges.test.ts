import assert from "node:assert/strict";
import { auth } from "auth.test";
import { eq } from "drizzle-orm";
import {
	afterEach,
	beforeAll,
	describe,
	expect,
	it,
	onTestFinished,
	vi
} from "vitest";
import { db } from "@/server/db";

// Keep the suite hermetic: never make a real Resend call during tests.
vi.mock("@/server/email", () => ({ sendEmail: vi.fn() }));

import { organization, user } from "@/server/db/auth-schema";
import {
	judgingAssignments,
	judgingCriteria,
	judgingRounds,
	judgingScores,
	judgingTables
} from "@/server/db/judging-schema";
import { sendEmail } from "@/server/email";
import { Role } from "@/types/types";
import { assertE2EDatabaseSafety } from "../../e2e/db";
import {
	createTestUser,
	getTestUserCookies,
	getVerificationCode
} from "../../utils/auth";
import {
	createAuthenticatedCaller,
	createUnauthenticatedCaller
} from "../helpers/auth";

const judgeEmails = new Set<string>();

function newJudge() {
	const email = `judge-${crypto.randomUUID()}@hackathon.com`;
	judgeEmails.add(email);
	return { firstName: "Grace", lastName: "Hopper", email };
}

async function createAdminCaller() {
	const admin = await createAuthenticatedCaller({ role: Role.ADMIN });
	onTestFinished(admin.cleanup);
	return admin;
}

describe("judges router", () => {
	beforeAll(() => {
		assertE2EDatabaseSafety();
	});

	afterEach(async () => {
		for (const email of judgeEmails) {
			await db.delete(user).where(eq(user.email, email));
		}
		judgeEmails.clear();
		vi.mocked(sendEmail).mockReset();
	});

	it("rejects callers without the admin role", async () => {
		await expect(
			createUnauthenticatedCaller().judges.create(newJudge())
		).rejects.toMatchObject({ code: "UNAUTHORIZED" });

		const participant = await createAuthenticatedCaller();
		onTestFinished(participant.cleanup);
		await expect(
			participant.caller.judges.create(newJudge())
		).rejects.toMatchObject({ code: "FORBIDDEN" });
	});

	it("creates a registered judge without a password and emails a login link", async () => {
		const { caller } = await createAdminCaller();
		const judge = newJudge();

		const result = await caller.judges.create({
			...judge,
			email: judge.email.toUpperCase()
		});

		expect(result.emailSent).toBe(true);
		const created = await db.query.user.findFirst({
			where: eq(user.email, judge.email),
			with: { accounts: true }
		});
		expect(created).toMatchObject({
			id: result.id,
			name: "Grace Hopper",
			firstName: "Grace",
			lastName: "Hopper",
			role: Role.JUDGE,
			emailVerified: false,
			completedRegistration: true
		});
		expect(created?.accounts).toHaveLength(0);
		expect(sendEmail).toHaveBeenCalledWith(
			expect.objectContaining({
				to: judge.email,
				text: expect.stringContaining(
					`/judge-login?${new URLSearchParams({ email: judge.email })}`
				)
			})
		);
	});

	it("rejects an email that already has an account, ignoring case", async () => {
		const { caller } = await createAdminCaller();
		const participant = await createTestUser();
		onTestFinished(participant.cleanup);

		await expect(
			caller.judges.create({
				...newJudge(),
				email: participant.user.email.toUpperCase()
			})
		).rejects.toMatchObject({ code: "CONFLICT" });
		const unchanged = await db.query.user.findFirst({
			where: eq(user.id, participant.user.id)
		});
		expect(unchanged?.role).toBe(Role.PARTICIPANT);
	});

	it("keeps the judge when the access email fails, so it can be resent", async () => {
		const { caller } = await createAdminCaller();
		const judge = newJudge();
		vi.mocked(sendEmail).mockRejectedValueOnce(new Error("Resend is down"));
		vi.spyOn(console, "error").mockImplementationOnce(() => {});

		const { id, emailSent } = await caller.judges.create(judge);

		expect(emailSent).toBe(false);
		await caller.judges.resendAccessEmail({ id });
		expect(sendEmail).toHaveBeenCalledTimes(2);
	});

	it("only resends access emails to judges", async () => {
		const { caller } = await createAdminCaller();
		const participant = await createTestUser();
		onTestFinished(participant.cleanup);

		await expect(
			caller.judges.resendAccessEmail({ id: participant.user.id })
		).rejects.toMatchObject({ code: "BAD_REQUEST" });
	});
});

describe("judge sign-in with an emailed code", () => {
	beforeAll(() => {
		assertE2EDatabaseSafety();
	});

	afterEach(() => {
		vi.mocked(sendEmail).mockReset();
	});

	it("signs a judge in and verifies their email", async () => {
		const judge = await createTestUser({
			role: Role.JUDGE,
			emailVerified: false,
			completedRegistration: true
		});
		onTestFinished(judge.cleanup);

		await auth.api.sendVerificationOTP({
			body: { email: judge.user.email, type: "sign-in" }
		});
		const otp = await getVerificationCode(judge.user.email, "sign-in");
		assert(otp);
		const { user: signedIn } = await auth.api.signInEmailOTP({
			body: { email: judge.user.email, otp }
		});

		expect(signedIn.id).toBe(judge.user.id);
		const updated = await db.query.user.findFirst({
			where: eq(user.id, judge.user.id)
		});
		expect(updated?.emailVerified).toBe(true);
	});

	it("refuses codes for anyone who isn't a judge", async () => {
		const participant = await createTestUser();
		onTestFinished(participant.cleanup);
		const admin = await createTestUser({ role: Role.ADMIN });
		onTestFinished(admin.cleanup);

		for (const email of [
			participant.user.email,
			admin.user.email,
			`nobody-${crypto.randomUUID()}@hackathon.com`
		]) {
			await expect(
				auth.api.sendVerificationOTP({ body: { email, type: "sign-in" } })
			).rejects.toMatchObject({ body: { code: "JUDGE_NOT_FOUND" } });
			await expect(
				auth.api.signInEmailOTP({ body: { email, otp: "123456" } })
			).rejects.toMatchObject({ body: { code: "JUDGE_NOT_FOUND" } });
		}
		expect(sendEmail).not.toHaveBeenCalled();
	});
});

describe("deleting a judge", () => {
	beforeAll(() => {
		assertE2EDatabaseSafety();
	});

	async function adminHeaders() {
		const admin = await createTestUser({ role: Role.ADMIN });
		onTestFinished(admin.cleanup);
		const cookies = await getTestUserCookies(admin.user.id, "127.0.0.1");
		return new Headers({
			cookie: cookies
				.map((cookie) => `${cookie.name}=${cookie.value}`)
				.join("; ")
		});
	}

	it("is blocked once the judge has submitted scores", async () => {
		const headers = await adminHeaders();
		const judge = await createTestUser({ role: Role.JUDGE });
		onTestFinished(judge.cleanup);
		const roundId = crypto.randomUUID();
		const teamId = crypto.randomUUID();
		const criterionId = crypto.randomUUID();
		onTestFinished(async () => {
			await db.delete(judgingRounds).where(eq(judgingRounds.id, roundId));
			await db
				.delete(judgingCriteria)
				.where(eq(judgingCriteria.id, criterionId));
			await db.delete(organization).where(eq(organization.id, teamId));
		});

		await db.insert(judgingRounds).values({
			id: roundId,
			name: "Judge deletion test",
			kind: "panel",
			startTime: new Date(),
			endTime: new Date(Date.now() + 60_000)
		});
		await db.insert(organization).values({
			id: teamId,
			name: "Judge deletion test team",
			slug: `judge-delete-test-${teamId}`,
			createdAt: new Date()
		});
		await db.insert(judgingCriteria).values({
			id: criterionId,
			name: "Technical",
			maxScore: 5
		});
		const [table] = await db
			.insert(judgingTables)
			.values({ roundId, tableNumber: 1 })
			.returning();
		assert(table);
		const [assignment] = await db
			.insert(judgingAssignments)
			.values({ tableId: table.id, teamId, startsAt: new Date() })
			.returning();
		assert(assignment);
		await db.insert(judgingScores).values({
			assignmentId: assignment.id,
			criteriaId: criterionId,
			judgeId: judge.user.id,
			value: 3
		});

		await expect(
			auth.api.removeUser({ body: { userId: judge.user.id }, headers })
		).rejects.toMatchObject({ body: { code: "USER_HAS_SCORES" } });
		expect(
			await db.query.user.findFirst({ where: eq(user.id, judge.user.id) })
		).toBeDefined();

		// The round's cleanup removes the score, so the judge can then be deleted.
		await db.delete(judgingRounds).where(eq(judgingRounds.id, roundId));
		await expect(
			auth.api.removeUser({ body: { userId: judge.user.id }, headers })
		).resolves.toEqual({ success: true });
	});
});
