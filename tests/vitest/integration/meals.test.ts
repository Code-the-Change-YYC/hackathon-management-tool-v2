import assert from "node:assert/strict";
import { and, eq } from "drizzle-orm";
import {
	afterEach,
	beforeAll,
	describe,
	expect,
	it,
	onTestFinished
} from "vitest";
import { db } from "@/server/db";
import { event, eventAttendance, eventTicket } from "@/server/db/event-schema";
import {
	createEventTicketToken,
	hashEventTicketToken,
	isValidMealScannerLease
} from "@/server/lib/event-tickets";
import { EventStatus, EventTicketStatus, EventType, Role } from "@/types/types";
import { assertE2EDatabaseSafety } from "../../e2e/db";
import { EventFixtureTracker } from "../../utils/events";
import {
	createAuthenticatedCaller,
	createUnauthenticatedCaller
} from "../helpers/auth";
import { runConcurrently } from "../helpers/concurrency";

const hour = 60 * 60 * 1000;

describe("concurrent meal scanning", () => {
	beforeAll(() => {
		assertE2EDatabaseSafety();
	});

	it("independent scanners redeem one current ticket exactly once", async () => {
		const events = new EventFixtureTracker();
		const participant = await createAuthenticatedCaller({ checkedIn: true });
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
			endTime: new Date(now + hour)
		});
		const ticket = await participant.caller.events.issueParticipantEventTicket({
			eventId: meal.id
		});
		assert(ticket.status === "active");
		const results = await runConcurrently(
			admins.map(
				({ caller }) =>
					() =>
						caller.events.redeemEventTicket({
							eventId: meal.id,
							token: ticket.token
						})
			)
		);
		const outcomes = results.map((result) => {
			assert(result.status === "fulfilled");
			return result.value;
		});
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
		for (const admin of admins) {
			const meals = await admin.caller.meals.getMealCheckIns();
			expect(
				meals.find((current) => current.id === meal.id)?.attendance
			).toHaveLength(1);
		}
	});
});

describe("meal ticket issuing", () => {
	beforeAll(() => {
		assertE2EDatabaseSafety();
	});

	// Given a checked-in participant with Meals open on their phone
	// When they open Meals again on a laptop
	// Then the phone's code still scans, and other meals and people get other codes.
	it("keeps the code on screen valid when Meals opens elsewhere", async () => {
		const fixtures = new EventFixtureTracker();
		const admin = await createAuthenticatedCaller({ role: Role.ADMIN });
		const participant = await createAuthenticatedCaller({ checkedIn: true });
		const teammate = await createAuthenticatedCaller({ checkedIn: true });
		onTestFinished(async () => {
			await fixtures.cleanup();
			await admin.cleanup();
			await participant.cleanup();
			await teammate.cleanup();
		});
		const now = Date.now();
		const lunch = await fixtures.create({
			title: "Two-device lunch",
			type: EventType.FOOD,
			status: EventStatus.ACTIVE,
			startTime: new Date(now - hour),
			endTime: new Date(now + hour)
		});
		const dinner = await fixtures.create({
			title: "Two-device dinner",
			type: EventType.FOOD,
			status: EventStatus.ACTIVE,
			startTime: new Date(now + 2 * hour),
			endTime: new Date(now + 3 * hour)
		});

		const phone = await participant.caller.events.issueParticipantEventTicket({
			eventId: lunch.id
		});
		const laptop = await participant.caller.events.issueParticipantEventTicket({
			eventId: lunch.id
		});
		const dinnerTicket =
			await participant.caller.events.issueParticipantEventTicket({
				eventId: dinner.id
			});
		const teammateTicket =
			await teammate.caller.events.issueParticipantEventTicket({
				eventId: lunch.id
			});
		assert(phone.status === EventTicketStatus.ACTIVE);
		assert(laptop.status === EventTicketStatus.ACTIVE);
		assert(dinnerTicket.status === EventTicketStatus.ACTIVE);
		assert(teammateTicket.status === EventTicketStatus.ACTIVE);
		expect(laptop.token).toBe(phone.token);
		expect(
			new Set([phone.token, dinnerTicket.token, teammateTicket.token]).size
		).toBe(3);

		await expect(
			admin.caller.events.redeemEventTicket({
				eventId: lunch.id,
				token: phone.token
			})
		).resolves.toMatchObject({
			status: "checked_in",
			participant: { id: participant.user.id }
		});
	});
});

