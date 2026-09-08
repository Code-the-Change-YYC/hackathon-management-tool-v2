import { eq } from "drizzle-orm";

import { db } from "@/server/db";
import { event } from "@/server/db/event-schema";
import { EventStatus, EventType, Role } from "@/types/types";
import {
	dateFormatter,
	description,
	minute,
	mealInfoPath as path,
	schedule,
	timeFormatter
} from "../../../utils/participant-meal-info-page";
import { expect, test } from "../../fixtures/meal-info.fixture";

test.use({
	authUserOptions: { name: "Participant User", role: Role.PARTICIPANT }
});

// Given I am signed in as a participant
// When I navigate to /participant/meal-info
// Then I see Meal Information, Your Meal Ticket, Dietary Restrictions, and Meal Schedule.
test(
	"participant can access all meal information sections",
	{ tag: "@smoke" },
	async ({ authenticatedPage: page }) => {
		await page.goto(path);
		await expect(page).toHaveURL(path);
		for (const name of [
			"Meal Information",
			"Your Meal Ticket",
			"Dietary Restrictions",
			"Meal Schedule"
		]) {
			await expect(
				page.getByRole("heading", { name, exact: true })
			).toBeVisible();
		}
	}
);

for (const role of [Role.ADMIN, Role.JUDGE]) {
	test.describe(`${role} access`, () => {
		test.use({ authUserOptions: { role } });
		// Given I am signed in as an admin or judge (one test per role)
		// When I navigate to /participant/meal-info
		// Then I am redirected to / and cannot see the meal information page.
		test("redirects non-participants to the home page", async ({
			authenticatedPage: page
		}) => {
			await page.goto(path);
			await expect(page).toHaveURL("/");
			await expect(
				page.getByRole("heading", { name: "Meal Information", exact: true })
			).toHaveCount(0);
		});
	});
}

// Given I am signed out
// When I navigate to /participant/meal-info
// Then I am redirected to / and cannot see the meal information page.
test("redirects signed-out users to the home page", async ({ page }) => {
	await page.goto(path);
	await expect(page).toHaveURL("/");
	await expect(
		page.getByRole("heading", { name: "Meal Information", exact: true })
	).toHaveCount(0);
});

// Given active food meals, a draft meal, and an active non-food event exist
// When I view the meal schedule as a participant
// Then only active food meals appear, ordered by start time
// And each shows its title, start/end times, and meal-ticket check-in instructions.
test(
	"shows active food meals in time order with titles, windows, and descriptions",
	{ tag: "@schedule" },
	async ({ authenticatedPage: page, createMeal }) => {
		const now = Date.now();
		const lunch = await createMeal({
			title: "Lunch",
			status: EventStatus.ACTIVE,
			startTime: new Date(now + 240 * minute),
			endTime: new Date(now + 300 * minute)
		});
		const breakfast = await createMeal({
			title: "Breakfast",
			status: EventStatus.ACTIVE,
			startTime: new Date(now + 120 * minute),
			endTime: new Date(now + 180 * minute)
		});
		for (const meal of [breakfast, lunch]) {
			await db.update(event).set({ description }).where(eq(event.id, meal.id));
		}
		await createMeal({
			title: "Hidden draft",
			status: EventStatus.DRAFT,
			startTime: new Date(now),
			endTime: new Date(now + minute)
		});
		const activity = await createMeal({
			title: "Hidden activity",
			status: EventStatus.ACTIVE,
			startTime: new Date(now),
			endTime: new Date(now + minute)
		});
		await db
			.update(event)
			.set({ type: EventType.ACTIVITY })
			.where(eq(event.id, activity.id));
		await page.goto(path);
		await expect(schedule(page).getByRole("heading", { level: 4 })).toHaveText([
			breakfast.title,
			lunch.title
		]);
		await expect(schedule(page).getByRole("listitem")).toHaveCount(2);
		for (const meal of [breakfast, lunch]) {
			const row = schedule(page)
				.getByRole("listitem")
				.filter({
					has: page.getByRole("heading", { name: meal.title, exact: true })
				});
			await expect(
				row.getByText(
					`${timeFormatter.format(meal.startTime)} - ${timeFormatter.format(meal.endTime)}`,
					{ exact: true }
				)
			).toBeVisible();
			await expect(row.getByText(description, { exact: true })).toBeVisible();
		}
	}
);

