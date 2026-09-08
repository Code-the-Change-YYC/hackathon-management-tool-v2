import { expect, type Page } from "playwright/test";

export const dietaryMutation =
	/\/api\/trpc\/users\.updateUserDietaryRestrictions(?:\?|$)/;
const restrictionLabels = [
	"Halal",
	"Vegetarian",
	"Vegan",
	"Gluten-free",
	"Other"
];

export function dietarySection(page: Page) {
	return page.locator("section").filter({
		has: page.getByRole("heading", {
			name: "Dietary Restrictions",
			exact: true,
			includeHidden: true
		})
	});
}

export function editor(page: Page) {
	return page.getByRole("dialog", {
		name: "Edit your dietary restrictions",
		exact: true
	});
}

export function confirmation(page: Page) {
	return page.getByRole("dialog", {
		name: "Are you sure you want to discard your changes?",
		exact: true
	});
}

export async function openEditor(page: Page) {
	await dietarySection(page).getByRole("button", { name: "Edit" }).click();
	await expect(editor(page)).toBeVisible();
}

export async function expectRegistered(page: Page, labels: string[]) {
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

export async function expectDraft(page: Page, labels: string[]) {
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

export async function saveAndExpectRegistered(page: Page, labels: string[]) {
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
