import type { Page } from "playwright/test";
import { Role } from "@/types/types";
import { expect, test } from "../../fixtures/auth.fixture";

const mealInfoPath = "/participant/meal-info";
const dietaryMutation =
	/\/api\/trpc\/users\.updateUserDietaryRestrictions(?:\?|$)/;
const restrictionLabels = [
	"Halal",
	"Vegetarian",
	"Vegan",
	"Gluten-free",
	"Other"
];

function dietarySection(page: Page) {
	return page.locator("section").filter({
		has: page.getByRole("heading", {
			name: "Dietary Restrictions",
			exact: true,
			includeHidden: true
		})
	});
}

function editor(page: Page) {
	return page.getByRole("dialog", {
		name: "Edit your dietary restrictions",
		exact: true
	});
}

function confirmation(page: Page) {
	return page.getByRole("dialog", {
		name: "Are you sure you want to discard your changes?",
		exact: true
	});
}

async function openEditor(page: Page) {
	await dietarySection(page).getByRole("button", { name: "Edit" }).click();
	await expect(editor(page)).toBeVisible();
}

async function expectRegistered(page: Page, labels: string[]) {
	const section = dietarySection(page);
	await expect(section.locator('[data-slot="badge"]')).toHaveText(labels);
	if (labels.length === 0) {
		await expect(
			section.getByText("None registered", { exact: true })
		).toBeVisible();
	} else {
		await expect(
			section.getByText("None registered", { exact: true })
		).toHaveCount(0);
	}
}

async function expectDraft(page: Page, labels: string[]) {
	const dialog = editor(page);
	await expect(dialog.getByRole("button", { name: /^Remove / })).toHaveText(
		labels
	);
	for (const label of restrictionLabels) {
		await expect(
			dialog.getByRole("button", { name: label, exact: true })
		).toHaveCount(labels.includes(label) ? 0 : 1);
	}
	await expect(dialog.getByText("None selected", { exact: true })).toHaveCount(
		labels.length === 0 ? 1 : 0
	);
	await expect(
		dialog.getByRole("button", { name: "None", exact: true })
	).toHaveCount(labels.length === 0 ? 0 : 1);
}

async function saveAndExpectRegistered(page: Page, labels: string[]) {
	await editor(page)
		.getByRole("button", { name: "Save changes", exact: true })
		.click();
	await expect(editor(page)).toHaveCount(0);
	await expect(
		page.getByText("Dietary restrictions updated", { exact: true })
	).toBeVisible();
	await expectRegistered(page, labels);
	await page.reload();
	await expectRegistered(
		page,
		restrictionLabels.filter((label) => labels.includes(label))
	);
}

test.use({
	authUserOptions: {
		name: "Dietary Participant",
		role: Role.PARTICIPANT,
		dietaryRestrictions: ["halal", "gluten_free"]
	}
});

test.beforeEach(async ({ authenticatedPage }) => {
	await authenticatedPage.goto(mealInfoPath);
});

// Given I am a participant with Halal and Gluten-free registered
// When I view meal information and click Edit
// Then the page shows both badges rather than "None registered"
// And the editor shows my selections, offers unselected restrictions, and disables Save changes.
test("shows registered Halal and Gluten-free badges and an unchanged editor", async ({
	authenticatedPage: page
}) => {
	await expectRegistered(page, ["Halal", "Gluten-free"]);
	await openEditor(page);
	await expectDraft(page, ["Halal", "Gluten-free"]);
	await expect(
		editor(page).getByRole("button", { name: "Save changes" })
	).toBeDisabled();
	await expect(
		editor(page).getByRole("button", { name: "Cancel", exact: true })
	).toBeEnabled();
});

test.describe("without registered restrictions", () => {
	test.use({
		authUserOptions: {
			role: Role.PARTICIPANT,
			dietaryRestrictions: []
		}
	});

	// Given I am a participant with no registered dietary restrictions
	// When I view meal information and open the editor
	// Then I see "None registered" on the page and "None selected" in the editor
	// And every restriction is available while Save changes remains disabled.
	test("shows the empty state and offers every restriction in the editor", async ({
		authenticatedPage: page
	}) => {
		await expectRegistered(page, []);
		await openEditor(page);
		await expectDraft(page, []);
		await expect(
			editor(page).getByRole("button", { name: "Save changes" })
		).toBeDisabled();
	});
});

