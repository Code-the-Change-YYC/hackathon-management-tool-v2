import { db } from "@/server/db";
import { eventAttendance } from "@/server/db/event-schema";
import { EventStatus, Role } from "@/types/types";
import { expect, test } from "../../fixtures/event.fixture";

test.use({
	authUserOptions: { name: "Ticket Participant", role: Role.PARTICIPANT }
});

const minutesFromNow = (minutes: number) =>
	new Date(Date.now() + minutes * 60_000);

test("shows an empty ticket and no restrictions by default", async ({
	authenticatedPage: page
}) => {
	await page.goto("/participant/meals");

	await expect(page.getByText("No ticket available")).toBeVisible();
	await expect(
		page.getByText("There is no upcoming meal ticket available.")
	).toBeVisible();
	await expect(page.getByText("None registered")).toBeVisible();
});

test("shows a QR code for an ongoing meal", async ({
	authenticatedPage: page,
	createMeal
}) => {
	await createMeal({
		startTime: minutesFromNow(-30),
		endTime: minutesFromNow(30),
		status: EventStatus.ACTIVE,
		title: "Lunch"
	});

	await page.goto("/participant/meals");
	const ticket = page.locator("section", { hasText: "Your Meal Ticket" });

	await expect(ticket.getByText(/Lunch is ongoing until/)).toBeVisible();
	await expect(ticket.locator("svg").first()).toBeVisible();
	await expect(ticket.getByText("No ticket available")).toHaveCount(0);
});

test("draft meals do not get a ticket", async ({
	authenticatedPage: page,
	createMeal
}) => {
	await createMeal({
		startTime: minutesFromNow(-30),
		endTime: minutesFromNow(30),
		status: EventStatus.DRAFT,
		title: "Hidden lunch"
	});

	await page.goto("/participant/meals");
	await expect(page.getByText("No ticket available")).toBeVisible();
});

test("shows the check-in state after scanning", async ({
	authenticatedPage: page,
	authUser,
	createMeal
}) => {
	const meal = await createMeal({
		startTime: minutesFromNow(-30),
		endTime: minutesFromNow(30),
		status: EventStatus.ACTIVE,
		title: "Dinner"
	});
	await db
		.insert(eventAttendance)
		.values({ eventId: meal.id, userId: authUser.id });

	await page.goto("/participant/meals");

	await expect(page.getByText("Already checked in")).toBeVisible();
	await expect(page.getByText(/You checked in at/)).toBeVisible();
});
