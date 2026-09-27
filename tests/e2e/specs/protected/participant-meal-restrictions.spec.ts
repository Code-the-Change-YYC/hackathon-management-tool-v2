import { eq } from "drizzle-orm";
import { db } from "@/server/db";
import { user } from "@/server/db/auth-schema";
import { Role } from "@/types/types";
import { expect, test } from "../../fixtures/auth.fixture";

test.use({
	authUserOptions: {
		dietaryRestrictions: ["vegan"],
		role: Role.PARTICIPANT
	}
});

test("participant edits and saves dietary restrictions", async ({
	authenticatedPage: page,
	authUser
}) => {
	await page.goto("/participant/meals");
	const card = page.locator("section", { hasText: "Dietary Restrictions" });
	await expect(card.getByText("Vegan")).toBeVisible();

	await card.getByRole("button", { name: "Edit" }).click();
	const dialog = page.getByRole("dialog");
	await dialog.getByRole("button", { name: "Remove Vegan" }).click();
	await dialog.getByRole("button", { name: "Halal" }).click();
	await dialog.getByRole("button", { name: "Save changes" }).click();

	await expect(page.getByText("Dietary restrictions updated")).toBeVisible();
	await expect(card.getByText("Halal")).toBeVisible();
	await expect(card.getByText("Vegan")).toHaveCount(0);

	const saved = await db.query.user.findFirst({
		where: eq(user.id, authUser.id)
	});
	expect(saved?.dietaryRestrictions).toEqual(["halal"]);
});

test("closing with unsaved changes asks to discard", async ({
	authenticatedPage: page
}) => {
	await page.goto("/participant/meals");
	const card = page.locator("section", { hasText: "Dietary Restrictions" });

	await card.getByRole("button", { name: "Edit" }).click();
	const dialog = page.getByRole("dialog");
	await dialog.getByRole("button", { name: "Halal" }).click();
	await dialog.getByRole("button", { name: "Cancel" }).click();

	await expect(
		page.getByText("Are you sure you want to discard your changes?")
	).toBeVisible();
	await page.getByRole("button", { name: "Yes, discard changes" }).click();

	await expect(
		page.getByText("Changes to dietary restrictions discarded")
	).toBeVisible();
	await expect(card.getByText("Halal")).toHaveCount(0);
	await expect(card.getByText("Vegan")).toBeVisible();
});
