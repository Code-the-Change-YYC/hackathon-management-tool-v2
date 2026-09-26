import { createSignupData } from "../../../utils/signup-data";
import { expect, test } from "../../fixtures/pages.fixture";

test("a participant can complete individual registration", async ({
	page,
	signupPage,
	registerUserForCleanup
}, testInfo) => {
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

	await expect(page).toHaveURL(/\/$/);
});

test("manual registration retains identity details when navigating back", async ({
	page
}) => {
	await page.goto("/signup");
	await page.getByLabel("Email").fill("ada@example.com");
	await page.getByRole("textbox", { name: "Password" }).fill("Password123!");
	await page.getByRole("button", { name: "Sign Up", exact: true }).click();
	await page.getByLabel("First name").fill("Ada");
	await page.getByLabel("Last name").fill("Lovelace");
	expect(
		await page.evaluate(() => sessionStorage.getItem("signup-wizard"))
	).toBeNull();
	await page.getByLabel("Which institution are you attending?*").click();
	await page.getByRole("option", { name: "SAIT", exact: true }).click();
	await page.getByRole("button", { name: "Continue", exact: true }).click();
	await page.waitForURL("/signup/event-details");
	await page.getByRole("link", { name: "Back" }).click();

	await expect(page.getByLabel("First name")).toHaveValue("Ada");
	await expect(page.getByLabel("Last name")).toHaveValue("Lovelace");
	await expect(
		page.getByLabel("Which institution are you attending?*")
	).toHaveText("SAIT");
});

test("credentials validation exposes requirements and responsive controls", async ({
	page
}) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto("/signup");

	const email = page.getByLabel("Email");
	const password = page.getByRole("textbox", { name: "Password" });
	const submit = page.getByRole("button", { name: "Sign Up", exact: true });

	await expect(email).toBeVisible();
	await expect(password).toBeVisible();
	await expect(submit).toBeDisabled();
	await expect(page.getByText("Minimum 8 characters")).toBeVisible();
	await expect(page.getByText("At least one number")).toBeVisible();
	await expect(page.getByText("At least one special character")).toBeVisible();

	await email.fill("participant@example.com");
	await password.fill("short");
	await expect(submit).toBeDisabled();
	await password.focus();
	await expect(password).toBeFocused();

	await password.fill("Password123!");
	await expect(submit).toBeEnabled();
	const hasNoHorizontalOverflow = await page.evaluate(
		() => document.body.scrollWidth <= window.innerWidth
	);
	expect(hasNoHorizontalOverflow).toBe(true);
});
