import { Role } from "@/types/types";
import { expect, test } from "../../fixtures/auth.fixture";

test.use({
	authUserOptions: { name: "Shell Participant", role: Role.PARTICIPANT }
});

test("user menu links to the profile page", async ({
	authenticatedPage: page
}) => {
	await page.goto("/participant");
	await page.getByRole("button", { name: "Shell" }).click();
	await page.getByRole("menuitem", { name: "Profile" }).click();

	await expect(page).toHaveURL(/\/participant\/profile$/);
});

test("logging out ends the session", async ({ authenticatedPage: page }) => {
	await page.goto("/participant");
	await page.getByRole("button", { name: "Shell" }).click();
	await page.getByRole("menuitem", { name: "Log out" }).click();
	await expect(page).toHaveURL(/\/$/);

	await page.goto("/participant/profile");
	await expect(page).toHaveURL(/\/$/);
});

test.describe("on mobile", () => {
	test.use({ viewport: { width: 393, height: 852 } });

	test("the sidebar opens from the header toggle", async ({
		authenticatedPage: page
	}) => {
		await page.goto("/participant");
		const myTeam = page.getByRole("link", { name: "My Team", exact: true });
		await expect(myTeam).toBeHidden();

		await page.getByRole("button", { name: "Toggle Sidebar" }).click();
		await myTeam.click();

		await expect(page).toHaveURL(/\/participant\/team$/);
	});
});