describe("meal scanner lease", () => {
	beforeAll(() => {
		assertE2EDatabaseSafety();
	});

	// Given an admin opened the scanner while a meal was eligible
	// When the scheduled meal ends while the scanner remains open
	// Then the original ticket still scans for that meal, but not without the lease.
	it("allows the open scanner to finish a meal line after its end", async () => {
		const fixtures = new EventFixtureTracker();
		const admin = await createAuthenticatedCaller({ role: Role.ADMIN });
		const participant = await createAuthenticatedCaller({
			checkedIn: true,
			role: Role.PARTICIPANT
		});
		onTestFinished(async () => {
			await fixtures.cleanup();
			await admin.cleanup();
			await participant.cleanup();
		});
		const now = Date.now();
		const meal = await fixtures.create({
			title: "Long meal line",
			type: EventType.FOOD,
			status: EventStatus.ACTIVE,
			startTime: new Date(now - hour),
			endTime: new Date(now + hour)
		});
		const token = createEventTicketToken(meal.id, participant.user.id);
		await db.insert(eventTicket).values({
			eventId: meal.id,
			userId: participant.user.id,
			tokenHash: hashEventTicketToken(token),
			expiresAt: meal.endTime
		});
		const { lease } = await admin.caller.meals.beginMealScan({
			eventId: meal.id
		});
		expect(
			isValidMealScannerLease(
				lease,
				meal.id,
				admin.user.id,
				new Date(now + 3 * hour),
				meal.endTime
			)
		).toBe(false);
		expect(
			isValidMealScannerLease(
				lease,
				meal.id,
				participant.user.id,
				new Date(now),
				meal.endTime
			)
		).toBe(false);
		expect(
			isValidMealScannerLease(
				`${lease}changed`,
				meal.id,
				admin.user.id,
				new Date(now),
				meal.endTime
			)
		).toBe(false);
		await db
			.update(event)
			.set({ endTime: new Date(now - 1_000) })
			.where(eq(event.id, meal.id));
		await db
			.update(eventTicket)
			.set({ expiresAt: new Date(now - 1_000) })
			.where(eq(eventTicket.eventId, meal.id));
		await expect(
			admin.caller.meals.beginMealScan({ eventId: meal.id })
		).rejects.toMatchObject({ code: "BAD_REQUEST" });
		await expect(
			admin.caller.events.redeemEventTicket({ eventId: meal.id, token })
		).rejects.toMatchObject({ code: "BAD_REQUEST" });
		await expect(
			admin.caller.events.redeemEventTicket({
				eventId: meal.id,
				token,
				scannerLease: lease
			})
		).resolves.toMatchObject({ status: "checked_in" });
		await db
			.update(event)
			.set({ status: EventStatus.DRAFT })
			.where(eq(event.id, meal.id));
		await expect(
			admin.caller.events.redeemEventTicket({
				eventId: meal.id,
				token,
				scannerLease: lease
			})
		).rejects.toMatchObject({ code: "BAD_REQUEST" });
	});
});

describe("meal ticket check-in gate", () => {
	beforeAll(() => {
		assertE2EDatabaseSafety();
	});

	// Given a participant an admin has not checked in
	// When they request a ticket, or an admin unchecks them after one was issued
	// Then neither the ticket nor the scan goes through.
	it("blocks tickets for participants who have not checked in", async () => {
		const fixtures = new EventFixtureTracker();
		const admin = await createAuthenticatedCaller({ role: Role.ADMIN });
		const participant = await createAuthenticatedCaller({
			role: Role.PARTICIPANT
		});
		onTestFinished(async () => {
			await fixtures.cleanup();
			await admin.cleanup();
			await participant.cleanup();
		});
		const now = Date.now();
		const meal = await fixtures.create({
			title: "Check-in lunch",
			type: EventType.FOOD,
			status: EventStatus.ACTIVE,
			startTime: new Date(now - hour),
			endTime: new Date(now + hour)
		});

		await expect(
			participant.caller.events.issueParticipantEventTicket({
				eventId: meal.id
			})
		).rejects.toMatchObject({ code: "FORBIDDEN" });

		await admin.caller.users.update({
			id: participant.user.id,
			checkedIn: true
		});
		const ticket = await participant.caller.events.issueParticipantEventTicket({
			eventId: meal.id
		});
		if (ticket.status !== EventTicketStatus.ACTIVE) {
			throw new Error("Expected an active ticket");
		}

		await admin.caller.users.update({
			id: participant.user.id,
			checkedIn: false
		});
		await expect(
			admin.caller.events.redeemEventTicket({
				eventId: meal.id,
				token: ticket.token
			})
		).rejects.toMatchObject({ code: "FORBIDDEN" });
	});
});

describe("meals.getMealCheckIns", () => {
	let mealFixtures: EventFixtureTracker;

	beforeAll(() => {
		assertE2EDatabaseSafety();
	});

	afterEach(async () => {
		await mealFixtures?.cleanup();
	});

	it("rejects callers without a session", async () => {
		const caller = createUnauthenticatedCaller();

		await expect(caller.meals.getMealCheckIns()).rejects.toMatchObject({
			code: "UNAUTHORIZED"
		});
	});

	it("returns the tracked meals in chronological order", async () => {
		mealFixtures = new EventFixtureTracker();
		const startTime = Date.now() + 24 * hour;
		const laterMeal = await mealFixtures.create({
			endTime: new Date(startTime + 3 * hour),
			startTime: new Date(startTime + 2 * hour),
			title: "Later meal"
		});
		const earlierMeal = await mealFixtures.create({
			endTime: new Date(startTime + hour),
			startTime: new Date(startTime),
			title: "Earlier meal"
		});
		const { caller, cleanup } = await createAuthenticatedCaller({
			role: Role.ADMIN
		});
		onTestFinished(cleanup);

		const meals = await caller.meals.getMealCheckIns();
		const trackedIds = new Set([earlierMeal.id, laterMeal.id]);
		const trackedMeals = meals.filter((meal) => trackedIds.has(meal.id));

		expect(trackedMeals.map((meal) => meal.id)).toEqual([
			earlierMeal.id,
			laterMeal.id
		]);
	});
});
