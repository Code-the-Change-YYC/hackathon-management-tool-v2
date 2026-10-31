# Testing epic HMTV2-49

Each testing ticket has its own branch and pull request. Existing Playwright and Vitest suites are extended rather than introducing a second Cucumber runner. The feature files remain the acceptance specifications.

The shared `tests/e2e/fixtures/judging.fixture.ts` creates an authenticated judge's assigned team, started slot, two main criteria and two sidepots. It removes its own rounds, criteria and team during teardown. The fixture smoke test verifies the real scorecard route. Scoring and responsive-test branches build on this epic branch so the fixture has one owner.

Run integration and browser tests only against a local test database. Browser fixtures enforce the database safety checks in `tests/e2e/db.ts`; disable real email delivery for local runs. Record test commands, commit and results in each PR.

Integration files run serially because they share singleton hackathon settings and the published rubric. Concurrency regressions still release competing authenticated requests together within a test. Merge this test foundation before combining the ticket PRs. UI and unit files retain their normal parallel execution.

ACC03 remains pending the judge-account creation decision. Older shared-score and discard-on-leave assumptions must be reconciled with the current independent scorecards and persisted drafts. The PR descriptions distinguish implemented regressions from remaining product scope.

## Branch and PR index

There are separate PRs for all 18 child/subtask tickets, the two additional coverage tickets linked from the epic, and this shared foundation (21 PRs total). Merge HMTV2-49 first; retarget its four dependent PRs to main after the foundation merges.