// Given active meals exist today and tomorrow
// When I view the meal schedule as a participant
// Then meals appear under their respective calendar dates in chronological order
// And today's date is visually emphasized while tomorrow's is not.
test("groups meals by calendar date and visually marks today", async ({
	authenticatedPage: page,
	createMeal
}) => {
	const today = new Date();
	today.setHours(12, 0, 0, 0);
	const tomorrow = new Date(today);
	tomorrow.setDate(tomorrow.getDate() + 1);
	const meals = [];
	for (const [title, startTime] of [
		["Today lunch", today],
		["Today dinner", new Date(today.getTime() + 6 * 60 * minute)],
		["Tomorrow lunch", tomorrow]
	] as const) {
		meals.push(
			await createMeal({
				title,
				status: EventStatus.ACTIVE,
				startTime,
				endTime: new Date(startTime.getTime() + 60 * minute)
			})
		);
	}
	await page.goto(path);
	await expect(schedule(page).getByRole("heading", { level: 3 })).toHaveText([
		dateFormatter.format(today),
		dateFormatter.format(tomorrow)
	]);
	for (const date of [today, tomorrow]) {
		const heading = schedule(page).getByRole("heading", {
			name: dateFormatter.format(date),
			exact: true
		});
		await expect(heading).toHaveClass(
			date === today ? /font-semibold/ : /font-normal/
		);
		const group = heading.locator("..");
		await expect(group.getByRole("heading", { level: 4 })).toHaveText(
			meals
				.filter((meal) => meal.startTime.toDateString() === date.toDateString())
				.map((meal) => meal.title)
		);
	}
});

for (const timing of [
	{
		condition: "currently in progress",
		start: -15,
		end: 45,
		status: "Ongoing"
	},
	{ condition: "already finished", start: -120, end: -60, status: "Completed" },
	{
		condition: "starting within 60 min",
		start: 30,
		end: 90,
		status: /^In (29|30) min$/
	},
	{
		condition: "starting later than 60 min",
		start: 120,
		end: 180,
		status: "Scheduled"
	}
]) {
	// Given an active meal has the time condition in this example
	// When I view its schedule entry as a participant
	// Then its status is Ongoing, Completed, In <n> min, or Scheduled as appropriate.
	test(`schedule status: ${timing.condition}`, async ({
		authenticatedPage: page,
		createMeal
	}) => {
		const now = Date.now();
		const meal = await createMeal({
			title: timing.condition,
			status: EventStatus.ACTIVE,
			startTime: new Date(now + timing.start * minute),
			endTime: new Date(now + timing.end * minute)
		});
		await page.goto(path);
		const row = schedule(page)
			.getByRole("listitem")
			.filter({
				has: page.getByRole("heading", { name: meal.title, exact: true })
			});
		await expect(row.getByText(timing.status, { exact: true })).toBeVisible();
	});
}

// Given there are no active meals, only a draft meal
// When I view the meal schedule as a participant
// Then I see "No meals have been scheduled yet." and the check-back guidance
// And no meal entries are displayed.
test("shows an empty schedule when there are no active meals", async ({
	authenticatedPage: page,
	createMeal
}) => {
	const now = Date.now();
	await createMeal({
		title: "Not published",
		status: EventStatus.DRAFT,
		startTime: new Date(now),
		endTime: new Date(now + 60 * minute)
	});
	await page.goto(path);
	await expect(
		schedule(page).getByText("No meals have been scheduled yet.", {
			exact: true
		})
	).toBeVisible();
	await expect(
		schedule(page).getByText(
			"Check back soon for meal times and ticket scanning windows.",
			{ exact: true }
		)
	).toBeVisible();
	await expect(schedule(page).getByRole("listitem")).toHaveCount(0);
});
