import { eq } from "drizzle-orm";
import { describe, expect, it, onTestFinished, vi } from "vitest";
import { applyInvitedRole } from "@/server/api/routers/invitations";
import { db } from "@/server/db";
import { user } from "@/server/db/auth-schema";
import { roleInvitation } from "@/server/db/schema";
import { Role } from "@/types/types";
import { createTestUser } from "../../utils/auth";

vi.mock("@/server/email", () => ({ sendEmail: vi.fn() }));

describe("HMTV2-50 existing judge invitation security", () => {
	it("does not consume an invitation or grant judge access before email verification", async () => {
		const admin = await createTestUser({ role: Role.ADMIN });
		const target = await createTestUser({ emailVerified: false });
		onTestFinished(async () => {
			await target.cleanup();
			await admin.cleanup();
		});
		await db
			.insert(roleInvitation)
			.values({
				email: target.user.email.toLowerCase(),
				role: Role.JUDGE,
				invitedById: admin.user.id
			});
		expect(
			await applyInvitedRole(db, target.user.id, target.user.email)
		).toBeNull();
		expect(
			await db.query.roleInvitation.findFirst({
				where: eq(roleInvitation.email, target.user.email.toLowerCase())
			})
		).toMatchObject({ acceptedAt: null, role: Role.JUDGE });
		expect(
			await db.query.user.findFirst({ where: eq(user.id, target.user.id) })
		).toMatchObject({ role: Role.PARTICIPANT, emailVerified: false });
	});

	it("does not grant a role when no pending invitation exists", async () => {
		const target = await createTestUser();
		onTestFinished(target.cleanup);
		expect(
			await applyInvitedRole(db, target.user.id, target.user.email)
		).toBeNull();
		expect(
			await db.query.user.findFirst({ where: eq(user.id, target.user.id) })
		).toMatchObject({ role: Role.PARTICIPANT });
	});
});