| Ticket | PR | Branch | Base |
| --- | --- | --- | --- |
| [HMTV2-49](https://codethechangeyyc.atlassian.net/browse/HMTV2-49) | [#161](https://github.com/Code-the-Change-YYC/hackathon-management-tool-v2/pull/161) | `HMTV2-49-testing` | `main` |
| [HMTV2-50](https://codethechangeyyc.atlassian.net/browse/HMTV2-50) | [#149](https://github.com/Code-the-Change-YYC/hackathon-management-tool-v2/pull/149) | `HMTV2-50-judge-invite-testing` | `main` |
| [HMTV2-51](https://codethechangeyyc.atlassian.net/browse/HMTV2-51) | [#156](https://github.com/Code-the-Change-YYC/hackathon-management-tool-v2/pull/156) | `HMTV2-51-devpost-submission-testing` | `main` |
| [HMTV2-52](https://codethechangeyyc.atlassian.net/browse/HMTV2-52) | [#150](https://github.com/Code-the-Change-YYC/hackathon-management-tool-v2/pull/150) | `HMTV2-52-invite-management-testing` | `main` |
| [HMTV2-53](https://codethechangeyyc.atlassian.net/browse/HMTV2-53) | [#165](https://github.com/Code-the-Change-YYC/hackathon-management-tool-v2/pull/165) | `HMTV2-53-round-progression-testing` | `main` |
| [HMTV2-54](https://codethechangeyyc.atlassian.net/browse/HMTV2-54) | [#163](https://github.com/Code-the-Change-YYC/hackathon-management-tool-v2/pull/163) | `HMTV2-54-responsive-scoring-testing` | `HMTV2-49-testing` |
| [HMTV2-55](https://codethechangeyyc.atlassian.net/browse/HMTV2-55) | [#158](https://github.com/Code-the-Change-YYC/hackathon-management-tool-v2/pull/158) | `HMTV2-55-admin-scheduling-testing` | `main` |
| [HMTV2-56](https://codethechangeyyc.atlassian.net/browse/HMTV2-56) | [#154](https://github.com/Code-the-Change-YYC/hackathon-management-tool-v2/pull/154) | `HMTV2-56-public-criteria-testing` | `main` |
| [HMTV2-57](https://codethechangeyyc.atlassian.net/browse/HMTV2-57) | [#157](https://github.com/Code-the-Change-YYC/hackathon-management-tool-v2/pull/157) | `HMTV2-57-prescreening-testing` | `main` |
| [HMTV2-58](https://codethechangeyyc.atlassian.net/browse/HMTV2-58) | [#152](https://github.com/Code-the-Change-YYC/hackathon-management-tool-v2/pull/152) | `HMTV2-58-food-ticket-management-testing` | `main` |
| [HMTV2-59](https://codethechangeyyc.atlassian.net/browse/HMTV2-59) | [#166](https://github.com/Code-the-Change-YYC/hackathon-management-tool-v2/pull/166) | `HMTV2-59-multi-round-workflow-testing` | `HMTV2-49-testing` |
| [HMTV2-60](https://codethechangeyyc.atlassian.net/browse/HMTV2-60) | [#162](https://github.com/Code-the-Change-YYC/hackathon-management-tool-v2/pull/162) | `HMTV2-60-judge-scoring-testing` | `HMTV2-49-testing` |
| [HMTV2-61](https://codethechangeyyc.atlassian.net/browse/HMTV2-61) | [#159](https://github.com/Code-the-Change-YYC/hackathon-management-tool-v2/pull/159) | `HMTV2-61-admin-portal-testing` | `main` |
| [HMTV2-62](https://codethechangeyyc.atlassian.net/browse/HMTV2-62) | [#148](https://github.com/Code-the-Change-YYC/hackathon-management-tool-v2/pull/148) | `HMTV2-62-participant-team-testing` | `main` |
| [HMTV2-63](https://codethechangeyyc.atlassian.net/browse/HMTV2-63) | [#160](https://github.com/Code-the-Change-YYC/hackathon-management-tool-v2/pull/160) | `HMTV2-63-judge-portal-testing` | `main` |
| [HMTV2-64](https://codethechangeyyc.atlassian.net/browse/HMTV2-64) | [#155](https://github.com/Code-the-Change-YYC/hackathon-management-tool-v2/pull/155) | `HMTV2-64-email-verification-testing` | `main` |
| [HMTV2-65](https://codethechangeyyc.atlassian.net/browse/HMTV2-65) | [#164](https://github.com/Code-the-Change-YYC/hackathon-management-tool-v2/pull/164) | `HMTV2-65-participant-live-updates-testing` | `main` |
| [HMTV2-79](https://codethechangeyyc.atlassian.net/browse/HMTV2-79) | [#151](https://github.com/Code-the-Change-YYC/hackathon-management-tool-v2/pull/151) | `HMTV2-79-concurrent-meal-scanning-testing` | `main` |
| [HMTV2-80](https://codethechangeyyc.atlassian.net/browse/HMTV2-80) | [#153](https://github.com/Code-the-Change-YYC/hackathon-management-tool-v2/pull/153) | `HMTV2-80-meal-info-recovery-testing` | `main` |
| [HMTV2-111](https://codethechangeyyc.atlassian.net/browse/HMTV2-111) | [#167](https://github.com/Code-the-Change-YYC/hackathon-management-tool-v2/pull/167) | `HMTV2-111-profile-recovery-testing` | `main` |
| [HMTV2-152](https://codethechangeyyc.atlassian.net/browse/HMTV2-152) | [#168](https://github.com/Code-the-Change-YYC/hackathon-management-tool-v2/pull/168) | `HMTV2-152-score-integrity-testing` | `HMTV2-49-testing` |

## Validation

The branches were combined in an isolated verification worktree without merging into main. On Node 24, the complete Vitest suite reports **261 passed, 1 skipped**. TypeScript and Biome checks pass; Biome reports four existing warnings in `ParticipantsToolbar.tsx`. All ticket-specific tests passed individually. The targeted browser runs used the normal project dev server. The combined browser suite reports **120 passed**. After fixing the FAQ anchor offset, all three affected Chromium/mobile public-rubric cases pass again with the stronger heading-visibility assertion. The previously skipped migration test also passes when opted in, using the restored SQL and temporary legacy tables. The production build passes with webpack, which is used in the temporary checkout because Turbopack rejects its shared dependency symlink.

## Remaining product and manual QA scope

- ACC03: judge account creation and invite auto-login remain pending a team decision. The security boundary is tested without choosing a new account flow.
- The participant Devpost editor/prompt, invite-token expiration and invitation-management UI are not supplied by these testing PRs. The Devpost status API, resend API and prescreen link requirement are tested.
- Advancement/rejection/reminder notification delivery is not implemented by the current product. Round state, assignment refresh, score preservation and controlled release are tested separately.
- The former JUDGE04 competing client-score-fetch race belongs to the earlier score-page architecture; current saved scores come from the protected server page. Draft recovery and stale-draft protection have their own tests.
- Figma comparison, production homepage cache verification and physical-device camera QA are not claimed by local functional checks.
