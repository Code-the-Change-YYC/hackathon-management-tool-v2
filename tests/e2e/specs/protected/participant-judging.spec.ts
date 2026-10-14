import { eq } from "drizzle-orm";
import { db } from "@/server/db";
import { member } from "@/server/db/auth-schema";
import {
	judgingAssignments,
	judgingRooms,
	judgingRounds
} from "@/server/db/schema";
import { Role } from "@/types/types";
import { TeamFixtureTracker } from "../../../utils/teams";
import { expect, test } from "../../fixtures/settings.fixture";

test.use({
	authUserOptions: { name: "Judging Participant", role: Role.PARTICIPANT }
});

test("participant without an assignment sees the general banner", async ({
	authenticatedPage: page,
	setSettings
}) => {
	await setSettings({ currentRoundId: null, judgingPhase: "not_started" });
	await page.goto("/participant/judging");

	await expect(
		page.getByRole("heading", { name: "Judging Information" })
	).toBeVisible();
	await expect(
		page.getByRole("heading", { name: /your team’s judging assignment/ })
	).toHaveCount(0);
	await expect(
		page.getByRole("heading", { name: "Judging Rubric" })
	).toBeVisible();
	await expect(page.getByRole("heading", { name: "Team Scores" })).toHaveCount(
		0
	);
});

test("assigned team sees its room, time slot and meeting link", async ({
	authenticatedPage: page,
	authUser,
	setSettings
}) => {
	const teams = new TeamFixtureTracker();
	const [round] = await db
		.insert(judgingRounds)
		.values({
			name: "E2E Round",
			startTime: new Date("2099-06-15T18:00:00Z"),
			endTime: new Date("2099-06-15T20:00:00Z")
		})
		.returning();
	if (!round) throw new Error("Failed to create a judging round");

	try {
		const team = await teams.create("Judged");
		await db.insert(member).values({
			id: crypto.randomUUID(),
			organizationId: team.id,
			userId: authUser.id,
			role: "owner",
			createdAt: new Date()
		});
		const [room] = await db
			.insert(judgingRooms)
			.values({ roundId: round.id, roomLink: "https://meet.example.com/e2e" })
			.returning();
		if (!room) throw new Error("Failed to create a judging room");
		await db.insert(judgingAssignments).values({
			teamId: team.id,
			roomId: room.id,
			timeSlot: new Date("2099-06-15T18:30:00Z")
		});
		await setSettings({
			currentRoundId: round.id,
			judgingPhase: "judging",
			timeZone: "America/Edmonton"
		});

		await page.goto("/participant/judging");

		const banner = page
			.getByRole("heading", {
				name: "E2E Round: your team’s judging assignment"
			})
			.locator("xpath=../..");
		await expect(banner).toContainText("Room 1");
		await expect(banner).toContainText("12:30 PM");
		await expect(
			page.getByRole("link", { name: "Join meeting" })
		).toHaveAttribute("href", "https://meet.example.com/e2e");
	} finally {
		await setSettings({ currentRoundId: null });
		await db.delete(judgingRounds).where(eq(judgingRounds.id, round.id));
		await teams.cleanup();
	}
});
