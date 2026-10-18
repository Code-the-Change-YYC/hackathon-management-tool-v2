import { inArray } from "drizzle-orm";
import type { Page } from "playwright/test";
import { db } from "@/server/db";
import { organization } from "@/server/db/auth-schema";
import { Role } from "@/types/types";
import { assertE2EDatabaseSafety } from "../../db";
import { expect, test } from "../../fixtures/team.fixture";

test.use({
	authUserOptions: { name: "Team Participant", role: Role.PARTICIPANT }
});

const createdTeamNames = new Set<string>();

test.afterEach(async () => {
	if (createdTeamNames.size === 0) return;
	assertE2EDatabaseSafety();
	await db
		.delete(organization)
		.where(inArray(organization.name, [...createdTeamNames]));
	createdTeamNames.clear();
});

async function registerTeam(page: Page, name: string) {
	createdTeamNames.add(name);
	await page.goto("/participant/team");
	await page.getByRole("button", { name: "Join or register a team" }).click();
	await expect(
		page.getByText("Select the statement that describes your situation best.")
	).toBeVisible();
	await page.getByText("but our team is not registered yet.").click();
	await page.getByRole("button", { name: "Continue" }).click();

	await expect(
		page.getByRole("heading", { name: "Register your team" })
	).toBeVisible();
	await page.getByLabel("Enter your team’s name").fill(name);
	await page.getByRole("button", { name: "Continue" }).click();
	await expect(
		page.getByText("Invite others to join your team!")
	).toBeVisible();
	await page.getByRole("button", { name: "Done" }).click();
}

test("register flow walks situation, register and invite modals", async ({
	authenticatedPage: page
}) => {
	const name = `Reg Team ${Date.now()}`;
	createdTeamNames.add(name);

	await page.goto("/participant/team");
	await page.getByRole("button", { name: "Join or register a team" }).click();
	await expect(
		page.getByText("Select the statement that describes your situation best.")
	).toBeVisible();

	await page.getByText("but our team is not registered yet.").click();
	await page.getByRole("button", { name: "Continue" }).click();

	await expect(
		page.getByRole("heading", { name: "Register your team" })
	).toBeVisible();
	await page.getByLabel("Enter your team’s name").fill(name);
	await page.getByRole("button", { name: "Continue" }).click();

	await expect(
		page.getByRole("heading", { name: "Invite others to join your team!" })
	).toBeVisible();

	await page.getByRole("button", { name: "Done" }).click();
	await expect(
		page.getByRole("heading", { name: "Invite others to join your team!" })
	).toBeHidden();
	await expect(page.getByText(name, { exact: true })).toBeVisible();
});

test("owner can open invite, edit name and leave modals", async ({
	authenticatedPage: page
}) => {
	await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
	const name = `Owner Team ${Date.now()}`;
	await registerTeam(page, name);

	// Invite code modal
	await page.getByRole("button", { name: /Invite team member/i }).click();
	await expect(
		page.getByText("Invite others to join your team!")
	).toBeVisible();
	await page.getByRole("button", { name: "Copy to clipboard" }).click();
	await page.keyboard.press("Escape");

	// Edit team name modal
	const renamed = `${name} Renamed`;
	createdTeamNames.add(renamed);
	await page.getByRole("button", { name: "Edit team name" }).click();
	const nameField = page.getByLabel("Team name", { exact: true });
	await expect(nameField).toBeVisible();
	await nameField.fill(renamed);
	await page.getByRole("button", { name: "Save" }).click();
	await expect(page.getByText(renamed)).toBeVisible();

	// Leave team modal
	await page.getByRole("button", { name: "Leave team" }).click();
	await expect(
		page.getByText(`Are you sure you want to leave ${renamed}?`)
	).toBeVisible();
	await page.getByRole("button", { name: "Yes, leave team" }).click();
	await expect(
		page.getByRole("button", { name: "Join or register a team" })
	).toBeVisible();
});

test("join flow accepts a valid code and shows success modal", async ({
	authenticatedPage: page,
	createTeam
}) => {
	const team = await createTeam("Joinable");

	await page.goto("/participant/team");
	await page.getByRole("button", { name: "Join or register a team" }).click();
	await page.getByText("our team is already registered").click();
	await page.getByRole("button", { name: "Continue" }).click();

	await expect(
		page.getByText("Enter your team’s invite code to join")
	).toBeVisible();
	await page.getByLabel("Team invite code").fill(team.teamCode ?? "");
	await page.getByRole("button", { name: "Continue" }).click();

	await expect(page.getByText(`You've joined ${team.name}!`)).toBeVisible();
	await page.getByRole("button", { name: "Finish" }).click();
	await expect(
		page.getByRole("heading", { name: `You've joined ${team.name}!` })
	).toBeHidden();
	await expect(page.getByText(team.name, { exact: true })).toBeVisible();
});

test("join modal shows an error for an unknown code", async ({
	authenticatedPage: page
}) => {
	await page.goto("/participant/team");
	await page.getByRole("button", { name: "Join or register a team" }).click();
	await page.getByText("our team is already registered").click();
	await page.getByRole("button", { name: "Continue" }).click();

	await expect(
		page.getByText("Enter your team’s invite code to join")
	).toBeVisible();
	await page.getByLabel("Team invite code").fill("ZZZZZZ");
	await page.getByRole("button", { name: "Continue" }).click();

	await expect(
		page.getByText("No team uses that code. Check it with your teammates.")
	).toBeVisible();
});
