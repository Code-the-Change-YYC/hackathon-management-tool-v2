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
