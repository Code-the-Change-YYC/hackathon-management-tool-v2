import { Role } from "@/types/types";
import { expect, test } from "../../fixtures/auth.fixture";

test.describe("HMTV2-63 judge portal", () => {
	test.use({
		authUserOptions: { role: Role.JUDGE, completedRegistration: true }
	});
	test("navigation stays within judge workflows without signup or admin controls", async ({
		authenticatedPage: page
	}) => {
		await page.goto("/judge");
		for (const [label, path] of [
			["Schedule", "/judge/schedule"],
			["Rubric", "/judge/rubric"],
			["Dashboard", "/judge"]
		]) {
			await page.getByRole("link", { name: label, exact: true }).click();
			await expect(page).toHaveURL(new RegExp(`${path}$`));
			await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
			await expect(
				page.locator(
					'a[href^="/admin"], a[href^="/participant"], a[href="/signup"]'
				)
			).toHaveCount(0);
		}
	});
});

test.describe("HMTV2-63 participant boundary", () => {
	test.use({
		authUserOptions: { role: Role.PARTICIPANT, completedRegistration: true }
	});
	test("participant accounts cannot open judge portal routes", async ({
		authenticatedPage: page
	}) => {
		for (const path of ["/judge", "/judge/schedule", "/judge/rubric"]) {
			await page.goto(path);
			await expect(page).toHaveURL(/\/$/);
		}
	});
});