// Given the dietary editor is open and Vegetarian is not selected
// When I click Vegetarian
// Then it becomes selected, is no longer available, and enables Save changes
// When I save and reload the page
// Then the updated restrictions remain registered.
test("adds Vegetarian and persists it after reload", async ({
	authenticatedPage: page
}) => {
	await openEditor(page);
	await editor(page)
		.getByRole("button", { name: "Vegetarian", exact: true })
		.click();
	await expectDraft(page, ["Halal", "Gluten-free", "Vegetarian"]);
	await expect(
		editor(page).getByRole("button", { name: "Save changes" })
	).toBeEnabled();
	await saveAndExpectRegistered(page, ["Halal", "Gluten-free", "Vegetarian"]);
});

// Given the dietary editor contains Halal and Gluten-free
// When I click Remove Halal
// Then Halal is available again and only Gluten-free remains selected
// When I save and reload the page
// Then only Gluten-free remains registered.
test("removes Halal and persists the remaining restriction", async ({
	authenticatedPage: page
}) => {
	await openEditor(page);
	await editor(page)
		.getByRole("button", { name: "Remove Halal", exact: true })
		.click();
	await expectDraft(page, ["Gluten-free"]);
	await saveAndExpectRegistered(page, ["Gluten-free"]);
});

// Given the dietary editor has selected restrictions
// When I click None
// Then all selections are removed, "None selected" appears, and Save changes is enabled
// When I save and reload the page
// Then the page still shows "None registered".
test("None clears all restrictions and persists the empty state", async ({
	authenticatedPage: page
}) => {
	await openEditor(page);
	await editor(page).getByRole("button", { name: "None", exact: true }).click();
	await expectDraft(page, []);
	await expect(
		editor(page).getByRole("button", { name: "Save changes" })
	).toBeEnabled();
	await saveAndExpectRegistered(page, []);
});

// Given I have added Vegetarian in the dietary editor and the save request is held pending
// When I click Save changes
// Then the disabled button shows "Saving...", Cancel is disabled, and my draft stays visible
// When the request is released and succeeds
// Then the dialog closes, "Dietary restrictions updated" appears, and the page updates
// And the saved restrictions persist after reload.
test("disables save and cancel while saving, then updates the page on success", async ({
	authenticatedPage: page
}) => {
	let releaseSave = () => {};
	const saveGate = new Promise<void>((resolve) => {
		releaseSave = resolve;
	});
	await page.route(dietaryMutation, async (route) => {
		if (route.request().method() !== "POST") {
			await route.continue();
			return;
		}
		await saveGate;
		await route.continue();
	});

	try {
		await openEditor(page);
		await editor(page)
			.getByRole("button", { name: "Vegetarian", exact: true })
			.click();
		const request = page.waitForRequest(
			(request) =>
				request.method() === "POST" && dietaryMutation.test(request.url())
		);
		await editor(page).getByRole("button", { name: "Save changes" }).click();
		await request;
		await expect(
			editor(page).getByRole("button", { name: "Saving...", exact: true })
		).toBeDisabled();
		await expect(
			editor(page).getByRole("button", { name: "Cancel", exact: true })
		).toBeDisabled();
		await expectDraft(page, ["Halal", "Gluten-free", "Vegetarian"]);
		await expectRegistered(page, ["Halal", "Gluten-free"]);
	} finally {
		releaseSave();
	}

	await expect(editor(page)).toHaveCount(0);
	await expect(
		page.getByText("Dietary restrictions updated", { exact: true })
	).toBeVisible();
	await expectRegistered(page, ["Halal", "Gluten-free", "Vegetarian"]);
	await page.reload();
	await expectRegistered(page, ["Halal", "Vegetarian", "Gluten-free"]);
});

// Given the dietary editor is open and I have not changed any restrictions
// When I click Cancel
// Then the editor closes without a discard confirmation
// And reopening it shows the original selections with Save changes disabled.
test("unchanged cancel closes without confirmation and preserves the original", async ({
	authenticatedPage: page
}) => {
	await openEditor(page);
	await editor(page)
		.getByRole("button", { name: "Cancel", exact: true })
		.click();
	await expect(editor(page)).toHaveCount(0);
	await expect(confirmation(page)).toHaveCount(0);
	await expectRegistered(page, ["Halal", "Gluten-free"]);
	await openEditor(page);
	await expectDraft(page, ["Halal", "Gluten-free"]);
	await expect(
		editor(page).getByRole("button", { name: "Save changes" })
	).toBeDisabled();
});

