import { eq } from "drizzle-orm";
import { db } from "@/server/db";
import { event, eventAttendance } from "@/server/db/event-schema";
import { EventStatus, EventType, Role } from "@/types/types";
import { createTestUser } from "../../../utils/auth";
import { expect, test } from "../../fixtures/meal-info.fixture";

const path = "/admin/meals";
const minute = 60_000;

test.describe("admin meals", () => {
	test.use({
		authUserOptions: { completedRegistration: true, role: Role.ADMIN }
	});

	// Given I am signed in as an admin
	// When I visit /admin/meals
	// Then I see the scanner banner, meal check-ins, and analytics.
	test(
		"shows the admin meals sections",
		{ tag: "@smoke" },
		async ({ authenticatedPage: page }) => {
			await page.goto(path);
			await expect(
				page.getByRole("heading", { name: "Meals", exact: true })
			).toBeVisible();
			await expect(
				page.getByRole("heading", { name: "Scan meal tickets" })
			).toBeVisible();
			await expect(
				page.getByRole("heading", { name: "Meal Check-ins" })
			).toBeVisible();
			await expect(
				page.getByRole("heading", { name: "Meal Analytics" })
			).toBeVisible();
			await expect(
				page.getByRole("heading", { name: "Dietary Restrictions" })
			).toBeVisible();
		}
	);

	// Given active, draft, ended, and non-food events exist
	// When I view the scanner banner
	// Then it selects the earliest active, unended food event.
	test("selects the next active unended food event", async ({
		authenticatedPage: page,
		createMeal
	}) => {
		const now = Date.now();
		const later = await createMeal({
			title: "Later lunch",
			status: EventStatus.ACTIVE,
			startTime: new Date(now + 120 * minute),
			endTime: new Date(now + 180 * minute)
		});
		const next = await createMeal({
			title: "Next breakfast",
			status: EventStatus.ACTIVE,
			startTime: new Date(now + 30 * minute),
			endTime: new Date(now + 90 * minute)
		});
		await createMeal({
			title: "Ended meal",
			status: EventStatus.ACTIVE,
			startTime: new Date(now - 120 * minute),
			endTime: new Date(now - 60 * minute)
		});
		await createMeal({
			title: "Draft meal",
			status: EventStatus.DRAFT,
			startTime: new Date(now + 10 * minute),
			endTime: new Date(now + 60 * minute)
		});
		await createMeal({
			title: "Non-food event",
			status: EventStatus.ACTIVE,
			type: EventType.ACTIVITY,
			startTime: new Date(now + 5 * minute),
			endTime: new Date(now + 60 * minute)
		});

		await page.goto(path);
		await expect(
			page.getByText(`Open scanner to scan meal tickets for ${next.title}`)
		).toBeVisible();
		await expect(
			page.getByRole("heading", { name: later.title })
		).toBeVisible();
		await page.getByRole("button", { name: "Open scanner" }).click();
		await expect(page.getByRole("dialog")).toContainText(`Meal: ${next.title}`);
	});

	// Given there is no active unended food event
	// When I visit /admin/meals
	// Then the banner explains why the scanner cannot open.
	test("does not offer a scanner without an eligible meal", async ({
		authenticatedPage: page,
		createMeal
	}) => {
		const now = Date.now();
		const draft = await createMeal({
			title: "Draft only",
			status: EventStatus.DRAFT,
			startTime: new Date(now),
			endTime: new Date(now + 60 * minute)
		});
		await page.goto(path);
		await expect(
			page.getByText(
				"No active meals are available to scan. Create and activate a food event first."
			)
		).toBeVisible();
		await expect(
			page.getByRole("button", { name: "Check for meal" })
		).toBeVisible();
		await Promise.all([
			page.waitForResponse((response) =>
				response.url().includes("meals.getNextMeal")
			),
			page.getByRole("button", { name: "Check for meal" }).click()
		]);
		await expect(page.getByRole("dialog")).toHaveCount(0);
		await db
			.update(event)
			.set({ status: EventStatus.ACTIVE })
			.where(eq(event.id, draft.id));
		await page
			.getByRole("button", { name: /^(Check for meal|Open scanner)$/ })
			.click();
		await expect(page.getByRole("dialog")).toContainText(
			`Meal: ${draft.title}`
		);
	});

	// Given eligibility changes after the admin opens the meals page
	// When the admin opens the scanner
	// Then the current meal is used without reloading the page.
	test("refreshes meal eligibility before opening the scanner", async ({
		authenticatedPage: page,
		createMeal
	}) => {
		const now = Date.now();
		const first = await createMeal({
			title: "Finishing breakfast",
			status: EventStatus.ACTIVE,
			startTime: new Date(now - 10 * minute),
			endTime: new Date(now + 60 * minute)
		});
		const second = await createMeal({
			title: "Next lunch",
			status: EventStatus.ACTIVE,
			startTime: new Date(now - 5 * minute),
			endTime: new Date(now + 120 * minute)
		});
		await page.goto(path);
		await expect(
			page.getByText(`Open scanner to scan meal tickets for ${first.title}`)
		).toBeVisible();
		await db
			.update(event)
			.set({ endTime: new Date(now - minute) })
			.where(eq(event.id, first.id));
		await page.getByRole("button", { name: "Open scanner" }).click();
		const dialog = page.getByRole("dialog");
		await expect(dialog).toContainText(`Meal: ${second.title}`);
		await db
			.update(event)
			.set({ endTime: new Date(now - minute) })
			.where(eq(event.id, second.id));
		await expect(dialog).toContainText(`Meal: ${second.title}`);
		await dialog.getByRole("button", { name: "Close" }).click();
		await page
			.getByRole("button", { name: /Open scanner|Check for meal/ })
			.click();
		await expect(page.getByRole("dialog")).toHaveCount(0);
		await expect(
			page.getByText(
				"No active meals are available to scan. Create and activate a food event first."
			)
		).toBeVisible();
	});

	// Given an active unended food event exists
	// When I open and close the scanner
	// Then I remain on the admin meals page.
	test("opens and closes the scanner without navigating", async ({
		authenticatedPage: page,
		createMeal
	}) => {
		const now = Date.now();
		await createMeal({
			title: "Scan lunch",
			status: EventStatus.ACTIVE,
			startTime: new Date(now - 5 * minute),
			endTime: new Date(now + 60 * minute)
		});
		await page.goto(path);
		await page.getByRole("button", { name: "Open scanner" }).click();
		const dialog = page.getByRole("dialog");
		await expect(
			dialog.getByRole("heading", { name: "Scan meal tickets" })
		).toBeVisible();
		await dialog.getByRole("button", { name: "Close" }).click();
		await expect(dialog).toHaveCount(0);
		await expect(page).toHaveURL(path);
	});

	// Given many participants checked in at different times
	// When I expand the meal on a narrow screen and search its check-ins
	// Then the newest check-in is first and the search filters names.
	test(
		"lists and searches a meal's check-ins",
		{ tag: "@responsive" },
		async ({ authenticatedPage: page, createMeal }) => {
			const now = Date.now();
			const meal = await createMeal({
				title: "Crowded lunch",
				status: EventStatus.ACTIVE,
				startTime: new Date(now - 5 * minute),
				endTime: new Date(now + 60 * minute)
			});
			const participants: Awaited<ReturnType<typeof createTestUser>>[] = [];
			try {
				for (let index = 0; index < 12; index++) {
					participants.push(
						await createTestUser({ name: `Scan Tester ${index}` })
					);
				}
				await db.insert(eventAttendance).values(
					participants.map(({ user }, index) => ({
						eventId: meal.id,
						userId: user.id,
						createdAt: new Date(now - (12 - index) * minute)
					}))
				);
				await page.setViewportSize({ width: 390, height: 700 });
				await page.goto(path);
				const trigger = page.getByRole("button", { name: /Crowded lunch/ });
				await expect(trigger).toContainText("12 checked in");
				await trigger.click();
				const search = page.getByRole("textbox", {
					name: "Search check-ins by name"
				});
				const rows = page
					.getByRole("region", { name: /Crowded lunch/ })
					.getByRole("listitem");
				await expect(rows).toHaveCount(12);
				await expect(rows.first()).toContainText("Scan Tester 11");
				await search.fill("  tester 2 ");
				await expect(rows).toHaveCount(1);
				await expect(rows.first()).toContainText("Scan Tester 2");
				await search.fill("nobody");
				await expect(page.getByText("No matching check-ins.")).toBeVisible();
				await search.fill("");
				await expect(rows).toHaveCount(12);
			} finally {
				for (const participant of participants) await participant.cleanup();
			}
		}
	);
});

test.describe("participant access", () => {
	test.use({
		authUserOptions: { completedRegistration: true, role: Role.PARTICIPANT }
	});

	// Given I am signed in as a participant
	// When I visit /admin/meals
	// Then I am redirected away from the admin page.
	test("denies participants access to admin meals", async ({
		authenticatedPage: page
	}) => {
		await page.goto(path);
		await expect(page).toHaveURL("/");
		await expect(
			page.getByRole("heading", { name: "Meal Analytics" })
		).toHaveCount(0);
	});
});

test.describe("judge access", () => {
	test.use({
		authUserOptions: { completedRegistration: true, role: Role.JUDGE }
	});

	// Given I am signed in as a judge
	// When I visit /admin/meals
	// Then I am redirected away from the admin page.
	test("denies judges access to admin meals", async ({
		authenticatedPage: page
	}) => {
		await page.goto(path);
		await expect(page).toHaveURL("/");
		await expect(
			page.getByRole("heading", { name: "Meal Analytics" })
		).toHaveCount(0);
	});
});

// Given I am signed out
// When I visit /admin/meals
// Then I am redirected to the home page.
test("denies signed-out visitors access to admin meals", async ({ page }) => {
	await page.goto(path);
	await expect(page).toHaveURL("/");
});
