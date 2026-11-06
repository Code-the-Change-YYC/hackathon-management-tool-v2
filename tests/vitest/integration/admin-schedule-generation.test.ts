import assert from "node:assert/strict";
import { eq } from "drizzle-orm";
import { expect, it, onTestFinished } from "vitest";
import { db } from "@/server/db";
import { organization } from "@/server/db/auth-schema";
import { judgingRounds } from "@/server/db/schema";
import { Role } from "@/types/types";
import { TeamFixtureTracker } from "../../utils/teams";
import { createAuthenticatedCaller } from "../helpers/auth";

it("HMTV2-55: schedules passed teams without conflicts and preserves a layout after invalid generation", async () => {
	const teams = new TeamFixtureTracker();
	const admin = await createAuthenticatedCaller({ role: Role.ADMIN });
	const judge = await createAuthenticatedCaller({ role: Role.JUDGE });
	const roundId = crypto.randomUUID();
	onTestFinished(async () => {
		await db.delete(judgingRounds).where(eq(judgingRounds.id, roundId));
		await teams.cleanup();
		await judge.cleanup();
		await admin.cleanup();
	});
	const passed = [
		await teams.create("Passed A"),
		await teams.create("Passed B")
	];
	const pending = await teams.create("Pending");
	for (const team of passed)
		await db
			.update(organization)
			.set({ prescreenStatus: "passed" })
			.where(eq(organization.id, team.id));
	const now = Date.now();
	await db.insert(judgingRounds).values({
		id: roundId,
		name: "Scheduling regression",
		startTime: new Date(now + 60_000),
		endTime: new Date(now + 3_660_000)
	});
	const input = {
		roundId,
		roomCount: 1,
		judgesPerRoom: 1,
		slotDurationMinutes: 15,
		totalJudgingMinutes: 60
	};
	expect(await admin.caller.judgingRooms.generateSchedule(input)).toMatchObject(
		{ success: true, assignmentsCreated: 2 }
	);
	const rows = await admin.caller.judgingAssignments.getByRound({ roundId });
	expect(rows.map(({ teamId }) => teamId).sort()).toEqual(
		passed.map(({ id }) => id).sort()
	);
	expect(rows.map(({ teamId }) => teamId)).not.toContain(pending.id);
	expect(
		new Set(rows.map((row) => `${row.roomId}:${row.timeSlot?.toISOString()}`))
			.size
	).toBe(rows.length);
	assert(rows[0]?.timeSlot && rows[1]?.timeSlot);
	expect(
		Math.abs(rows[0].timeSlot.getTime() - rows[1].timeSlot.getTime())
	).toBe(15 * 60_000);
	await expect(
		admin.caller.judgingRooms.generateSchedule({
			...input,
			totalJudgingMinutes: 15
		})
	).rejects.toMatchObject({ code: "BAD_REQUEST" });
	expect(
		(await admin.caller.judgingAssignments.getByRound({ roundId }))
			.map(({ id }) => id)
			.sort()
	).toEqual(rows.map(({ id }) => id).sort());
});

it.each([
	Role.PARTICIPANT,
	Role.JUDGE
])("HMTV2-55: %s cannot generate judging schedules", async (role) => {
	const account = await createAuthenticatedCaller({ role });
	onTestFinished(account.cleanup);
	await expect(
		account.caller.judgingRooms.generateSchedule({
			roundId: crypto.randomUUID(),
			roomCount: 1,
			judgesPerRoom: 1,
			slotDurationMinutes: 15,
			totalJudgingMinutes: 60
		})
	).rejects.toMatchObject({ code: "FORBIDDEN" });
});
