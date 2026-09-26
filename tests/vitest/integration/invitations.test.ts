import { eq } from "drizzle-orm";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { db } from "@/server/db";

// Keep the suite hermetic: never make a real Resend call during tests.
vi.mock("@/server/email", () => ({ sendEmail: vi.fn() }));

import { user } from "@/server/db/auth-schema";
import { roleInvitation } from "@/server/db/schema";
import { Role } from "@/types/types";
import { assertE2EDatabaseSafety } from "../../e2e/db";
import {
	createAuthenticatedCaller,
	createUnauthenticatedCaller
} from "../helpers/auth";

const invitedEmails = new Set<string>();

describe("invitations.invite", () => {
	beforeAll(() => {
		assertE2EDatabaseSafety();
	});

	afterEach(async () => {
		for (const email of invitedEmails) {
			await db.delete(roleInvitation).where(eq(roleInvitation.email, email));
		}
		invitedEmails.clear();
	});

	it("rejects callers without a session", async () => {
		const caller = createUnauthenticatedCaller();
		await expect(
			caller.invitations.invite({ email: "x@hackathon.com", role: Role.JUDGE })
		).rejects.toMatchObject({ code: "UNAUTHORIZED" });
	});

	it("rejects non-admin callers", async () => {
		const { caller, cleanup } = await createAuthenticatedCaller({
			role: Role.PARTICIPANT
		});
		try {
			await expect(
				caller.invitations.invite({
					email: "x@hackathon.com",
					role: Role.JUDGE
				})
			).rejects.toMatchObject({ code: "FORBIDDEN" });
		} finally {
			await cleanup();
		}
	});

	it("promotes an existing user and records the invitation", async () => {
		const admin = await createAuthenticatedCaller({ role: Role.ADMIN });
		const target = await createAuthenticatedCaller({ role: Role.PARTICIPANT });
		invitedEmails.add(target.user.email.toLowerCase());

		try {
			await admin.caller.invitations.invite({
				email: target.user.email,
				role: Role.JUDGE
			});

			const updated = await db.query.user.findFirst({
				where: eq(user.id, target.user.id)
			});
			expect(updated?.role).toBe(Role.JUDGE);

			const invite = await db.query.roleInvitation.findFirst({
				where: eq(roleInvitation.email, target.user.email.toLowerCase())
			});
			expect(invite?.role).toBe(Role.JUDGE);
		} finally {
			await target.cleanup();
			await admin.cleanup();
		}
	});

	it("matches an existing user case-insensitively", async () => {
		const admin = await createAuthenticatedCaller({ role: Role.ADMIN });
		const mixedEmail = `Mixed.${crypto.randomUUID()}@Hackathon.com`;
		const target = await createAuthenticatedCaller({
			role: Role.PARTICIPANT,
			email: mixedEmail
		});
		invitedEmails.add(mixedEmail.toLowerCase());

		try {
			await admin.caller.invitations.invite({
				email: mixedEmail.toLowerCase(),
				role: Role.JUDGE
			});

			const updated = await db.query.user.findFirst({
				where: eq(user.id, target.user.id)
			});
			expect(updated?.role).toBe(Role.JUDGE);
		} finally {
			await target.cleanup();
			await admin.cleanup();
		}
	});

	it("does not downgrade an existing higher-privilege account", async () => {
		const admin = await createAuthenticatedCaller({ role: Role.ADMIN });
		const target = await createAuthenticatedCaller({ role: Role.ADMIN });
		invitedEmails.add(target.user.email.toLowerCase());

		try {
			await admin.caller.invitations.invite({
				email: target.user.email,
				role: Role.PARTICIPANT
			});

			const updated = await db.query.user.findFirst({
				where: eq(user.id, target.user.id)
			});
			expect(updated?.role).toBe(Role.ADMIN);

			const invite = await db.query.roleInvitation.findFirst({
				where: eq(roleInvitation.email, target.user.email.toLowerCase())
			});
			expect(invite?.role).toBe(Role.ADMIN);
		} finally {
			await target.cleanup();
			await admin.cleanup();
		}
	});
});
