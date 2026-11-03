import { EventStatus, EventType, Role } from "@/types/types";
import { expect, test } from "../../fixtures/settings.fixture";

test.use({
	authUserOptions: { name: "Dashboard Participant", role: Role.PARTICIPANT }
});

const minutesFromNow = (minutes: number) =>
	new Date(Date.now() + minutes * 60_000);

test("greets the participant by first name", async ({
	authenticatedPage: page
}) => {
	await page.goto("/participant");

	await expect(
		page.getByRole("heading", { name: "Welcome, Dashboard!" })
	).toBeVisible();
});

test("reflects the saved hackathon settings", async ({
	authenticatedPage: page,
	setSettings
}) => {
	await setSettings({
		startDate: minutesFromNow(-2 * 24 * 60),
		submissionDeadline: minutesFromNow(-60)
	});
	await page.goto("/participant");

	await expect(
		page.getByText("Your hackathon at a glance. Happy hacking!")
	).toBeVisible();
	await expect(
		page.getByRole("heading", { name: "Submissions closed" })
	).toBeVisible();
});

test("counts down to submissions opening before the start", async ({
	authenticatedPage: page,
	setSettings
}) => {
	await setSettings({
		startDate: minutesFromNow(3 * 24 * 60 + 5),
		submissionDeadline: minutesFromNow(4 * 24 * 60)
	});
	await page.goto("/participant");

	await expect(page.getByText(/^Get ready to hack, starting on/)).toBeVisible();
	await expect(
		page.getByRole("heading", { name: "Time until submission opens" })
	).toBeVisible();
	await expect(page.getByRole("timer")).toHaveAccessibleName(
		/^3 days, 0 hours, [45] minutes, \d+ seconds remaining$/
	);
});

test("shows the ongoing event and hides drafts", async ({
	authenticatedPage: page,
	createMeal
}) => {
	await createMeal({
		title: "Opening Ceremony",
		description: "Kickoff in the main hall",
		location: "Main Hall",
		type: EventType.CEREMONY,
		status: EventStatus.ACTIVE,
		startTime: minutesFromNow(-1),
		endTime: minutesFromNow(30)
	});
	await createMeal({
		title: "Hidden Draft",
		status: EventStatus.DRAFT,
		startTime: minutesFromNow(5),
		endTime: minutesFromNow(10)
	});
	await page.goto("/participant");

	const banner = page
		.getByRole("heading", { name: /Opening Ceremony ongoing now!$/ })
		.locator("xpath=../..");
	await expect(banner).toContainText("Kickoff in the main hall");
	await expect(banner).toContainText("Main Hall");
	const item = page
		.getByRole("listitem")
		.filter({ hasText: "Opening Ceremony" });
	await expect(item).toContainText("Kickoff in the main hall");
	await expect(item).toContainText("Main Hall");
	await expect(page.getByText(/Hidden Draft/)).toHaveCount(0);
});

test("links to the full schedule and judging info", async ({
	authenticatedPage: page
}) => {
	await page.goto("/participant");
	await page.getByRole("link", { name: "View full schedule" }).click();
	await expect(page).toHaveURL(/\/participant\/schedule$/);

	await page.goto("/participant");
	await page.getByRole("link", { name: "View judging info" }).click();
	await expect(page).toHaveURL(/\/participant\/judging$/);
});

test.describe("not checked in", () => {
	test.use({
		authUserOptions: { checkedIn: false, role: Role.PARTICIPANT }
	});

	// Given I am a participant an admin has not checked in yet
	// When the hackathon day has not come yet
	// Then I see no check-in banner
	// When it is the hackathon's first day
	// Then the banner shows on my dashboard and replaces my meal ticket
	// When the first day has passed
	// Then the banner only stays on my meals page.
	test("asks for check-in on the hackathon's first day", async ({
		authenticatedPage: page,
		setSettings
	}) => {
		const banner = page.getByRole("heading", {
			name: "Check in to the hackathon"
		});
		await setSettings({ startDate: minutesFromNow(7 * 24 * 60) });
		await page.goto("/participant");
		await expect(
			page.getByRole("heading", { name: "Welcome, Test!" })
		).toBeVisible();
		await expect(banner).toHaveCount(0);

		await setSettings({ startDate: minutesFromNow(-1) });
		await page.goto("/participant");
		await expect(banner).toBeVisible();
		await page.goto("/participant/meals");
		await expect(banner).toBeVisible();
		await expect(
			page.getByRole("region", { name: "Meal ticket", exact: true })
		).toHaveCount(0);

		await setSettings({ startDate: minutesFromNow(-2 * 24 * 60) });
		await page.goto("/participant");
		await expect(
			page.getByRole("heading", { name: "Welcome, Test!" })
		).toBeVisible();
		await expect(banner).toHaveCount(0);
		await page.goto("/participant/meals");
		await expect(banner).toBeVisible();
	});
});
