import { auth } from "auth.test";
import { expect, test } from "../../fixtures/auth.fixture";

test("an incomplete email user is sent to event details after signing in", async ({
	page,
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

	await page.goto("/login");
	await page.getByLabel("Email").fill(email);
	await page.getByLabel("Password").fill(password);
	await page.getByRole("button", { name: "Sign in" }).click();

	await expect(page).toHaveURL(/\/signup\/event-details$/);
	await expect(
		page.getByLabel("Which institution do you go to?")
	).toBeVisible();
});
