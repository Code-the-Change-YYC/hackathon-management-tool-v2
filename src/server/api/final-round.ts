import { eq } from "drizzle-orm";
import { type FinalRoundTiming, getFinalistStartTime } from "@/lib/judging";
import type { DbClient } from "@/server/api/routers/judging-tables";
import { judgingAssignments } from "@/server/db/judging-schema";

// Finalists present back to back in the given order, from the round's start.
export async function scheduleFinalists(
	db: DbClient,
	tableId: string,
	teamIds: string[],
	timing: FinalRoundTiming
) {
	await db
		.delete(judgingAssignments)
		.where(eq(judgingAssignments.tableId, tableId));
	if (teamIds.length === 0) return;
	await db.insert(judgingAssignments).values(
		teamIds.map((teamId, index) => ({
			teamId,
			tableId,
			startsAt: getFinalistStartTime(timing, index)
		}))
	);
}
