# Judge score ownership

For an existing database, apply `judge-score-ownership.sql` once before deploying
this branch. It runs in a transaction. Do not run it after `db:push` has already
added the column/index; choose the explicit migration for existing data.
For a fresh database, use the normal `pnpm db:push` and seed workflow.

Existing scores retain their IDs, values, assignments, and timestamps. Their
`judge_id` remains null because the original author was not recorded. Admin
score/assignment reads retain these records for reconciliation; judge views and
aggregates exclude them. Do not copy a legacy score to every judge or infer its
author from current room membership. Resolve attribution from an authoritative
record before including historical scores in individual results.

The migration sets main criterion maximums to 10; existing score values are not
rescaled. Review legacy criteria/scoring ranges before deployment. Sidepot ranges
are unchanged. Judge deletion is restricted while attributed scores exist.

New writes use the authenticated user's ID and require room assignment, including
for admins acting as judges. Admins can inspect all records but cannot impersonate
another judge through score creation/update. `getJudgeTotals` returns sums per
assignment/judge plus the main criterion count; these are saved totals, not a
finalized leaderboard. Draft/final submission state and cross-judge ranking policy
are deferred to the scoring-flow work.
