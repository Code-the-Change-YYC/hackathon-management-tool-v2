# Testing epic HMTV2-49

Each testing ticket has its own branch and pull request. Existing Playwright and Vitest suites are extended rather than introducing a second Cucumber runner. The feature files remain the acceptance specifications.

The shared `tests/e2e/fixtures/judging.fixture.ts` creates an authenticated judge's assigned team, started slot, two main criteria and two sidepots. It removes its own rounds, criteria and team during teardown. The fixture smoke test verifies the real scorecard route. Scoring and responsive-test branches build on this epic branch so the fixture has one owner.

Run integration and browser tests only against a local test database. Browser fixtures enforce the database safety checks in `tests/e2e/db.ts`; disable real email delivery for local runs. Record test commands, commit and results in each PR.

Integration files run serially because they share singleton hackathon settings and the published rubric. Concurrency regressions still release competing authenticated requests together within a test. Merge this test foundation before combining the ticket PRs. UI and unit files retain their normal parallel execution.

ACC03 remains pending the judge-account creation decision. Older shared-score and discard-on-leave assumptions must be reconciled with the current independent scorecards and persisted drafts. The PR descriptions distinguish implemented regressions from remaining product scope.
