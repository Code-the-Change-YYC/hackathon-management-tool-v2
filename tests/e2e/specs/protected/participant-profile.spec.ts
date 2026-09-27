import { eq } from "drizzle-orm";
import type { Page } from "playwright/test";
import { db } from "@/server/db";
import { user } from "@/server/db/auth-schema";
import { Role } from "@/types/types";
import { expect, test } from "../../fixtures/auth.fixture";

test.use({
	authUserOptions: {
		name: "Profile Participant",
		role: Role.PARTICIPANT,
		school: "SAIT"
	}
});

const detail = (page: Page, label: string) =>
	page.locator("dt", { hasText: label }).locator("xpath=following-sibling::dd");

test("shows the participant's profile details", async ({
	authenticatedPage: page,
	authUser
}) => {
	await page.goto("/participant/profile");

	await expect(page.getByRole("heading", { name: "Profile" })).toBeVisible();
	await expect(page.getByText(authUser.email)).toBeVisible();
	await expect(detail(page, "First name")).toHaveText("Profile");
	await expect(detail(page, "Last name")).toHaveText("Participant");
	await expect(detail(page, "Institution")).toHaveText("SAIT");
	await expect(page.locator("dt", { hasText: "Major" })).toHaveCount(0);
});

test("cancelling an edit keeps the saved profile", async ({
	authenticatedPage: page
}) => {
	await page.goto("/participant/profile");
	await page.getByRole("button", { name: "Edit Info" }).click();
	await page.getByLabel("First name").fill("Changed");
	await page.getByRole("button", { name: "Cancel" }).click();

	await expect(page.getByText("Cancelled changes")).toBeVisible();
	await expect(detail(page, "First name")).toHaveText("Profile");
});

test("validates and saves profile edits", async ({
	authenticatedPage: page,
	authUser
}) => {
	await page.goto("/participant/profile");
	await page.getByRole("button", { name: "Edit Info" }).click();

	await page.getByLabel("First name").fill("");
	await page.getByLabel("Institution").click();
	await page
		.getByRole("option", { name: "University of Calgary", exact: true })
		.click();
	await page.getByRole("button", { name: "Save changes" }).click();

	await expect(page.getByText("First name is required")).toBeVisible();
	await expect(page.getByText("Select your major")).toBeVisible();

	await page.getByLabel("First name").fill("Updated");
	await page.getByLabel("Major").click();
	await page
		.getByRole("option", { name: "Computer Science", exact: true })
		.click();
	await page.getByRole("button", { name: "Save changes" }).click();

	await expect(page.getByText("Profile updated")).toBeVisible();
	await expect(detail(page, "First name")).toHaveText("Updated");
	await expect(detail(page, "Institution")).toHaveText("University of Calgary");
	await expect(detail(page, "Major")).toHaveText("Computer Science");

	const saved = await db.query.user.findFirst({
		where: eq(user.id, authUser.id)
	});
	expect(saved).toMatchObject({
		name: "Updated Participant",
		school: "University of Calgary",
		program: "computer_science"
	});
});
