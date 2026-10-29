import assert from "node:assert/strict";
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { db } from "@/server/db";
import { organization } from "@/server/db/auth-schema";
import {
	judgingAssignments,
	judgingCriteria,
	judgingRounds,
	judgingScores,
	judgingTableJudges,
	judgingTables
} from "@/server/db/judging-schema";
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
				kind: "panel",
				startTime: new Date(),
				endTime: new Date(Date.now() + 60_000)
			});
			await db.insert(organization).values({
				id: teamId,
				name: "Score ownership test team",
				slug: `score-test-${teamId}`,
				createdAt: new Date()
			});
			const [table] = await db
				.insert(judgingTables)
				.values({ roundId, tableNumber: 1 })
				.returning();
			assert(table);
			await db.insert(judgingTableJudges).values([
				{ tableId: table.id, judgeId: judgeA.user.id },
				{ tableId: table.id, judgeId: judgeB.user.id }
			]);
			const [assignment] = await db
				.insert(judgingAssignments)
				.values({
					tableId: table.id,
					teamId,
					startsAt: new Date()
				})
				.returning();
			await db.insert(judgingCriteria).values({
				id: criterionId,
				name: "Technical",
				maxScore: 5,
				roundIds: [roundId]
			});
			assert(assignment);
			const assignmentId = assignment.id;
			const submit = (score: number) => [
				{ assignmentId, criteriaId: criterionId, score }
			];
			await judgeA.caller.scores.createMany(submit(2));
			await judgeB.caller.scores.createMany(submit(4));
			await judgeA.caller.scores.createMany(submit(3));
			const aScores = await judgeA.caller.scores.getByAssignment({
				assignmentId
			});
			const bScores = await judgeB.caller.scores.getByAssignment({
				assignmentId
			});
			expect(aScores).toMatchObject([{ judgeId: judgeA.user.id, value: 3 }]);
			expect(aScores).toHaveLength(1);
			expect(bScores).toMatchObject([{ judgeId: judgeB.user.id, value: 4 }]);
			expect(bScores).toHaveLength(1);
			expect(
				await judgeA.caller.scores.getJudgeTotals({ roundId })
			).toMatchObject([
				{ judgeId: judgeA.user.id, mainTotal: 3, mainCriteriaScored: 1 }
			]);
			expect(
				await judgeB.caller.scores.getJudgeTotals({ roundId })
			).toMatchObject([
				{ judgeId: judgeB.user.id, mainTotal: 4, mainCriteriaScored: 1 }
			]);
			assert(aScores[0]);
			await expect(
				judgeB.caller.scores.update({ id: aScores[0].id, score: 1 })
			).rejects.toMatchObject({ code: "NOT_FOUND" });
			expect(
				await db
					.select()
					.from(judgingScores)
					.where(eq(judgingScores.assignmentId, assignmentId))
			).toHaveLength(2);
		} finally {
			await db.delete(judgingRounds).where(eq(judgingRounds.id, roundId));
			await db
				.delete(judgingCriteria)
				.where(eq(judgingCriteria.id, criterionId));
			await db.delete(organization).where(eq(organization.id, teamId));
			await judgeB?.cleanup();
			await judgeA.cleanup();
		}
	});
});
