import assert from "node:assert/strict";
import { eq } from "drizzle-orm";
import { describe, expect, it, onTestFinished, vi } from "vitest";
import { db } from "@/server/db";
import { roleInvitation } from "@/server/db/schema";
import { sendEmail } from "@/server/email";
import { Role } from "@/types/types";
import { createAuthenticatedCaller } from "../helpers/auth";

vi.mock("@/server/email", () => ({ sendEmail: vi.fn() }));

describe("HMTV2-52 invitation management", () => {
	it.each([
		Role.JUDGE,
		Role.ADMIN
	])("resends a %s invitation without duplicating its pending record", async (role) => {
		vi.mocked(sendEmail).mockClear();
		const admin = await createAuthenticatedCaller({ role: Role.ADMIN });
		const email = `invite-${crypto.randomUUID()}@example.com`;
		onTestFinished(admin.cleanup);
		await admin.caller.invitations.invite({ email: email.toUpperCase(), role });
		const original = await db.query.roleInvitation.findFirst({
			where: eq(roleInvitation.email, email)
		});
		assert(original);
		expect(original).toMatchObject({
			role,
			acceptedAt: null,
			invitedById: admin.user.id
		});
		await db
			.update(roleInvitation)
			.set({ acceptedAt: new Date() })
			.where(eq(roleInvitation.id, original.id));
		await admin.caller.invitations.invite({ email, role });
		const rows = await db.query.roleInvitation.findMany({
			where: eq(roleInvitation.email, email)
		});
		expect(rows).toHaveLength(1);
		expect(rows[0]).toMatchObject({ id: original.id, role, acceptedAt: null });
		expect(sendEmail).toHaveBeenCalledTimes(2);
		expect(sendEmail).toHaveBeenLastCalledWith(
			expect.objectContaining({
				to: email,
				text: expect.stringContaining("/signup")
			})
		);
	});
});
