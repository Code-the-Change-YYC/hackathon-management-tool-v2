import assert from "node:assert/strict";
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { db } from "@/server/db";
import { organization } from "@/server/db/auth-schema";
import {
	judgingAssignments,
	judgingRoomStaff,
	judgingRooms,
	judgingRounds
} from "@/server/db/schema";
import { criteria, scores } from "@/server/db/scores-schema";
import { Role } from "@/types/types";
import { assertE2EDatabaseSafety } from "../../e2e/db";
import { createAuthenticatedCaller } from "../helpers/auth";

describe("judge score ownership in PostgreSQL", () => {
	it("keeps two judges' scores independent across writes, reads, and totals", async () => {
		assertE2EDatabaseSafety();
		const judgeA = await createAuthenticatedCaller({ role: Role.JUDGE });
		let judgeB:
			| Awaited<ReturnType<typeof createAuthenticatedCaller>>
			| undefined;
		const roundId = crypto.randomUUID();
		const teamId = crypto.randomUUID();
		const criterionId = crypto.randomUUID();
		try {
			judgeB = await createAuthenticatedCaller({ role: Role.JUDGE });
			await db.insert(judgingRounds).values({
				id: roundId,
				name: "Score ownership test",
				startTime: new Date(),
				endTime: new Date(Date.now() + 60_000)
			});
			await db.insert(organization).values({
				id: teamId,
				name: "Score ownership test team",
				slug: `score-test-${teamId}`,
				createdAt: new Date()
			});
			const [room] = await db
				.insert(judgingRooms)
				.values({
					roundId,
					roomLink: "https://example.com/judging"
				})
				.returning();
			assert(room);
			await db.insert(judgingRoomStaff).values([
				{ roomId: room.id, staffId: judgeA.user.id },
				{ roomId: room.id, staffId: judgeB.user.id }
			]);
			const [assignment] = await db
				.insert(judgingAssignments)
				.values({
					roomId: room.id,
					teamId
				})
				.returning();
			await db.insert(criteria).values({
				id: criterionId,
				name: "Technical",
				maxScore: 10,
				roundIds: [roundId]
			});
			assert(assignment);
			const assignmentId = assignment.id;
			await db
				.insert(scores)
				.values({ assignmentId, criteriaId: criterionId, value: 10 });
			const submit = (score: number) => [
				{ assignmentId, criteriaId: criterionId, score }
			];
			await judgeA.caller.scores.createMany(submit(7));
			await judgeB.caller.scores.createMany(submit(9));
			await judgeA.caller.scores.createMany(submit(8));
			const aScores = await judgeA.caller.scores.getByAssignment({
				assignmentId
			});
			const bScores = await judgeB.caller.scores.getByAssignment({
				assignmentId
			});
			expect(aScores).toMatchObject([{ judgeId: judgeA.user.id, value: 8 }]);
			expect(aScores).toHaveLength(1);
			expect(bScores).toMatchObject([{ judgeId: judgeB.user.id, value: 9 }]);
			expect(bScores).toHaveLength(1);
			expect(
				await judgeA.caller.scores.getJudgeTotals({ roundId })
			).toMatchObject([
				{ judgeId: judgeA.user.id, mainTotal: 8, mainCriteriaScored: 1 }
			]);
			expect(
				await judgeB.caller.scores.getJudgeTotals({ roundId })
			).toMatchObject([
				{ judgeId: judgeB.user.id, mainTotal: 9, mainCriteriaScored: 1 }
			]);
			assert(aScores[0]);
			await expect(
				judgeB.caller.scores.update({ id: aScores[0].id, score: 4 })
			).rejects.toMatchObject({ code: "NOT_FOUND" });
			expect(
				await db
					.select()
					.from(scores)
					.where(eq(scores.assignmentId, assignmentId))
			).toHaveLength(3);
		} finally {
			await db.delete(judgingRounds).where(eq(judgingRounds.id, roundId));
			await db.delete(criteria).where(eq(criteria.id, criterionId));
			await db.delete(organization).where(eq(organization.id, teamId));
			await judgeB?.cleanup();
			await judgeA.cleanup();
		}
	});
});
