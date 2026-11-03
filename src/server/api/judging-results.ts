import { sql } from "drizzle-orm";
import type { PanelScorecard } from "@/lib/judging-ranking";
import type { DbClient } from "@/server/api/routers/judging-tables";
import { organization } from "@/server/db/auth-schema";
import {
	judgingAssignments,
	judgingCriteria,
	judgingScores,
	judgingTables,
	judgingVotes
} from "@/server/db/judging-schema";

/** Only complete scorecards contribute to published averages.
 * Every scorecard has equal weight, regardless of the team's panel size.
 * A scorecard is complete once it covers every criterion.
 */
export const submittedScorecards = sql`(
  SELECT a.id AS assignment_id, a.team_id, t.round_id, s.judge_id,
    SUM(CASE WHEN c.is_sidepot = false THEN s.value ELSE 0 END)::float8 AS main_score,
    SUM(CASE WHEN c.is_sidepot = true THEN s.value ELSE 0 END)::float8 AS sidepot_score
  FROM ${judgingScores} s
  INNER JOIN ${judgingAssignments} a ON a.id = s.assignment_id
  INNER JOIN ${judgingTables} t ON t.id = a.table_id
  INNER JOIN ${judgingCriteria} c ON c.id = s.criteria_id
  GROUP BY a.id, a.team_id, t.round_id, s.judge_id
  HAVING COUNT(*) = (SELECT COUNT(*) FROM ${judgingCriteria})
    AND BOOL_AND(s.value >= CASE WHEN c.is_sidepot THEN 0 ELSE 1 END AND s.value <= c.max_score)
)`;

// The judges at each final table who have submitted a ballot.
export const submittedBallots = sql`(
  SELECT DISTINCT a.table_id, v.judge_id
  FROM ${judgingVotes} v
  INNER JOIN ${judgingAssignments} a ON a.id = v.assignment_id
)`;

// Each complete panel scorecard's main total, for normalizing per judge.
// A team that failed pre-screening after presenting is left out entirely, as
// if it never presented, so it doesn't sway judges' normalization either.
export async function getPanelScorecards(db: DbClient, roundId: string) {
	return (await db.execute(sql`
    SELECT card.team_id AS "teamId", card.judge_id AS "judgeId", card.main_score AS "score"
    FROM ${submittedScorecards} card
    INNER JOIN ${organization} o ON o.id = card.team_id
    WHERE card.round_id = ${roundId} AND o.prescreen_status <> 'failed'
  `)) as unknown as PanelScorecard[];
}
