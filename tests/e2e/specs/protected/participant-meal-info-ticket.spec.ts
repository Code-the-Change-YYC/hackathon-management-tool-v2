import { createTRPCClient, httpLink } from "@trpc/client";
import { and, eq } from "drizzle-orm";

import superjson from "superjson";
import { formatTime } from "@/lib/datetime";
import type { AppRouter } from "@/server/api/root";
import { db } from "@/server/db";
import { user } from "@/server/db/auth-schema";
import { event, eventAttendance, eventTicket } from "@/server/db/event-schema";
import { EventStatus, EventType, Role } from "@/types/types";
import { createTestUser, getTestUserCookies } from "../../../utils/auth";
import {
	mealInfoPath,
	minute
} from "../../../utils/participant-meal-info-page";
import {
	expectStoredTicket,
	qrCode,
	readTicketToken,
	ticketSection
} from "../../../utils/participant-meal-info-ticket";
import { assertE2EDatabaseSafety, assertLocalE2EOrigin } from "../../db";
import { expect, test } from "../../fixtures/meal-info.fixture";

test.use({
	authUserOptions: {
		checkedIn: true,
		name: "Meal Ticket Participant",
		role: Role.PARTICIPANT,
		wantsFood: true
	}
});

for (const timing of [
	{
		name: "ongoing",
		startMinutes: -15,
		expected: (_start: Date, end: Date) =>
			`Being served until ${formatTime(end)}.`
	},
	{
		name: "within 60 minutes",
		startMinutes: 30,
		expected: (_start: Date, end: Date) =>
			`Starts in 30 min and runs until ${formatTime(end)}.`
	},
	{
		name: "later than 60 minutes",
		startMinutes: 120,
		expected: (start: Date, end: Date) =>
			`Runs from ${formatTime(start)} to ${formatTime(end)}.`
	}
]) {
	// Given I am a participant with no check-in for an active food meal
	// And the meal is ongoing, starts within 60 minutes, or starts later (one test each)
	// When I navigate to /participant/meals
	// Then the ticket shows the meal name, my name, the matching status, and end time
	// And the accessible QR code decodes to a valid token stored for me and this meal.
	test(`shows a valid meal ticket when the meal is ${timing.name}`, async ({
		authenticatedPage: page,
		authUser,
		createMeal
	}) => {
		const now = new Date();
		// Freeze only browser Date; the actual backend clock continues to run.
		await page.clock.setFixedTime(now);
		const meal = await createMeal({
			title: `Ticket ${timing.name}`,
			status: EventStatus.ACTIVE,
			startTime: new Date(now.getTime() + timing.startMinutes * minute),
			endTime: new Date(now.getTime() + (timing.startMinutes + 60) * minute)
		});

		await page.goto(mealInfoPath);
		const ticket = ticketSection(page);
		await expect(
			ticket.getByText(`${meal.title} Ticket For`, { exact: true })
		).toBeVisible();
		await expect(
			ticket.getByText(authUser.name, { exact: true })
		).toBeVisible();
		await expect(ticket).toContainText(
			timing.expected(meal.startTime, meal.endTime)
		);
		await expect(ticket).toContainText("Present this QR code");
		const token = await readTicketToken(page);
		expect(token).not.toContain(authUser.id);
		expect(token).not.toContain(authUser.email);
		await expectStoredTicket(token, authUser.id, meal);
	});
}

