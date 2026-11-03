import assert from "node:assert/strict";
import { eq } from "drizzle-orm";
import { describe, expect, it, onTestFinished } from "vitest";
import { db } from "@/server/db";
import { organization } from "@/server/db/auth-schema";
import {
	judgingAssignments,
	judgingCriteria,
	judgingRounds,
	judgingScores,
	judgingTables
} from "@/server/db/judging-schema";
import { Role } from "@/types/types";
import { assertE2EDatabaseSafety } from "../../e2e/db";
import { createAuthenticatedCaller } from "../helpers/auth";

const lockedMessage =
	"Judges have started scoring, so criteria can’t be added, removed, or rescored.";

describe("rubric lock once judges score", () => {
	it("blocks adding, removing, and rescoring criteria but allows renaming", async () => {
		assertE2EDatabaseSafety();
		const admin = await createAuthenticatedCaller({ role: Role.ADMIN });
		const judge = await createAuthenticatedCaller({ role: Role.JUDGE });
		const roundId = crypto.randomUUID();
		const teamId = crypto.randomUUID();
		const scoredId = crypto.randomUUID();
		const sidepotId = crypto.randomUUID();
		onTestFinished(async () => {
			await db.delete(judgingRounds).where(eq(judgingRounds.id, roundId));
			await db.delete(judgingCriteria).where(eq(judgingCriteria.id, scoredId));
			await db.delete(judgingCriteria).where(eq(judgingCriteria.id, sidepotId));
			await db.delete(organization).where(eq(organization.id, teamId));
			await judge.cleanup();
			await admin.cleanup();
		});

		await db.insert(judgingRounds).values({
			id: roundId,
			name: "Rubric lock test",
			kind: "panel",
			startTime: new Date(),
			endTime: new Date(Date.now() + 60_000)
		});
		await db.insert(organization).values({
			id: teamId,
			name: "Rubric lock test team",
			slug: `rubric-lock-test-${teamId}`,
			createdAt: new Date()
		});
		await db.insert(judgingCriteria).values([
			{ id: scoredId, name: "Technical", maxScore: 5 },
			{ id: sidepotId, name: "Best UI", maxScore: 10, isSidepot: true }
		]);
		const [table] = await db
			.insert(judgingTables)
			.values({ roundId, tableNumber: 1 })
			.returning();
		assert(table);
		const [assignment] = await db
			.insert(judgingAssignments)
			.values({ tableId: table.id, teamId, startsAt: new Date() })
			.returning();
		assert(assignment);
		await db.insert(judgingScores).values({
			assignmentId: assignment.id,
			criteriaId: scoredId,
			judgeId: judge.user.id,
			value: 3
		});

		await expect(
			admin.caller.criteria.create({ name: "Pitch Delivery" })
		).rejects.toThrow(lockedMessage);
		await expect(
			admin.caller.criteria.delete({ id: sidepotId })
		).rejects.toThrow(lockedMessage);
		await expect(
			admin.caller.criteria.update({ id: sidepotId, maxScore: 3 })
		).rejects.toThrow(lockedMessage);
		await expect(
			admin.caller.criteria.update({ id: sidepotId, isSidepot: false })
		).rejects.toThrow(lockedMessage);

		const renamed = await admin.caller.criteria.update({
			id: sidepotId,
			name: "Best Interface",
			description: "Polish",
			displayOrder: 9,
			maxScore: 10,
			isSidepot: true
		});
		expect(renamed).toMatchObject({
			name: "Best Interface",
			displayOrder: 9,
			maxScore: 10,
			isSidepot: true
		});
		expect(
			await db.query.judgingCriteria.findFirst({
				where: eq(judgingCriteria.id, sidepotId)
			})
		).toBeDefined();
	});
});
