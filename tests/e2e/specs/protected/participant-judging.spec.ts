import { eq } from "drizzle-orm";
import { db } from "@/server/db";
import { member, organization } from "@/server/db/auth-schema";
import {
	judgingAssignments,
	judgingCriteria,
	judgingRounds,
	judgingScores,
	judgingTables
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
			kind: "panel",
			startTime: new Date("2099-06-15T18:00:00Z"),
			endTime: new Date("2099-06-15T20:00:00Z"),
			publishedAt: new Date(),
			presentationMinutes: 6,
			changeoverMinutes: 2
		})
		.returning();
	const [criterion] = await db
		.insert(judgingCriteria)
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
		await db
			.delete(judgingCriteria)
			.where(eq(judgingCriteria.id, criterion.id));
		await judge.cleanup();
		await teams.cleanup();
	};

	const team = await teams.create("Judged");
	await db
		.update(organization)
		.set({ prescreenStatus: "passed" })
		.where(eq(organization.id, team.id));
	await db.insert(member).values({
		id: crypto.randomUUID(),
		organizationId: team.id,
		userId: user.id,
		role: "owner",
		createdAt: new Date()
	});
	const tables = await db
		.insert(judgingTables)
		.values([1, 2].map((tableNumber) => ({ roundId: round.id, tableNumber })))
		.returning();
	const [assignment] = await db
		.insert(judgingAssignments)
		.values(
			tables.map((table, index) => ({
				teamId: team.id,
				tableId: table.id,
				startsAt: new Date(Date.UTC(2099, 5, 15, 18, 30 + index * 8))
			}))
		)
		.returning();
	if (!assignment) throw new Error("Failed to create a judging assignment");
	// Published averages only count a judge's complete scorecard, so score every
	// criterion.
	const criteria = await db.query.judgingCriteria.findMany();
	await db.insert(judgingScores).values(
		criteria.map((item) => ({
			assignmentId: assignment.id,
			criteriaId: item.id,
			judgeId: judge.user.id,
			value: item.id === criterion.id ? 4 : item.isSidepot ? 0 : 1
		}))
	);

	return { cleanup, criterion, round };
}

test("participant without a team is asked to join one", async ({
	authenticatedPage: page
}) => {
	await page.goto("/participant/judging");

	await expect(
		page.getByRole("heading", { name: "Judging", exact: true })
	).toBeVisible();
	await expect(page.getByText("You’re not on a team yet")).toBeVisible();
	await expect(page.getByText(/your presentations/)).toHaveCount(0);
	await expect(
		page.getByRole("heading", { name: "Judging Rubric" })
	).toBeVisible();
});

test("assigned team sees its tables, times and when to arrive", async ({
	authenticatedPage: page,
	authUser
}) => {
	const { cleanup } = await assignTeam(authUser);
	try {
		await page.goto("/participant/judging");

		await expect(page.getByText("Passed pre-screening")).toBeVisible();
		await expect(page.getByText("E2E Round: your presentations")).toBeVisible();
		await expect(
			page.getByText(
				"Arrive by 12:20 PM. Present at Table 1 at 12:30 PM, then Table 2 at 12:38 PM."
			)
		).toBeVisible();
	} finally {
		await cleanup();
	}
});

test(
	"scores stay hidden until released, then replace the rubric",
	{ tag: "@responsive" },
	async ({ authenticatedPage: page, authUser, setSettings }) => {
		const { cleanup, criterion } = await assignTeam(authUser);
		const scoreTrigger = page
			.getByRole("region", { name: "Your Scores" })
			.getByRole("button", { name: new RegExp(criterion.name) });
		try {
			await setSettings({ scoresReleased: false });
			await page.goto("/participant/judging");
			await expect(
				page.getByRole("heading", { name: "Judging Rubric" })
			).toBeVisible();
			await expect(
				page.getByRole("heading", { name: "Your Scores" })
			).toHaveCount(0);
			await expect(page.getByText("4 / 5")).toHaveCount(0);

			await setSettings({ scoresReleased: true });
			await page.reload();
			await expect(scoreTrigger).toContainText("4 / 5");
			await expect(
				page.getByRole("heading", { name: "Judging Rubric" })
			).toHaveCount(0);
		} finally {
			await cleanup();
		}
	}
);
