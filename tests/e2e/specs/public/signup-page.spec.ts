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
		page.getByRole("heading", { name: /Welcome to Hack the Change 2026/i })
	).toBeVisible();

	await signupPage.fillForm(signupData);
	await signupPage.submit();

	await expect(page).toHaveURL(/\/login$/);
});

test("manual registration retains identity details when navigating back", async ({
	page
}) => {
	await page.goto("/signup");
	await page.getByLabel("Email").fill("ada@example.com");
	await page.getByLabel("Password", { exact: true }).fill("Password123!");
	expect(
		await page.evaluate(() => sessionStorage.getItem("signup-wizard"))
	).toBeNull();
	await page.getByRole("button", { exact: true, name: "Sign Up" }).click();
	await page.getByLabel("First name").fill("Ada");
	await page.getByLabel("Last name").fill("Lovelace");
	await page.getByLabel(/Which institution are you attending/).click();
	await page.getByRole("option", { name: "University of Calgary" }).click();
	await page.getByRole("button", { name: "Continue" }).click();
	await expect(page).toHaveURL(/\/signup\/event-details$/);
	await page.goBack();
	await expect(page).toHaveURL(/\/signup\/identity$/);

	await expect(page.getByLabel("First name")).toHaveValue("Ada");
	await expect(page.getByLabel("Last name")).toHaveValue("Lovelace");
	await expect(
		page.getByLabel(/Which institution are you attending/)
	).toContainText("University of Calgary");
});

test("sign-up validates password requirements and renders at desktop and mobile widths", async ({
	page
}) => {
	for (const viewport of [
		{ height: 900, width: 1440 },
		{ height: 844, width: 390 }
	]) {
		await page.setViewportSize(viewport);
		await page.goto("/signup");
		await expect(
			page.getByRole("heading", { name: /Welcome to Hack the Change 2026/i })
		).toBeVisible();
		await expect(
			page.getByRole("button", { exact: true, name: "Sign Up" })
		).toBeDisabled();
	}

	await page.getByLabel("Email").fill("ada@example.com");
	await page.getByLabel("Password", { exact: true }).fill("Password123!");
	await expect(page.getByText("Minimum 8 characters")).toBeVisible();
	await expect(
		page.getByRole("button", { exact: true, name: "Sign Up" })
	).toBeEnabled();
});
