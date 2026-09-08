import { createTRPCClient, httpLink } from "@trpc/client";
import { and, eq } from "drizzle-orm";

import superjson from "superjson";
import type { AppRouter } from "@/server/api/root";
import { db } from "@/server/db";
import { event, eventAttendance, eventTicket } from "@/server/db/event-schema";
import { EventStatus, EventType, Role } from "@/types/types";
import { createTestUser, getTestUserCookies } from "../../../utils/auth";
import { minute } from "../../../utils/participant-meal-info-page";
import {
	browserTime,
	expectStoredTicket,
	qrCode,
	readTicketToken,
	ticketSection
} from "../../../utils/participant-meal-info-ticket";
import { assertE2EDatabaseSafety, assertLocalE2EOrigin } from "../../db";
import { expect, test } from "../../fixtures/meal-info.fixture";

test.use({
	authUserOptions: { name: "Meal Ticket Participant", role: Role.PARTICIPANT }
});

for (const timing of [
	{ name: "ongoing", startMinutes: -15, status: "ongoing" },
	{ name: "within 60 minutes", startMinutes: 30, status: "in 30 min" },
	{ name: "later than 60 minutes", startMinutes: 120, status: "scheduled" }
]) {
	// Given I am a participant with no check-in for an active food meal
	// And the meal is ongoing, starts within 60 minutes, or starts later (one test each)
	// When I navigate to /participant/meal-info
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

		await page.goto("/participant/meal-info");
		const ticket = ticketSection(page);
		await expect(
			ticket.getByText(`${meal.title} Ticket For`, { exact: true })
		).toBeVisible();
		await expect(
			ticket.getByText(authUser.name, { exact: true })
		).toBeVisible();
		await expect(ticket).toContainText(
			`${meal.title} is ${timing.status} until ${await browserTime(page, meal.endTime)}.`
		);
		await expect(ticket).toContainText("Present this QR code");
		const token = await readTicketToken(page);
		expect(token).not.toContain(authUser.id);
		expect(token).not.toContain(authUser.email);
		await expectStoredTicket(token, authUser.id, meal);
	});
}

// Given only an ended meal, a draft future meal, and an active non-food event exist
// When I navigate to /participant/meal-info as a participant
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

	await page.goto("/participant/meal-info");
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

// Given I am a participant already checked in to the active meal
// When I navigate to /participant/meal-info
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

	await page.goto("/participant/meal-info");
	await expect(
		ticketSection(page).getByText("Already checked in", { exact: true })
	).toBeVisible();
	await expect(ticketSection(page)).toContainText(
		`You checked in at ${await browserTime(page, checkedInAt)}.`
	);
	await expect(qrCode(page)).toHaveCount(0);
	await expect(ticketSection(page)).not.toContainText("Present this QR code");
});

// Given I am a participant with an active meal ticket and no check-in
// When I capture the rendered QR code and reload the page
// Then the new QR contains a different token and the old token cannot be redeemed
// And an admin can redeem the current token exactly once through the real backend
// And reloading afterward shows my check-in instead of a QR code.
test("reload rotates the QR: the old token is rejected and the current token redeems once", async ({
	authenticatedPage: page,
	authUser,
	createMeal,
	baseURL
}) => {
	expect(baseURL).toBeTruthy();
	const origin = baseURL as string;
	assertLocalE2EOrigin(origin);
	const now = Date.now();
	const meal = await createMeal({
		title: "Rotating ticket meal",
		status: EventStatus.ACTIVE,
		startTime: new Date(now - 15 * minute),
		endTime: new Date(now + 60 * minute)
	});
	await page.goto("/participant/meal-info");
	const oldToken = await readTicketToken(page);
	await expectStoredTicket(oldToken, authUser.id, meal);
	await page.reload();
	const currentToken = await readTicketToken(page);
	expect(currentToken).not.toBe(oldToken);
	await expectStoredTicket(currentToken, authUser.id, meal);

	const admin = await createTestUser({ role: Role.ADMIN });
	try {
		const cookies = await getTestUserCookies(
			admin.user.id,
			new URL(origin).hostname
		);
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
		await expect(
			client.events.redeemEventTicket.mutate({
				eventId: meal.id,
				token: oldToken
			})
		).rejects.toMatchObject({
			data: { code: "NOT_FOUND" },
			message: "This event ticket is invalid or has been replaced."
		});
		const attendanceWhere = and(
			eq(eventAttendance.userId, authUser.id),
			eq(eventAttendance.eventId, meal.id)
		);
		expect(
			await db.query.eventAttendance.findMany({ where: attendanceWhere })
		).toHaveLength(0);

		const redeemed = await client.events.redeemEventTicket.mutate({
			eventId: meal.id,
			token: currentToken
		});
		expect(redeemed).toMatchObject({
			participant: {
				id: authUser.id,
				name: authUser.name,
				email: authUser.email
			},
			event: { id: meal.id, title: meal.title }
		});
		await expect(
			client.events.redeemEventTicket.mutate({
				eventId: meal.id,
				token: currentToken
			})
		).rejects.toMatchObject({ data: { code: "CONFLICT" } });
		const attendance = await db.query.eventAttendance.findMany({
			where: attendanceWhere
		});
		expect(attendance).toHaveLength(1);
		expect(attendance[0]?.id).toBe(redeemed.attendanceId);

		await page.reload();
		await expect(
			ticketSection(page).getByText("Already checked in", { exact: true })
		).toBeVisible();
		await expect(ticketSection(page)).toContainText(
			`You checked in at ${await browserTime(page, redeemed.checkedInAt)}.`
		);
		await expect(qrCode(page)).toHaveCount(0);
	} finally {
		await admin.cleanup();
	}
});
