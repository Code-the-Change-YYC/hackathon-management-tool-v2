import { expect, test } from "../../fixtures/auth.fixture";

test.use({
	authUserOptions: {
		name: "E2E User"
	}
});

test("dashboard shows user name", async ({ authenticatedPage, authUser }) => {
	await authenticatedPage.goto("/participant");

	// Assert user name is visible
	await expect(authenticatedPage.getByText(authUser.name)).toBeVisible();
});
