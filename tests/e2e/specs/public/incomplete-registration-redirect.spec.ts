import { createTestUserWithPassword } from "../../../utils/auth";
import { expect, test } from "../../fixtures/pages.fixture";

test("an email user who hasn't onboarded is sent to personal details after logging in", async ({
	page,
	loginPage
}) => {
	const password = "Password123!";
	const { cleanup, user } = await createTestUserWithPassword(password, {
		completedRegistration: false,
		name: "",
		role: "user"
	});

	try {
		await loginPage.goto();
		await loginPage.fillFormAndSubmit({ email: user.email, password });

		await expect(page).toHaveURL(/\/onboarding\/personal-details$/);
		await expect(
			page.getByLabel("Which institution are you attending?", { exact: true })
		).toBeVisible();
	} finally {
		await cleanup();
	}
});
