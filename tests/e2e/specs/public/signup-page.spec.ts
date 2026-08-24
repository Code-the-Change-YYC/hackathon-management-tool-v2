import { expect, test } from "../../fixtures/auth.fixture";
import { createSignupData } from "../../helpers/signup-data";
import { SignupPage } from "../../pages/signup.page";

test("a participant can complete individual registration", async ({
	page,
	registerUserForCleanup
}, testInfo) => {
	const signupPage = new SignupPage(page);
	const signupData = createSignupData(
		`${Date.now()}-${testInfo.parallelIndex}`
	);
	registerUserForCleanup(signupData.email);

	await signupPage.goto();
	await expect(
		page.getByRole("heading", { name: /Register for Hack the Change/i })
	).toBeVisible();

	await signupPage.fillForm(signupData);
	await signupPage.submit();

	await expect(page).toHaveURL(/\/login$/);
});

test("manual registration retains identity details when navigating back", async ({
	page
}) => {
	await page.goto("/signup");
	await page
		.getByRole("button", { name: "Continue with email and password" })
		.click();
	await page.getByLabel("First name").fill("Ada");
	await page.getByLabel("Last name").fill("Lovelace");
	await page.getByLabel("Email").fill("ada@example.com");
	await page.getByLabel("Password").fill("Password123!");
	expect(
		await page.evaluate(() => sessionStorage.getItem("signup-wizard"))
	).toBeNull();
	await page.getByRole("button", { name: "Continue to event details" }).click();
	await page.getByRole("button", { name: "Back" }).click();

	await expect(page.getByLabel("First name")).toHaveValue("Ada");
	await expect(page.getByLabel("Last name")).toHaveValue("Lovelace");
	await expect(page.getByLabel("Email")).toHaveValue("ada@example.com");
});
