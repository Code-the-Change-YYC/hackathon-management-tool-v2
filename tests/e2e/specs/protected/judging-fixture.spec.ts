import { Role } from "@/types/types";
import { expect, test } from "../../fixtures/judging.fixture";

test.use({
	authUserOptions: { role: Role.JUDGE, completedRegistration: true }
});
test("HMTV2-49: isolated judging fixtures load a real assigned scorecard", async ({
	authenticatedPage: page,
	judgingFixture
}) => {
	await page.goto(`/judge/score/${judgingFixture.assignmentId}`);
	await expect(
		page.getByRole("heading", {
			name: judgingFixture.criteria[0]?.name,
			exact: true
		})
	).toBeVisible();
	await expect(
		page.getByRole("button", { name: "10 points", exact: true })
	).toBeVisible();
	await expect(
		page.getByText(judgingFixture.teamName, { exact: true }).first()
	).toBeVisible();
});
