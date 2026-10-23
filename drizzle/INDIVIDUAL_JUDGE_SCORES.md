# Individual judge scorecards

Each submitted score belongs to the authenticated judge, assignment, and
criterion. Submitting again updates that judge's scorecard without changing
another judge's assessment. Judges receive only their own scores.

Every scorecard must answer the entire shared rubric, including an explicit zero
where appropriate for a side pot. A single database statement saves the complete
scorecard. Unfinished drafts remain on the judge's device, scoped to their account
and assignment, for up to seven days. Drafts are never included in results.

## Averages

- A complete scorecard contributes its sum of main criterion scores.
- Organizer rankings average those totals across submitted scorecards and rounds.
  Rounds have no additional weighting. More judges do not increase a team's score.
- Side pots are excluded from the main ranking. Released participant results show
  each criterion's average per round, with a separate main total.
- Only complete, attributed scorecards with valid score ranges contribute.
- Organizer results show submitted versus expected scorecards. An average is
  provisional while assigned judges still have outstanding scorecards.
- Participants receive results only in the `winners_announced` phase.

For example, two judges giving main totals of 12 and 18 produce an average of 15,
not 30. A side-pot score does not change that main average.

## Existing databases

Apply `0002_individual_judge_scores.sql` once before deploying this code against
an existing database. It adds `judge_id` and replaces the old assignment-wide
unique index with the judge-specific index. The repository also supports schema
pushes through `pnpm db:push`; review the proposed changes before applying them.
The focused SQL migration avoids unrelated schema changes.

With `DATABASE_URL` already configured in the shell and PostgreSQL's client
installed, the focused migration can be applied atomically with:

```sh
psql "$DATABASE_URL" --single-transaction --file=drizzle/0002_individual_judge_scores.sql
```

Historical panel scores have no recorded judge. The migration preserves those
rows with a null `judge_id`; it does not invent an author or copy a panel score
to every judge. They remain visible to administrators as legacy records and are
excluded from the new averages. Judges must submit their individual scorecards.
Do not reset or reseed an existing event to perform this migration.

The new seed logic supplies each score's judge ID for fresh development data.

## Verification

```sh
pnpm typecheck
pnpm exec vitest run
RUN_JUDGING_DB_TESTS=1 pnpm exec vitest run tests/vitest/integration/judge-scoring-postgres.test.ts
```

The opt-in PostgreSQL test requires a local database with the existing application
tables. It creates temporary fixtures, applies the migration to the temporary
score table, and exercises the real scoring, assignment, ranking, and release
queries. It leaves the existing database schema and event data unchanged.
