# Individual judge score upgrade

Fresh databases use the current schema through `pnpm db:push`.

For an existing database with shared scores (no `judge_id` column and the old `one_score_per_criteria_per_assignment` index), `0002_individual_judge_scores.sql` upgrades score ownership. Run this legacy upgrade once, before applying the current schema with `db:push`:

```sh
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 --single-transaction \
  -f drizzle/0002_individual_judge_scores.sql
```

Existing rows retain their IDs and values with `judge_id = NULL`; the upgrade does not invent authorship. Current score queries exclude those unattributed rows from submitted judge scorecards. New rows reference a real user, and uniqueness is enforced per assignment, criterion and judge. Deleting a judge with attributed scores is restricted.

This SQL targets the legacy schema and is not an initialization script for databases already created from the current schema. The existing opt-in `judge-scoring-postgres.test.ts` exercises the upgrade in temporary tables on a local test database, including legacy preservation, independent writes, retries and result averages:

```sh
RUN_JUDGING_DB_TESTS=1 pnpm test:int \
  tests/vitest/integration/judge-scoring-postgres.test.ts
```