// Given only an ended meal, a draft future meal, and an active non-food event exist
// When I navigate to /participant/meals as a participant
// Then I see "There is no upcoming meal ticket available." and "No ticket available"
// And no QR code is displayed or event ticket created for me.
test("shows an empty ticket with no QR when no active unended food meal exists", async ({
	authenticatedPage: page,
	authUser,
	createMeal
}) => {
	const now = Date.now();
	await createMeal({
		title: "Ended meal",
		status: EventStatus.ACTIVE,
		startTime: new Date(now - 120 * minute),
		endTime: new Date(now - 60 * minute)
	});
	await createMeal({
		title: "Draft future meal",
		status: EventStatus.DRAFT,
		startTime: new Date(now + 30 * minute),
		endTime: new Date(now + 90 * minute)
	});
	const activity = await createMeal({
		title: "Active non-food event",
		status: EventStatus.ACTIVE,
		startTime: new Date(now - 15 * minute),
		endTime: new Date(now + 60 * minute)
	});
	assertE2EDatabaseSafety();
	await db
		.update(event)
		.set({ type: EventType.ACTIVITY })
		.where(eq(event.id, activity.id));

	await page.goto(mealInfoPath);
	await expect(ticketSection(page)).toContainText(
		"There is no upcoming meal ticket available."
	);
	await expect(
		ticketSection(page).getByText("No ticket available", { exact: true })
	).toBeVisible();
	await expect(qrCode(page)).toHaveCount(0);
	expect(
		await db.query.eventTicket.findMany({
			where: eq(eventTicket.userId, authUser.id)
		})
	).toHaveLength(0);
});

test("shows an opt-out message instead of a meal QR while keeping meal details", async ({
	authenticatedPage: page,
	authUser,
	createMeal
}) => {
	const now = Date.now();
	const meal = await createMeal({
		title: "Opt-out lunch",
		status: EventStatus.ACTIVE,
		startTime: new Date(now - 15 * minute),
		endTime: new Date(now + 45 * minute)
	});
	assertE2EDatabaseSafety();
	await db
		.update(user)
		.set({ wantsFood: false })
		.where(eq(user.id, authUser.id));

	await page.goto(mealInfoPath);
	const ticket = ticketSection(page);
	await expect(ticket).toContainText(`${meal.title} Ticket For`);
	await expect(ticket).toContainText("Being served until");
	await expect(ticket).toContainText(
		"You opted out of meals during onboarding. Please see an event staff member if you change your mind."
	);
	await expect(qrCode(page)).toHaveCount(0);
	expect(
		await db.query.eventTicket.findMany({
			where: and(
				eq(eventTicket.userId, authUser.id),
				eq(eventTicket.eventId, meal.id)
			)
		})
	).toHaveLength(0);
});

test("shows an onboarding message instead of a QR for an unanswered meal preference", async ({
	authenticatedPage: page,
	authUser,
	createMeal
}) => {
	const now = Date.now();
	const meal = await createMeal({
		title: "Preferences lunch",
		status: EventStatus.ACTIVE,
		startTime: new Date(now - 15 * minute),
		endTime: new Date(now + 45 * minute)
	});
	assertE2EDatabaseSafety();
	await db
		.update(user)
		.set({ wantsFood: null })
		.where(eq(user.id, authUser.id));

	await page.goto(mealInfoPath);
	const ticket = ticketSection(page);
	await expect(ticket).toContainText(`${meal.title} Ticket For`);
	await expect(ticket).toContainText(
		"Complete your meal preferences during onboarding to receive a meal ticket."
	);
	await expect(qrCode(page)).toHaveCount(0);
	expect(
		await db.query.eventTicket.findMany({
			where: and(
				eq(eventTicket.userId, authUser.id),
				eq(eventTicket.eventId, meal.id)
			)
		})
	).toHaveLength(0);
});

// Given I am a participant already checked in to the active meal
// When I navigate to /participant/meals
// Then I see "Already checked in" and my check-in time
// And neither a QR code nor instructions to present one are displayed.
test("shows an existing check-in timestamp instead of a QR", async ({
	authenticatedPage: page,
	authUser,
	createMeal
}) => {
	const now = Date.now();
	const meal = await createMeal({
		title: "Already collected meal",
		status: EventStatus.ACTIVE,
		startTime: new Date(now - 30 * minute),
		endTime: new Date(now + 60 * minute)
	});
	const checkedInAt = new Date(now - 10 * minute);
	assertE2EDatabaseSafety();
	await db.insert(eventAttendance).values({
		userId: authUser.id,
		eventId: meal.id,
		createdAt: checkedInAt
	});

	await page.goto(mealInfoPath);
	await expect(
		ticketSection(page).getByText("Already checked in", { exact: true })
	).toBeVisible();
	await expect(ticketSection(page)).toContainText(
		`You checked in at ${formatTime(checkedInAt)}.`
	);
	await expect(qrCode(page)).toHaveCount(0);
	await expect(ticketSection(page)).not.toContainText("Present this QR code");
});

