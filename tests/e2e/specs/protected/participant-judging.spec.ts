import { Role } from "@/types/types";
import { expect, test } from "../../fixtures/auth.fixture";

test.use({
	authUserOptions: { name: "Judging Participant", role: Role.PARTICIPANT }
});

test("participant without a team sees an unscheduled judging time", async ({
	authenticatedPage: page,
	authUser
}) => {
	await page.goto("/participant/judging");

	await expect(
		page.getByRole("heading", { name: "Judging Schedule" })
	).toBeVisible();
	await expect(page.getByText(authUser.name, { exact: true })).toBeVisible();
	await expect(
		page.getByText("Your judging time has not been scheduled yet.")
	).toBeVisible();
});