// Given I have unsaved dietary changes
// When I click Cancel
// Then I see "Are you sure you want to discard your changes?"
// When I click "No, review changes"
// Then the editor returns with my draft intact and Save changes enabled
// And my registered restrictions remain unchanged.
test("changed cancel asks for confirmation and review retains the draft", async ({
	authenticatedPage: page
}) => {
	await openEditor(page);
	await editor(page)
		.getByRole("button", { name: "Remove Halal", exact: true })
		.click();
	await editor(page)
		.getByRole("button", { name: "Vegetarian", exact: true })
		.click();
	await editor(page)
		.getByRole("button", { name: "Cancel", exact: true })
		.click();
	await expect(confirmation(page)).toBeVisible();
	await expect(editor(page)).toHaveCount(0);
	await confirmation(page)
		.getByRole("button", { name: "No, review changes", exact: true })
		.click();
	await expect(confirmation(page)).toHaveCount(0);
	await expectDraft(page, ["Gluten-free", "Vegetarian"]);
	await expect(
		editor(page).getByRole("button", { name: "Save changes" })
	).toBeEnabled();
	await expectRegistered(page, ["Halal", "Gluten-free"]);
});

// Given I have unsaved dietary changes and open the discard confirmation
// When I click "Yes, discard changes"
// Then the dialog closes and "Changes to dietary restrictions discarded" appears
// And reopening the editor or reloading the page shows only the original restrictions.
test("discard closes with a toast and restores the original on reopen and reload", async ({
	authenticatedPage: page
}) => {
	await openEditor(page);
	await editor(page).getByRole("button", { name: "None", exact: true }).click();
	await editor(page)
		.getByRole("button", { name: "Vegetarian", exact: true })
		.click();
	await editor(page)
		.getByRole("button", { name: "Cancel", exact: true })
		.click();
	await expect(confirmation(page)).toBeVisible();
	await confirmation(page)
		.getByRole("button", { name: "Yes, discard changes", exact: true })
		.click();
	await expect(confirmation(page)).toHaveCount(0);
	await expect(editor(page)).toHaveCount(0);
	await expect(
		page.getByText("Changes to dietary restrictions discarded", { exact: true })
	).toBeVisible();
	await expectRegistered(page, ["Halal", "Gluten-free"]);
	await openEditor(page);
	await expectDraft(page, ["Halal", "Gluten-free"]);
	await expect(
		editor(page).getByRole("button", { name: "Save changes" })
	).toBeDisabled();
	await page.reload();
	await expectRegistered(page, ["Halal", "Gluten-free"]);
});

// Given I have unsaved dietary changes and the save request will fail
// When I click Save changes
// Then I see "Unable to update dietary restrictions" and the editor stays open
// And my draft remains visible with Save changes and Cancel enabled
// And reloading confirms that my registered restrictions were not changed.
test("failed save keeps the editor open and the draft available to retry", async ({
	authenticatedPage: page
}) => {
	await page.route(dietaryMutation, async (route) => {
		if (route.request().method() !== "POST") {
			await route.continue();
			return;
		}
		await route.abort("failed");
	});
	await openEditor(page);
	await editor(page)
		.getByRole("button", { name: "Remove Halal", exact: true })
		.click();
	await editor(page)
		.getByRole("button", { name: "Vegetarian", exact: true })
		.click();
	await editor(page).getByRole("button", { name: "Save changes" }).click();
	await expect(
		page.getByText("Unable to update dietary restrictions", { exact: true })
	).toBeVisible();
	await expect(editor(page)).toBeVisible();
	await expectDraft(page, ["Gluten-free", "Vegetarian"]);
	await expect(
		editor(page).getByRole("button", { name: "Save changes" })
	).toBeEnabled();
	await expect(
		editor(page).getByRole("button", { name: "Cancel", exact: true })
	).toBeEnabled();
	await expectRegistered(page, ["Halal", "Gluten-free"]);
	await page.reload();
	await expectRegistered(page, ["Halal", "Gluten-free"]);
});