// Given I am a participant with an active meal ticket and no check-in
// When I capture the rendered QR code, then open Meals in a second tab and reload
// Then every view shows the same QR code
// And an admin can redeem the first tab's code exactly once through the real backend
// And reloading afterward shows my check-in instead of a QR code.
test("a second tab shows the same QR, and the first tab's code redeems once", async ({
	authenticatedPage: page,
	authUser,
	context,
	createMeal,
	baseURL
}) => {
	expect(baseURL).toBeTruthy();
	const origin = baseURL as string;
	assertLocalE2EOrigin(origin);
	const now = Date.now();
	const meal = await createMeal({
		title: "Two-tab ticket meal",
		status: EventStatus.ACTIVE,
		startTime: new Date(now - 15 * minute),
		endTime: new Date(now + 60 * minute)
	});
	await page.goto(mealInfoPath);
	const token = await readTicketToken(page);
	await expectStoredTicket(token, authUser.id, meal);
	const secondTab = await context.newPage();
	await secondTab.goto(mealInfoPath);
	expect(await readTicketToken(secondTab)).toBe(token);
	await secondTab.reload();
	expect(await readTicketToken(secondTab)).toBe(token);
	await secondTab.close();
	await expectStoredTicket(token, authUser.id, meal);

	const admin = await createTestUser({ role: Role.ADMIN });
	try {
		const cookies = await getTestUserCookies(
			admin.user.id,
			new URL(origin).hostname
		);
		// This creates a tRPC client that makes real HTTP requests as the temporary
		// admin. The procedure calls are typed, but the client still needs to know
		// where this test server exposes its tRPC API.
		// TODO: Investigate a clearer, reusable setup for authenticated tRPC calls
		// made directly from E2E tests.
		const client = createTRPCClient<AppRouter>({
			links: [
				httpLink({
					url: `${origin}/api/trpc`,
					transformer: superjson,
					headers: {
						cookie: cookies
							.map(({ name, value }) => `${name}=${value}`)
							.join("; ")
					}
				})
			]
		});
		const redeemed = await client.events.redeemEventTicket.mutate({
			eventId: meal.id,
			token
		});
		expect(redeemed).toMatchObject({
			status: "checked_in",
			participant: {
				id: authUser.id,
				name: authUser.name,
				email: authUser.email
			},
			event: { id: meal.id, title: meal.title }
		});
		const repeatScan = await client.events.redeemEventTicket.mutate({
			eventId: meal.id,
			token
		});
		expect(repeatScan).toMatchObject({
			status: "already_checked_in",
			attendanceId: redeemed.attendanceId,
			checkedInAt: redeemed.checkedInAt,
			participant: { id: authUser.id, name: authUser.name }
		});
		const attendance = await db.query.eventAttendance.findMany({
			where: and(
				eq(eventAttendance.userId, authUser.id),
				eq(eventAttendance.eventId, meal.id)
			)
		});
		expect(attendance).toHaveLength(1);
		expect(attendance[0]?.id).toBe(redeemed.attendanceId);

		await page.reload();
		await expect(
			ticketSection(page).getByText("Already checked in", { exact: true })
		).toBeVisible();
		await expect(ticketSection(page)).toContainText(
			`You checked in at ${formatTime(redeemed.checkedInAt)}.`
		);
		await expect(qrCode(page)).toHaveCount(0);
	} finally {
		await admin.cleanup();
	}
});
