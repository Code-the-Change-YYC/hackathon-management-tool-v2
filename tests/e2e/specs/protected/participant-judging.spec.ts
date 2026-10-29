import { eq } from "drizzle-orm";
import { db } from "@/server/db";
import { member } from "@/server/db/auth-schema";
import {
	criteria,
	judgingAssignments,
	judgingRooms,
	judgingRounds,
	scores
} from "@/server/db/judging-schema";
import type { User } from "@/types/types";
import { Role } from "@/types/types";
import { createTestUser } from "../../../utils/auth";
import { TeamFixtureTracker } from "../../../utils/teams";
import { expect, test } from "../../fixtures/settings.fixture";

test.use({
	authUserOptions: { name: "Judging Participant", role: Role.PARTICIPANT }
});

async function assignTeam(user: User) {
	const teams = new TeamFixtureTracker();
	const [round] = await db
		.insert(judgingRounds)
		.values({
			name: "E2E Round",
			startTime: new Date("2099-06-15T18:00:00Z"),
			endTime: new Date("2099-06-15T20:00:00Z")
		})
		.returning();
	const [criterion] = await db
		.insert(criteria)
		.values({
			name: `E2E Impact ${crypto.randomUUID().slice(0, 8)}`,
			maxScore: 5
		})
		.returning();
	if (!round || !criterion) throw new Error("Failed to create judging data");
	const judge = await createTestUser({ name: "E2E Judge", role: Role.JUDGE });
	const cleanup = async () => {
		// Deleting the round cascades to the judge's scores, which block deleting the judge.
		await db.delete(judgingRounds).where(eq(judgingRounds.id, round.id));
		await db.delete(criteria).where(eq(criteria.id, criterion.id));
		await judge.cleanup();
		await teams.cleanup();
	};

	const team = await teams.create("Judged");
	await db.insert(member).values({
		id: crypto.randomUUID(),
		organizationId: team.id,
		userId: user.id,
		role: "owner",
		createdAt: new Date()
	});
	const [room] = await db
		.insert(judgingRooms)
		.values({ roundId: round.id, roomLink: "https://meet.example.com/e2e" })
		.returning();
	if (!room) throw new Error("Failed to create a judging room");
	const [assignment] = await db
		.insert(judgingAssignments)
		.values({
			teamId: team.id,
			roomId: room.id,
			timeSlot: new Date("2099-06-15T18:30:00Z")
		})
		.returning();
	if (!assignment) throw new Error("Failed to create a judging assignment");
	// Published averages only count a judge's complete scorecard, so score every criterion.
	const allCriteria = await db.query.criteria.findMany();
	await db.insert(scores).values(
		allCriteria.map((item) => ({
			assignmentId: assignment.id,
			criteriaId: item.id,
			judgeId: judge.user.id,
			value: item.id === criterion.id ? 4 : item.isSidepot ? 0 : 1
		}))
	);

	return { cleanup, criterion, round };
}

test("participant without an assignment sees the general banner", async ({
	authenticatedPage: page,
	setSettings
}) => {
	await setSettings({ currentRoundId: null, judgingPhase: "not_started" });
	await page.goto("/participant/judging");

	await expect(
		page.getByRole("heading", { name: "Judging", exact: true })
	).toBeVisible();
	await expect(
		page.getByRole("heading", { name: /your team’s judging assignment/ })
	).toHaveCount(0);
	await expect(
		page.getByRole("heading", { name: "Judging Rubric" })
	).toBeVisible();
});

test("assigned team sees its room, time slot and meeting link", async ({
	authenticatedPage: page,
	authUser,
	setSettings
}) => {
	const { cleanup, round } = await assignTeam(authUser);
	try {
		await setSettings({
			currentRoundId: round.id,
			judgingPhase: "judging"
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
		await cleanup();
	}
});

test(
	"scores stay hidden until winners are announced",
	{ tag: "@responsive" },
	async ({ authenticatedPage: page, authUser, setSettings }) => {
		const { cleanup, criterion, round } = await assignTeam(authUser);
		const scoreTrigger = page
			.getByRole("region", { name: "Team Scores" })
			.getByRole("button", { name: new RegExp(criterion.name) });
		try {
			await setSettings({ currentRoundId: round.id, judgingPhase: "review" });
			await page.goto("/participant/judging");
			await expect(
				page.getByRole("heading", { name: "Judging Rubric" })
			).toBeVisible();
			await expect(
				page.getByRole("heading", { name: "Team Scores" })
			).toHaveCount(0);
			await expect(page.getByText("4 / 5")).toHaveCount(0);

			await setSettings({ judgingPhase: "winners_announced" });
			await page.reload();
			await expect(scoreTrigger).toContainText("4 / 5");
		} finally {
			await setSettings({ currentRoundId: null });
			await cleanup();
		}
	}
);
