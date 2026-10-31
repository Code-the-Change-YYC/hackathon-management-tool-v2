import { eq, inArray } from "drizzle-orm";
import { db } from "@/server/db";
import {
	judgingAssignments,
	judgingRoomStaff,
	judgingRooms,
	judgingRounds
} from "@/server/db/schema";
import { criteria } from "@/server/db/scores-schema";
import { TeamFixtureTracker } from "../../utils/teams";
import { test as base, expect } from "./settings.fixture";

type JudgingFixture = {
	assignmentId: string;
	roundId: string;
	teamId: string;
	teamName: string;
	criteria: (typeof criteria.$inferSelect)[];
};

export const test = base.extend<{ judgingFixture: JudgingFixture }>({
	judgingFixture: async ({ authUser }, use) => {
		const teams = new TeamFixtureTracker();
		const roundId = crypto.randomUUID();
		const assignmentId = crypto.randomUUID();
		const criterionIds = Array.from({ length: 4 }, () => crypto.randomUUID());
		try {
			const team = await teams.create("Judge browser fixture");
			const now = Date.now();
			await db
				.insert(judgingRounds)
				.values({
					id: roundId,
					name: "Browser judging round",
					startTime: new Date(now - 3_600_000),
					endTime: new Date(now + 3_600_000)
				});
			const [room] = await db
				.insert(judgingRooms)
				.values({ roundId, roomLink: "https://example.com/judging" })
				.returning();
			if (!room) throw new Error("Judging room fixture missing");
			await db
				.insert(judgingRoomStaff)
				.values({ roomId: room.id, staffId: authUser.id });
			await db
				.insert(judgingAssignments)
				.values({
					id: assignmentId,
					roomId: room.id,
					teamId: team.id,
					timeSlot: new Date(now - 60_000)
				});
			await db
				.insert(criteria)
				.values(
					criterionIds.map((id, index) => ({
						id,
						name: `Browser criterion ${index + 1}: a detailed description of innovation and community impact`,
						description:
							"Evaluate the team's evidence, execution and measurable impact.",
						displayOrder: index,
						maxScore: index < 2 ? 10 : 5,
						isSidepot: index >= 2
					}))
				);
			const rubric = await db.query.criteria.findMany({
				orderBy: (rows, { asc }) => [asc(rows.displayOrder), asc(rows.name)]
			});
			await use({
				assignmentId,
				roundId,
				teamId: team.id,
				teamName: team.name,
				criteria: rubric
			});
		} finally {
			await db.delete(judgingRounds).where(eq(judgingRounds.id, roundId));
			await db.delete(criteria).where(inArray(criteria.id, criterionIds));
			await teams.cleanup();
		}
	}
});

export { expect };
