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
		await page.getByRole("button", { name: "Send code", exact: true }).click();

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
			.getByRole("button", { name: "Reset password", exact: true })
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
		.getByRole("button", { name: "Reset password", exact: true })
		.click();

	await expect(
		page.getByText("That code isn’t right. Check your email and try again.")
	).toBeVisible();
	await expect(page).toHaveURL(/\/reset-password\?email=/);
});

test("a used-up reset code says so until a new one is sent", async ({
	page
}) => {
	const { cleanup, user } = await createTestUserWithPassword("Password123!", {
		completedRegistration: false,
		name: "",
		role: "user"
	});
	const codeField = page.getByLabel("One-time code");
	const submit = page.getByRole("button", {
		name: "Reset password",
		exact: true
	});
	const resetRequests: string[] = [];
	page.on("request", (request) => {
		if (request.url().endsWith("/email-otp/reset-password")) {
			resetRequests.push(request.url());
		}
	});

	try {
		await page.goto(
			`/forgot-password?${new URLSearchParams({ email: user.email })}`
		);
		await page.getByRole("button", { name: "Send code", exact: true }).click();
		await expect(page).toHaveURL(/\/reset-password\?email=/);
		let code: string | undefined;
		await expect
			.poll(async () => {
				code = await getVerificationCode(user.email, "forget-password");
				return code;
			})
			.toMatch(/^\d+$/);
		const wrongCode = code === "000000" ? "111111" : "000000";
		await page
			.getByRole("textbox", { name: "New password" })
			.fill("NewPassword456!");

		for (const message of [
			"That code isn’t right. Check your email and try again.",
			"That code isn’t right. Check your email and try again.",
			"Too many incorrect attempts. Resend the code to get a new one."
		]) {
			await codeField.fill(wrongCode);
			await submit.click();
			await expect(page.getByText(message)).toBeVisible();
		}

		// The right code can't work any more either, so it isn't even sent.
		await codeField.fill(code ?? "");
		await submit.click();
		await expect(
			page.getByText(
				"This code no longer works. Resend the code to get a new one."
			)
		).toBeVisible();
		expect(resetRequests).toHaveLength(3);

		await page.getByRole("button", { name: "Resend one-time code" }).click();
		await expect(page.getByText("We sent you a new code")).toBeVisible();
		const newCode = await getVerificationCode(user.email, "forget-password");
		await codeField.fill(newCode ?? "");
		await submit.click();
		await expect(page).toHaveURL(/\/onboarding\/personal-details$/);
	} finally {
		await cleanup();
	}
});
