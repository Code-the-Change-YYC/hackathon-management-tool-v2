import { inArray } from "drizzle-orm";
import type { Page } from "playwright/test";
import { db } from "@/server/db";
import { member, organization } from "@/server/db/auth-schema";
import { Role } from "@/types/types";
import { createTestUser } from "../../../utils/auth";
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

async function addMembers(teamId: string, count: number) {
	const users = await Promise.all(
		Array.from({ length: count }, (_, i) =>
			createTestUser({ name: `Teammate ${i + 1}` })
		)
	);
	await db.insert(member).values(
		users.map(({ user }) => ({
			id: crypto.randomUUID(),
			organizationId: teamId,
			userId: user.id,
			role: "member" as const,
			createdAt: new Date()
		}))
	);
	return async () => {
		for (const { cleanup } of users) await cleanup();
	};
}

async function joinAsOwner(teamId: string, userId: string) {
	await db.insert(member).values({
		id: crypto.randomUUID(),
		organizationId: teamId,
		userId,
		role: "owner",
		createdAt: new Date()
	});
}

test("lists teammates and marks the current user", async ({
	authenticatedPage: page,
	authUser,
	createTeam
}) => {
	const team = await createTeam("Roster");
	await joinAsOwner(team.id, authUser.id);
	const cleanup = await addMembers(team.id, 2);

	try {
		await page.goto("/participant/team");
		await expect(page.getByText("3/5 Members")).toBeVisible();

		await expect(page.getByText("YOU", { exact: true })).toHaveCount(1);
		await expect(page.getByText(authUser.email)).toBeVisible();
		await expect(page.getByRole("button", { name: "Leave team" })).toHaveCount(
			1
		);
		for (const name of ["Teammate 1", "Teammate 2"]) {
			await expect(page.getByText(name, { exact: true })).toBeVisible();
		}
		await expect(page.getByText("Member", { exact: true })).toHaveCount(2);
		await expect(
			page.getByRole("button", { name: /Invite Team Member/ })
		).toBeEnabled();
	} finally {
		await cleanup();
	}
});

test("a full team cannot invite more members", async ({
	authenticatedPage: page,
	authUser,
	createTeam
}) => {
	const team = await createTeam("Full");
	await joinAsOwner(team.id, authUser.id);
	const cleanup = await addMembers(team.id, 4);

	try {
		await page.goto("/participant/team");
		await expect(page.getByText("5/5 Members")).toBeVisible();
		await expect(
			page.getByRole("button", { name: /Invite Team Member/ })
		).toBeDisabled();
	} finally {
		await cleanup();
	}
});

test("members cannot rename the team or send invites", async ({
	authenticatedPage: page,
	authUser,
	createTeam
}) => {
	const team = await createTeam("Member");
	await db.insert(member).values({
		id: crypto.randomUUID(),
		organizationId: team.id,
		userId: authUser.id,
		role: "member",
		createdAt: new Date()
	});

	await page.goto("/participant/team");
	await expect(page.getByText(team.name, { exact: true })).toBeVisible();
	await expect(page.getByRole("button", { name: "Leave team" })).toBeVisible();
	await expect(
		page.getByRole("button", { name: "Edit team name" })
	).toHaveCount(0);

	const call = (path: string, json: object) =>
		page.request.post(`/api/trpc/${path}?batch=1`, {
			headers: { "content-type": "application/json" },
			data: { 0: { json } }
		});
	expect(
		(await call("teams.update", { id: team.id, name: "Hijacked" })).status()
	).toBe(403);
	expect(
		(await call("teams.invite", { email: "someone@example.com" })).status()
	).toBe(403);
});
