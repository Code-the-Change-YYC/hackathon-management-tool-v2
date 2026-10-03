import {
	createTestUserWithPassword,
	getVerificationCode
} from "../../../utils/auth";
import { expect, test } from "../../fixtures/pages.fixture";

test("a participant who forgot their password resets it with an emailed code", async ({
	page,
	loginPage
}) => {
	const newPassword = "NewPassword456!";
	const { cleanup, user } = await createTestUserWithPassword("Password123!", {
		completedRegistration: false,
		name: "",
		role: "user"
	});

	try {
		await loginPage.goto();
		await page.getByLabel("Email").fill(user.email);
		await page.getByRole("link", { name: "Forgot password?" }).click();

		await expect(page).toHaveURL(/\/forgot-password\?email=/);
		await expect(page.getByLabel("Email")).toHaveValue(user.email);
		await page.getByRole("button", { name: "Send Code", exact: true }).click();

		await expect(page).toHaveURL(/\/reset-password\?email=/);
		let code: string | undefined;
		await expect
			.poll(async () => {
				code = await getVerificationCode(user.email, "forget-password");
				return code;
			})
			.toMatch(/^\d+$/);
		await page.getByLabel("One-time code").fill(code ?? "");
		await page.getByRole("textbox", { name: "New password" }).fill(newPassword);
		await page
			.getByRole("button", { name: "Reset Password", exact: true })
			.click();

		// Resetting logs them in and picks up where they left off.
		await expect(page).toHaveURL(/\/onboarding\/personal-details$/);
		await page.context().clearCookies();
		await loginPage.goto();
		await loginPage.fillFormAndSubmit({
			email: user.email,
			password: newPassword
		});
		await expect(page).toHaveURL(/\/onboarding\/personal-details$/);
	} finally {
		await cleanup();
	}
});

test("a wrong reset code is shown on the code field", async ({ page }) => {
	await page.goto("/reset-password?email=nobody%40example.com");

	await page.getByLabel("One-time code").fill("000000");
	await page
		.getByRole("textbox", { name: "New password" })
		.fill("Password123!");
	await page
		.getByRole("button", { name: "Reset Password", exact: true })
		.click();

	await expect(
		page.getByText("That code isn't right. Check your email and try again.")
	).toBeVisible();
	await expect(page).toHaveURL(/\/reset-password\?email=/);
});
