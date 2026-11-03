import { asc, eq, sql } from "drizzle-orm";
import type { JudgingPhase } from "@/lib/judging";
import type { TeamJudging, TeamJudgingRound } from "@/lib/participant-judging";
import {
	submittedBallots,
	submittedScorecards
} from "@/server/api/judging-results";
import type { db as dbType } from "@/server/db";
import {
	judgingAssignments,
	judgingCriteria,
	judgingTableJudges,
	judgingTables
} from "@/server/db/judging-schema";

type DbClient = typeof dbType;

// Participants only see scores once winners are announced.
export function areScoresReleased(
	settings: { judgingPhase: JudgingPhase } | null | undefined
) {
	return settings?.judgingPhase === "winners_announced";
}

export async function getParticipantCriteria(db: DbClient) {
	return db
		.select()
		.from(judgingCriteria)
		.orderBy(asc(judgingCriteria.displayOrder), asc(judgingCriteria.name));
}

// The team's presentations in published rounds, grouped by round in start order.
export async function getTeamSchedule(
	db: DbClient,
	teamId: string
): Promise<TeamJudging> {
	const assignments = await db.query.judgingAssignments.findMany({
		where: eq(judgingAssignments.teamId, teamId),
		columns: { id: true, startsAt: true },
		with: {
			table: {
				columns: { tableNumber: true },
				with: {
					round: {
						columns: {
							id: true,
							name: true,
							kind: true,
							startTime: true,
							presentationMinutes: true,
							publishedAt: true
						}
					}
				}
			}
		},
		orderBy: (rows, { asc }) => [asc(rows.startsAt)]
	});

	const rounds = new Map<string, TeamJudgingRound>();
	for (const assignment of assignments) {
		const { round } = assignment.table;
		if (!round.publishedAt) continue;
		const entry = rounds.get(round.id) ?? { round, assignments: [] };
		entry.assignments.push({
			id: assignment.id,
			tableNumber: assignment.table.tableNumber,
			startsAt: assignment.startsAt
		});
		rounds.set(round.id, entry);
	}
	return [...rounds.values()].sort(
		(a, b) => a.round.startTime.getTime() - b.round.startTime.getTime()
	);
}

type AssignmentScoring = {
	assignmentId: string;
	roundId: string;
	scored: boolean;
};

// A panel assignment is scored once every judge at its table has submitted a
// complete scorecard for it. A finalist is scored once every judge at the
// final table has submitted a ballot.
export async function getAssignmentScoring(db: DbClient, teamId?: string) {
	return (await db.execute(sql`
    SELECT a.id AS "assignmentId", t.round_id AS "roundId",
      COUNT(j.judge_id) > 0
        AND COUNT(j.judge_id) = COUNT(COALESCE(card.judge_id, ballot.judge_id)) AS "scored"
    FROM ${judgingAssignments} a
    INNER JOIN ${judgingTables} t ON t.id = a.table_id
    LEFT JOIN ${judgingTableJudges} j ON j.table_id = a.table_id
    LEFT JOIN ${submittedScorecards} card
      ON card.assignment_id = a.id AND card.judge_id = j.judge_id
    LEFT JOIN ${submittedBallots} ballot
      ON ballot.table_id = a.table_id AND ballot.judge_id = j.judge_id
    ${teamId ? sql`WHERE a.team_id = ${teamId}` : sql.empty()}
    GROUP BY a.id, t.round_id
  `)) as unknown as AssignmentScoring[];
}
