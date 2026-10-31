import { eq } from "drizzle-orm";
import { db } from "@/server/db";
import { event } from "@/server/db/event-schema";
import { EventStatus, EventType, Role } from "@/types/types";
import { expect, test } from "../../fixtures/settings.fixture";

test.use({
	authUserOptions: { role: Role.PARTICIPANT, completedRegistration: true }
});

test("PART01: open schedule and dashboard receive edits and draft removal without reload", async ({
	authenticatedPage: page,
	context,
	createMeal
}) => {
	test.setTimeout(110_000);
	const now = Date.now();
	const fixture = await createMeal({
		title: "Live event",
		location: "Original room",
		type: EventType.CEREMONY,
		status: EventStatus.ACTIVE,
		startTime: new Date(now - 60_000),
		endTime: new Date(now + 3_600_000)
	});
	await page.goto("/participant/schedule");
	const dashboard = await context.newPage();
	try {
		await dashboard.goto("/participant");
		await expect(page.getByText(fixture.title, { exact: true })).toBeVisible();
		await expect(
			dashboard.getByText(fixture.title, { exact: true })
		).toBeVisible();
		for (const tab of [page, dashboard])
			await tab.evaluate(() => {
				document.documentElement.dataset.liveTestMarker = "same-document";
			});
		const title = `${fixture.title} updated`;
		const navigationUrl = "https://example.com/live-event";
		await db
			.update(event)
			.set({ title, location: "Updated room", navigationUrl })
			.where(eq(event.id, fixture.id));
		await expect
			.poll(
				async () =>
					(await page.locator("body").innerText()).includes(title) &&
					(await dashboard.locator("body").innerText()).includes(title),
				{ timeout: 45_000 }
			)
			.toBe(true);
		await expect(
			page.getByText("Updated room", { exact: true }).first()
		).toBeVisible();
		await expect(
			page.locator(`a[href="${navigationUrl}"]`).first()
		).toBeVisible();
		await db
			.update(event)
			.set({ status: EventStatus.DRAFT })
			.where(eq(event.id, fixture.id));
		await expect
			.poll(
				async () =>
					!(await page.locator("body").innerText()).includes(title) &&
					!(await dashboard.locator("body").innerText()).includes(title),
				{ timeout: 45_000 }
			)
			.toBe(true);
		for (const tab of [page, dashboard])
			expect(
				await tab.evaluate(
					() => document.documentElement.dataset.liveTestMarker
				)
			).toBe("same-document");
	} finally {
		await dashboard.close();
	}
});

test("PART04: Resources navigation and direct access unlock together at the start boundary", async ({
	authenticatedPage: page,
	setSettings
}) => {
	const start = Date.now() + 8_000;
	await setSettings({ startDate: new Date(start) });
	await page.goto("/participant");
	await expect(
		page.getByRole("link", { name: "Resources", exact: true })
	).toHaveCount(0);
	await page.goto("/participant/resources");
	await expect(page).toHaveURL(/\/participant$/);
	await expect.poll(() => Date.now() >= start, { timeout: 10_000 }).toBe(true);
	await page.goto("/participant");
	await page.getByRole("link", { name: "Resources", exact: true }).click();
	await expect(page).toHaveURL(/\/participant\/resources$/);
	await expect(
		page.getByRole("heading", { name: "Resources and Help" })
	).toBeVisible();
});
