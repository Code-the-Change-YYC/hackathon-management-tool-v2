import { auth } from "auth.test";
import { expect, test } from "../../fixtures/pages.fixture";

test("an incomplete email user is sent to personal details after signing in", async ({
	page,
	loginPage,
	registerUserForCleanup
}, testInfo) => {
	const email = `incomplete-${Date.now()}-${testInfo.parallelIndex}@hackathon.com`;
	const password = "Password123!";
	registerUserForCleanup(email);

	await auth.api.signUpEmail({
		body: {
			email,
			name: "Incomplete Participant",
			password
		}
	});

	await loginPage.goto();
	await loginPage.fillFormAndSubmit({ email, password });

	await expect(page).toHaveURL(/\/signup\/identity$/);
	await expect(
		page.getByLabel("Which institution are you attending?*")
	).toBeVisible();
});
