import { expect, test } from "playwright/test";

test.describe("public home page", () => {
	test("loads without authentication", async ({ page }) => {
		await page.goto("/");

		await expect(
			page.getByRole("heading", { name: "Hack the Change" })
		).toBeVisible();
	});

	test("renders Contentful-backed judges without broken placeholder assets", async ({
		page
	}) => {
		await page.goto("/");

		await expect(page.getByRole("heading", { name: "Judges" })).toBeVisible();
		await expect(page.getByTestId("judge-card").first()).toBeVisible();
		await expect(
			page.locator('img[alt$="profile photo"]').first()
		).toBeVisible();
		await expect(page.locator('img[src*="example.svg"]')).toHaveCount(0);
	});

	for (const viewport of [
		{ height: 900, name: "desktop", width: 1280 },
		{ height: 852, name: "mobile", width: 393 }
	]) {
		test(`keeps the Judges section usable at ${viewport.name} width`, async ({
			page
		}) => {
			await page.setViewportSize({
				height: viewport.height,
				width: viewport.width
			});
			await page.goto("/");

			await expect(page.getByRole("heading", { name: "Judges" })).toBeVisible();
			await expect
				.poll(() =>
					page.evaluate(
						() => document.documentElement.scrollWidth <= window.innerWidth
					)
				)
				.toBe(true);
		});
	}
});
