import assert from "node:assert/strict";
import { eq } from "drizzle-orm";
import { describe, expect, it, vi } from "vitest";
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

// Released scores can't change, and the shared test database may be in any
// judging phase.
vi.mock("@/server/api/participant-judging", async (importOriginal) => ({
	...(await importOriginal<
		typeof import("@/server/api/participant-judging")
	>()),
	areScoresReleased: () => false
}));

describe("judge score ownership in PostgreSQL", () => {
	it("keeps two judges' scores independent across writes", async () => {
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
				endTime: new Date(Date.now() + 60_000),
				publishedAt: new Date()
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
				maxScore: 5
			});
			assert(assignment);
			const assignmentId = assignment.id;
			// A scorecard covers every criterion, including any already in the database.
			const otherCriteria = (await db.query.judgingCriteria.findMany()).filter(
				(criterion) => criterion.id !== criterionId
			);
			const submit = (score: number) => [
				{ assignmentId, criteriaId: criterionId, score },
				...otherCriteria.map((criterion) => ({
					assignmentId,
					criteriaId: criterion.id,
					score: 1
				}))
			];
			await judgeA.caller.scores.createMany(submit(2));
			await judgeB.caller.scores.createMany(submit(4));
			await judgeA.caller.scores.createMany(submit(3));
			const rows = await db
				.select()
				.from(judgingScores)
				.where(eq(judgingScores.assignmentId, assignmentId));
			expect(rows).toHaveLength(2 * (otherCriteria.length + 1));
			const testScoreFor = (judgeId: string) =>
				rows.find(
					(row) => row.judgeId === judgeId && row.criteriaId === criterionId
				)?.value;
			expect(testScoreFor(judgeA.user.id)).toBe(3);
			expect(testScoreFor(judgeB.user.id)).toBe(4);
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
