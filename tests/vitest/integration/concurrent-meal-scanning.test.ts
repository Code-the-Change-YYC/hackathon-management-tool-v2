import assert from "node:assert/strict";
import { and, eq } from "drizzle-orm";
import { expect, it, onTestFinished } from "vitest";
import { db } from "@/server/db";
import { eventAttendance } from "@/server/db/event-schema";
import { EventStatus, EventType, Role } from "@/types/types";
import { EventFixtureTracker } from "../../utils/events";
import { createAuthenticatedCaller } from "../helpers/auth";

it("HMTV2-79 PART07: independent scanners redeem one current ticket exactly once", async () => {
	const events = new EventFixtureTracker();
	const participant = await createAuthenticatedCaller();
	const admins = [
		await createAuthenticatedCaller({ role: Role.ADMIN }),
		await createAuthenticatedCaller({ role: Role.ADMIN })
	];
	onTestFinished(async () => {
		await events.cleanup();
		await participant.cleanup();
		for (const admin of admins) await admin.cleanup();
	});
	const now = Date.now();
	const meal = await events.create({
		title: "Concurrent check-in",
		type: EventType.FOOD,
		status: EventStatus.ACTIVE,
		startTime: new Date(now - 60_000),
		endTime: new Date(now + 3_600_000)
	});
	const ticket = await participant.caller.events.rotateParticipantEventTicket({
		eventId: meal.id
	});
	assert(ticket.status === "active");
	let release!: () => void;
	const gate = new Promise<void>((resolve) => {
		release = resolve;
	});
	const pending = admins.map(async ({ caller }) => {
		await gate;
		return caller.events.redeemEventTicket({
			eventId: meal.id,
			token: ticket.token
		});
	});
	release();
	const outcomes = await Promise.all(pending);
	expect(outcomes.map((result) => result.status).sort()).toEqual([
		"already_checked_in",
		"checked_in"
	]);
	expect(new Set(outcomes.map((result) => result.attendanceId)).size).toBe(1);
	const rows = await db.query.eventAttendance.findMany({
		where: and(
			eq(eventAttendance.eventId, meal.id),
			eq(eventAttendance.userId, participant.user.id)
		)
	});
	expect(rows).toHaveLength(1);
	expect(rows[0]?.id).toBe(outcomes[0]?.attendanceId);
	for (const admin of admins)
		expect(
			await admin.caller.events.getEventAttendees({ eventId: meal.id })
		).toHaveLength(1);
});
