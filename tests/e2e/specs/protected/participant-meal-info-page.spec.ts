import { Role } from "@/types/types";
import { expect, test } from "../../fixtures/auth.fixture";

test.use({
	authUserOptions: {
		name: "Participant User",
		role: Role.PARTICIPANT
	}
});

test("dashboard shows user name", async ({ authenticatedPage, authUser }) => {
	await authenticatedPage.goto("/participant/meal-info");
	await expect(authenticatedPage.getByText(authUser.name)).toBeVisible();
});
