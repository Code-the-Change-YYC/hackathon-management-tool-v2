import { expect, type Page } from "playwright/test";
import { DIETARY_RESTRICTION_LABELS } from "@/lib/validation/signup";

// Playwright sees the browser's network request, not the tRPC mutation object,
// so this pattern identifies the HTTP request generated when dietary restrictions
// are saved. It accepts both the plain URL and a URL with tRPC query parameters.
// TODO: Investigate whether this manual knowledge of tRPC's URL format can be
// avoided or represented more clearly across the E2E test suite.
export const dietaryMutation =
	/\/api\/trpc\/users\.updateUserDietaryRestrictions(?:\?|$)/;
const restrictionLabels = Object.values(DIETARY_RESTRICTION_LABELS);

export function dietarySection(page: Page) {
	return page.getByRole("region", {
		name: "Dietary Restrictions",
		exact: true,
		includeHidden: true
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
			section.getByText("No dietary restrictions registered.", { exact: true })
		).toBeVisible();
	} else {
		await expect(
			section.getByText("No dietary restrictions registered.", { exact: true })
		).toHaveCount(0);
	}
}

export async function expectDraft(page: Page, labels: string[]) {
	const dialog = editor(page);
	for (const label of restrictionLabels) {
		await expect(
			dialog.getByRole("button", { name: label, exact: true })
		).toHaveAttribute("aria-pressed", String(labels.includes(label)));
	}
}

export async function toggleRestriction(page: Page, label: string) {
	await editor(page).getByRole("button", { name: label, exact: true }).click();
}

export async function saveAndExpectRegistered(page: Page, labels: string[]) {
	await editor(page)
		.getByRole("button", { name: "Save changes", exact: true })
		.click();
	// The toast fires before the editor waits on the page refresh to close.
	await expect(
		page.getByText("Dietary restrictions updated", { exact: true })
	).toBeVisible();
	await expect(editor(page)).toHaveCount(0);
	const ordered = restrictionLabels.filter((label) => labels.includes(label));
	await expectRegistered(page, ordered);
	await page.reload();
	await expectRegistered(page, ordered);
}
