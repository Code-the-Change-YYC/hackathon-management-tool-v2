import { sql } from "drizzle-orm";

/** Only complete, attributed scorecards contribute to published averages.
 * Every scorecard has equal weight, regardless of the team's panel size.
 * The event uses one shared rubric across all rounds.
 */
export const submittedScorecards = sql`(
  SELECT a.id AS assignment_id, a.team_id, r.round_id, s.judge_id,
    SUM(CASE WHEN c.is_sidepot = false THEN s.value ELSE 0 END)::float8 AS main_score,
    SUM(CASE WHEN c.is_sidepot = true THEN s.value ELSE 0 END)::float8 AS sidepot_score
  FROM hackathon_score s
  INNER JOIN hackathon_judging_assignment a ON a.id = s.assignment_id
  INNER JOIN hackathon_judging_room r ON r.id = a.room_id
  INNER JOIN hackathon_criteria c ON c.id = s.criteria_id
  WHERE s.judge_id IS NOT NULL
  GROUP BY a.id, a.team_id, r.round_id, s.judge_id
  HAVING COUNT(*) = (SELECT COUNT(*) FROM hackathon_criteria)
    AND BOOL_AND(s.value >= CASE WHEN c.is_sidepot THEN 0 ELSE 1 END AND s.value <= c.max_score)
)`;
