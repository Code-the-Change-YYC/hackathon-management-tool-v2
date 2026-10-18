import { createTestUserWithPassword } from "../../../utils/auth";
import { expect, test } from "../../fixtures/pages.fixture";

const invalidCredentialsMessage = "Incorrect email or password";

test("shows a generic error for an unknown email address", async ({
	page,
	loginPage
}) => {
	await loginPage.goto();
	await loginPage.fillFormAndSubmit({
		email: "unknown@example.com",
		password: "Password123!"
	});

	await expect(page).toHaveURL(/\/login$/);
	await expect(page.getByText(invalidCredentialsMessage)).toBeVisible();
});

test("shows the same generic error for an incorrect password", async ({
	page,
	loginPage
}) => {
	const { cleanup, user } = await createTestUserWithPassword("Password123!");

	try {
		await loginPage.goto();
		await loginPage.fillFormAndSubmit({
			email: user.email,
			password: "WrongPassword123!"
		});

		await expect(page).toHaveURL(/\/login$/);
		await expect(page.getByText(invalidCredentialsMessage)).toBeVisible();
	} finally {
		await cleanup();
	}
});

test("login remains usable at a mobile viewport", async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto("/login");

	const password = page.getByRole("textbox", { name: "Password" });
	await expect(
		page.getByRole("heading", {
			name: "Welcome back to Hack the Change 2026!"
		})
	).toBeVisible();
	await password.focus();
	await expect(password).toBeFocused();

	const hasNoHorizontalOverflow = await page.evaluate(
		() => document.body.scrollWidth <= window.innerWidth
	);
	expect(hasNoHorizontalOverflow).toBe(true);
});
