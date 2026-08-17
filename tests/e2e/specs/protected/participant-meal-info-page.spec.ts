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

test("participant can add and save a dietary restriction", async ({
	authenticatedPage
}) => {
	await authenticatedPage.goto("/participant/meal-info");

	const dietaryRestrictionsSection = authenticatedPage
		.getByRole("heading", { name: "Dietary Restrictions" })
		.locator("..");
	await dietaryRestrictionsSection
		.getByRole("button", { name: "Edit" })
		.click();

	const editor = authenticatedPage.getByRole("dialog");
	await expect(
		editor.getByRole("heading", {
			name: "Edit your dietary restrictions"
		})
	).toBeVisible();
	await editor.getByRole("button", { name: "Vegan" }).click();
	await editor.getByRole("button", { name: "Save changes" }).click();

	await expect(editor).not.toBeVisible();
	await expect(
		dietaryRestrictionsSection.getByText("Gluten-free", { exact: true })
	).toBeVisible();
	await expect(
		dietaryRestrictionsSection.getByText("Vegan", { exact: true })
	).toBeVisible();
	await expect(
		authenticatedPage.getByText("Dietary restrictions updated", { exact: true })
	).toBeVisible();
});

test("participant can remove and save a dietary restriction", async ({
	authenticatedPage
}) => {
	await authenticatedPage.goto("/participant/meal-info");

	const dietaryRestrictionsSection = authenticatedPage
		.getByRole("heading", { name: "Dietary Restrictions" })
		.locator("..");
	await dietaryRestrictionsSection
		.getByRole("button", { name: "Edit" })
		.click();

	const editor = authenticatedPage.getByRole("dialog");
	await editor.getByRole("button", { name: "Remove Gluten-free" }).click();
	await expect(
		editor.getByText("None selected", { exact: true })
	).toBeVisible();
	await editor.getByRole("button", { name: "Save changes" }).click();

	await expect(editor).not.toBeVisible();
	await expect(
		dietaryRestrictionsSection.getByText("None registered", { exact: true })
	).toBeVisible();
	await expect(
		dietaryRestrictionsSection.getByText("Gluten-free", { exact: true })
	).not.toBeVisible();
	await expect(
		authenticatedPage.getByText("Dietary restrictions updated", { exact: true })
	).toBeVisible();
});
