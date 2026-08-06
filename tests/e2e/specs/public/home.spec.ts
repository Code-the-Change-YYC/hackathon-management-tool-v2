import { expect, test } from "playwright/test";

test.describe("public home page", () => {
	test("loads without authentication", async ({ page }) => {
		await page.goto("/");

		await expect(
			page.getByRole("heading", { name: "Hack the Change" })
		).toBeVisible();
	});
});
