import { Role } from "@/types/types";
import { expect, test } from "../../fixtures/auth.fixture";

for (const width of [375, 414]) {
	test.describe(`HMTV2-54 portal layouts at ${width}px`, () => {
		test.use({ viewport: { width, height: 896 } });
		for (const [role, routes] of [
			[
				Role.PARTICIPANT,
				[
					"/participant",
					"/participant/team",
					"/participant/schedule",
					"/participant/meals",
					"/participant/profile",
					"/participant/judging"
				]
			],
			[Role.JUDGE, ["/judge", "/judge/schedule", "/judge/rubric"]],
			[
				Role.ADMIN,
				[
					"/admin/schedule",
					"/admin/users",
					"/admin/teams",
					"/admin/meals",
					"/admin/judging"
				]
			]
		] as const) {
			test.describe(role, () => {
				test.use({ authUserOptions: { role, completedRegistration: true } });
				test("all portal sections fit the viewport", async ({
					authenticatedPage: page
				}) => {
					test.setTimeout(60_000);
					for (const path of routes) {
						await page.goto(path);
						await expect(page).toHaveURL(new RegExp(`${path}$`));
						await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
						expect(
							await page.evaluate(() => document.documentElement.scrollWidth),
							path
						).toBeLessThanOrEqual(width);
					}
				});
			});
		}
		test("public entry and signup fit the viewport", async ({ page }) => {
			for (const path of ["/", "/signup"]) {
				await page.goto(path);
				await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
				expect(
					await page.evaluate(() => document.documentElement.scrollWidth),
					path
				).toBeLessThanOrEqual(width);
			}
		});
	});
}
