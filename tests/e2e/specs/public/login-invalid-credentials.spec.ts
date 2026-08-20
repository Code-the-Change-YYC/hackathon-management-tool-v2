import { auth } from "auth.test";
import { expect, test } from "../../fixtures/auth.fixture";

const invalidCredentialsMessage = "Incorrect email or password";

test("shows a generic error for an unknown email address", async ({ page }) => {
	await page.goto("/login");
	await page.getByLabel("Email").fill("unknown@example.com");
	await page.getByLabel("Password", { exact: true }).fill("Password123!");
	await page.getByRole("button", { exact: true, name: "Sign in" }).click();

	await expect(page).toHaveURL(/\/login$/);
	await expect(
		page.getByRole("alert").filter({ hasText: invalidCredentialsMessage })
	).toBeVisible();
});

test("shows the same generic error for an incorrect password", async ({
	page,
	registerUserForCleanup
}, testInfo) => {
	const email = `invalid-password-${Date.now()}-${testInfo.parallelIndex}@hackathon.com`;
	registerUserForCleanup(email);

	await auth.api.signUpEmail({
		body: {
			email,
			name: "Existing Participant",
			password: "Password123!"
		}
	});

	await page.goto("/login");
	await page.getByLabel("Email").fill(email);
	await page.getByLabel("Password", { exact: true }).fill("WrongPassword123!");
	await page.getByRole("button", { exact: true, name: "Sign in" }).click();

	await expect(page).toHaveURL(/\/login$/);
	await expect(
		page.getByRole("alert").filter({ hasText: invalidCredentialsMessage })
	).toBeVisible();
});
