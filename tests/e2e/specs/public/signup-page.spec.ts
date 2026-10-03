import { getVerificationCode } from "../../../utils/auth";
import { createSignupData } from "../../../utils/signup-data";
import { expect, test } from "../../fixtures/pages.fixture";

test("a new participant signs up, verifies their email and starts onboarding", async ({
	page,
	signupPage,
	registerUserForCleanup
}, testInfo) => {
	const credentials = createSignupData(
		`${Date.now()}-${testInfo.parallelIndex}`
	);
	registerUserForCleanup(credentials.email);

	await signupPage.goto();
	await expect(
		page.getByRole("heading", { name: "Welcome to Hack the Change 2026!" })
	).toBeVisible();
	await signupPage.signUp(credentials);

	await expect(page).toHaveURL(/\/verify-email\?email=/);
	let code: string | undefined;
	await expect
		.poll(async () => {
			code = await getVerificationCode(credentials.email);
			return code;
		})
		.toMatch(/^\d+$/);
	await page.getByLabel("One-time code").fill(code ?? "");
	await page.getByRole("button", { name: "Verify", exact: true }).click();

	await expect(page).toHaveURL(/\/onboarding\/personal-details$/);
});

test("password requirements appear once a password is typed", async ({
	page
}) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto("/signup");

	const email = page.getByLabel("Email");
	const password = page.getByRole("textbox", { name: "Password" });
	const requirementsId = await password.getAttribute("aria-describedby");
	const requirements = page.locator(`[id="${requirementsId}"]`);

	await expect(requirements).toHaveAttribute("aria-hidden", "true");

	await email.fill("participant@example.com");
	await password.fill("short");
	await expect(requirements).toHaveAttribute("aria-hidden", "false");
	await expect(requirements).toContainText("Minimum 8 characters");
	await expect(requirements).toContainText("At least one number");
	await expect(requirements).toContainText("At least one special character");
	const hasNoHorizontalOverflow = await page.evaluate(
		() => document.body.scrollWidth <= window.innerWidth
	);
	expect(hasNoHorizontalOverflow).toBe(true);
});
