import { sql } from "drizzle-orm";
import {
	judgingAssignments,
	judgingCriteria,
	judgingScores,
	judgingTables
} from "@/server/db/judging-schema";

/** Only complete scorecards contribute to published averages.
 * Every scorecard has equal weight, regardless of the team's panel size.
 * A scorecard is complete once it covers every criterion that applies to its
 * round; criteria with no round_ids apply to every round.
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
  HAVING COUNT(*) = (
      SELECT COUNT(*) FROM ${judgingCriteria} rc
      WHERE cardinality(rc.round_ids) = 0 OR t.round_id = ANY(rc.round_ids)
    )
    AND BOOL_AND(s.value >= CASE WHEN c.is_sidepot THEN 0 ELSE 1 END AND s.value <= c.max_score)
)`;
