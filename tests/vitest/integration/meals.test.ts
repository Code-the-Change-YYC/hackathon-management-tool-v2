import { eq } from "drizzle-orm";
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

const hour = 60 * 60 * 1000;

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
		const token = createEventTicketToken();
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
			participant.caller.events.rotateParticipantEventTicket({
				eventId: meal.id
			})
		).rejects.toMatchObject({ code: "FORBIDDEN" });

		await admin.caller.users.update({
			id: participant.user.id,
			checkedIn: true
		});
		const ticket = await participant.caller.events.rotateParticipantEventTicket(
			{ eventId: meal.id }
		);
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

describe("meals.getAttendanceAnalytics", () => {
	beforeAll(() => {
		assertE2EDatabaseSafety();
	});

	it("counts scans per meal and restrictions once per unique attendee overall, including empty meals", async () => {
		const fixtures = new EventFixtureTracker();
		const admin = await createAuthenticatedCaller({ role: Role.ADMIN });
		const first = await createAuthenticatedCaller({
			role: Role.PARTICIPANT,
			dietaryRestrictions: ["halal", "gluten_free"]
		});
		const second = await createAuthenticatedCaller({
			role: Role.PARTICIPANT,
			dietaryRestrictions: ["vegan"]
		});
		onTestFinished(async () => {
			await fixtures.cleanup();
			await first.cleanup();
			await second.cleanup();
			await admin.cleanup();
		});
		const now = Date.now();
		const breakfast = await fixtures.create({
			title: "Analytics breakfast",
			type: EventType.FOOD,
			startTime: new Date(now + hour),
			endTime: new Date(now + 2 * hour)
		});
		const lunch = await fixtures.create({
			title: "Analytics lunch",
			type: EventType.FOOD,
			startTime: new Date(now + 3 * hour),
			endTime: new Date(now + 4 * hour)
		});
		const empty = await fixtures.create({
			title: "Analytics empty meal",
			type: EventType.FOOD,
			startTime: new Date(now + 5 * hour),
			endTime: new Date(now + 6 * hour)
		});
		const nonFood = await fixtures.create({
			title: "Analytics activity",
			type: EventType.ACTIVITY,
			startTime: new Date(now + 7 * hour),
			endTime: new Date(now + 8 * hour)
		});
		const baseline = await admin.caller.meals.getAttendanceAnalytics();
		await db.insert(eventAttendance).values([
			{ eventId: breakfast.id, userId: first.user.id },
			{ eventId: breakfast.id, userId: second.user.id },
			{ eventId: lunch.id, userId: first.user.id },
			{ eventId: nonFood.id, userId: second.user.id }
		]);
		const analytics = await admin.caller.meals.getAttendanceAnalytics();
		expect(
			analytics.meals.find((meal) => meal.id === breakfast.id)
		).toMatchObject({
			scans: 2,
			restrictions: { halal: 1, gluten_free: 1, vegan: 1 }
		});
		expect(analytics.meals.find((meal) => meal.id === lunch.id)).toMatchObject({
			scans: 1,
			restrictions: { halal: 1, gluten_free: 1, vegan: 0 }
		});
		expect(analytics.meals.find((meal) => meal.id === empty.id)).toMatchObject({
			scans: 0,
			restrictions: { halal: 0, vegan: 0 }
		});
		expect(analytics.meals.some((meal) => meal.id === nonFood.id)).toBe(false);
		expect(analytics.overall.scans - baseline.overall.scans).toBe(3);
		expect(
			analytics.overall.uniqueAttendees - baseline.overall.uniqueAttendees
		).toBe(2);
		expect(
			analytics.overall.restrictions.halal - baseline.overall.restrictions.halal
		).toBe(1);
		expect(
			analytics.overall.restrictions.gluten_free -
				baseline.overall.restrictions.gluten_free
		).toBe(1);
		expect(
			analytics.overall.restrictions.vegan - baseline.overall.restrictions.vegan
		).toBe(1);
	});
});

describe("meals.getAllMeals", () => {
	let mealFixtures: EventFixtureTracker;

	beforeAll(() => {
		assertE2EDatabaseSafety();
	});

	afterEach(async () => {
		await mealFixtures?.cleanup();
	});

	it("rejects callers without a session", async () => {
		const caller = createUnauthenticatedCaller();

		await expect(caller.meals.getAllMeals()).rejects.toMatchObject({
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

		const meals = await caller.meals.getAllMeals();
		const trackedIds = new Set([earlierMeal.id, laterMeal.id]);
		const trackedMeals = meals.filter((meal) => trackedIds.has(meal.id));

		expect(trackedMeals.map((meal) => meal.id)).toEqual([
			earlierMeal.id,
			laterMeal.id
		]);
	});
});
