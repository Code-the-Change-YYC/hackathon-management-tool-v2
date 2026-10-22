# Critical workflow test plan — six developers

Prepared 15 October 2026 for [hackathon-management-tool-v2](https://github.com/Code-the-Change-YYC/hackathon-management-tool-v2). Code baseline: [`main` at `8fcf384`](https://github.com/Code-the-Change-YYC/hackathon-management-tool-v2/tree/8fcf384c4f4656f8e85f21f19f2038f9a6db599f). This is a proposed test specification, not a test execution report. The reviewed commit has not been proven to be the commit deployed to production.

The plan adds **42 scenario definitions, seven per developer, expanding to 79 execution cases**, focused on public visitors, participants, and judges. Work is grouped by ownership of fixtures and code, rather than treating every scenario as equal effort. No new admin-only workflow tests are included; admin actions are setup when their effects reach participants or judges.

## Assignment and execution order

| Owner | Workstream | Scenario IDs | Main test method |
|---|---|---|---|
| Developer 1 | Public information and verification | PUB01–PUB07 | Browser, verification API, public load |
| Developer 2 | Account access and onboarding recovery | ACC01–ACC07 | Browser with real sessions; controlled OAuth |
| Developer 3 | Participant team integrity | TEAM01–TEAM07 | PostgreSQL integration, one full-team browser case |
| Developer 4 | Participant operations and profile | PART01–PART07 | Browser refresh/failure cases; concurrent meal check-in |
| Developer 5 | Judge scoring workspace | JUDGE01–JUDGE07 | Real score-form browser journeys |
| Developer 6 | Score integrity and participant results | SCORE01–SCORE07 | PostgreSQL/API integration and mixed load |

`@P0` means registration, access, attendance, or score integrity can be materially broken. Run these first. `@P1` covers recovery, discoverability, usability, and traffic resilience. All scenarios start as **Not run**. Mark each executed Outline row separately as Pass, Fail, or Blocked, with browser/build, fixture IDs, actual result, and evidence.

Suggested sequence: establish existing-suite baseline; implement each workstream's new P0 scenarios; execute the P1 cases; Developer 2 provides the account/role fixtures, Developer 3 the team fixtures, and Developer 6 the judging fixture pack. Developer 4 owns timer/connectivity helpers and Developer 5 score-form page objects. Each developer owns only their listed assertions; share setup rather than copying scenarios.

## Code risks and test interpretation


2. **Sidepot completion differs between views:** `isAssignmentScored` permits main-criteria completion without sidepots, but `JudgeScorePage` requires every applicable criterion, including sidepots, before submission. JUDGE02 documents the current form contract; it does not add another test of the already-covered helper rule. The team should settle which behavior is intended before using that test as a permanent acceptance contract.
3. **Alternate score write:** `scores.createMany` checks room membership and maximum scores. At this revision, `scores.update` checks the judge role but has no corresponding room-membership or maximum-score check. SCORE02 is an expected-failure regression candidate, not a claim that the restriction already works. No exploit was executed.
4. **Shared judge scores:** the unique key is `(assignmentId, criteriaId)` with no judge ID. SCORE04 tests complete-batch integrity under that shared-score model. Independent per-judge scoring and conflict warnings would require a separate product/data-model decision; the plan does not invent those behaviors.
5. **Other follow-ups outside the firm acceptance contract:** score cards disable future unscored slots, while direct score URLs and `createMany` lack the same time check; judge meeting links do not use the participant safe-URL helper; Resources contains placeholder mentors and repeated resource cards. These are code observations to triage, not confirmed production failures. Do not turn unspecified timing, cross-judge read visibility, or per-judge scoring policy into assumed acceptance criteria.

## New scenarios by developer

### Developer 1 — Public site and verification

Homepage information, entry points, repeated signup, email verification recovery, and public traffic.

Code references: [src/app/actions.ts](https://github.com/Code-the-Change-YYC/hackathon-management-tool-v2/blob/8fcf384c4f4656f8e85f21f19f2038f9a6db599f/src/app/actions.ts#L24); [src/app/components/landing-page/JudgingCriteria.tsx](https://github.com/Code-the-Change-YYC/hackathon-management-tool-v2/blob/8fcf384c4f4656f8e85f21f19f2038f9a6db599f/src/app/components/landing-page/JudgingCriteria.tsx#L5); [src/app/page.tsx](https://github.com/Code-the-Change-YYC/hackathon-management-tool-v2/blob/8fcf384c4f4656f8e85f21f19f2038f9a6db599f/src/app/page.tsx#L16); [src/app/components/auth/VerifyEmailForm.tsx](https://github.com/Code-the-Change-YYC/hackathon-management-tool-v2/blob/8fcf384c4f4656f8e85f21f19f2038f9a6db599f/src/app/components/auth/VerifyEmailForm.tsx#L27); [src/server/better-auth/config.ts](https://github.com/Code-the-Change-YYC/hackathon-management-tool-v2/blob/8fcf384c4f4656f8e85f21f19f2038f9a6db599f/src/server/better-auth/config.ts).

### Developer 2 — Account access and onboarding recovery

Real OAuth callbacks, unverified sign-in, new judge invitations, failed onboarding saves, route guards, logout, and session expiry.

Code references: [src/app/components/auth/GoogleSignInButton.tsx](https://github.com/Code-the-Change-YYC/hackathon-management-tool-v2/blob/8fcf384c4f4656f8e85f21f19f2038f9a6db599f/src/app/components/auth/GoogleSignInButton.tsx#L49); [src/app/components/auth/LoginForm.tsx](https://github.com/Code-the-Change-YYC/hackathon-management-tool-v2/blob/8fcf384c4f4656f8e85f21f19f2038f9a6db599f/src/app/components/auth/LoginForm.tsx#L30); [src/server/api/routers/invitations.ts](https://github.com/Code-the-Change-YYC/hackathon-management-tool-v2/blob/8fcf384c4f4656f8e85f21f19f2038f9a6db599f/src/server/api/routers/invitations.ts#L85); [src/app/components/onboarding/CompleteRegistrationButton.tsx](https://github.com/Code-the-Change-YYC/hackathon-management-tool-v2/blob/8fcf384c4f4656f8e85f21f19f2038f9a6db599f/src/app/components/onboarding/CompleteRegistrationButton.tsx#L10); [src/app/(auth)/onboarding/team/team-guards.ts](https://github.com/Code-the-Change-YYC/hackathon-management-tool-v2/blob/8fcf384c4f4656f8e85f21f19f2038f9a6db599f/src/app/%28auth%29/onboarding/team/team-guards.ts#L9); [src/app/components/sidebar/SidebarUserMenu.tsx](https://github.com/Code-the-Change-YYC/hackathon-management-tool-v2/blob/8fcf384c4f4656f8e85f21f19f2038f9a6db599f/src/app/components/sidebar/SidebarUserMenu.tsx#L34).

### Developer 3 — Participant team integrity

Capacity, simultaneous membership changes, server-side ownership enforcement, and transaction rollback.

Code references: [src/server/api/routers/teams.ts](https://github.com/Code-the-Change-YYC/hackathon-management-tool-v2/blob/8fcf384c4f4656f8e85f21f19f2038f9a6db599f/src/server/api/routers/teams.ts#L334); [src/server/api/routers/teams.ts](https://github.com/Code-the-Change-YYC/hackathon-management-tool-v2/blob/8fcf384c4f4656f8e85f21f19f2038f9a6db599f/src/server/api/routers/teams.ts#L393); [src/server/api/routers/teams.ts](https://github.com/Code-the-Change-YYC/hackathon-management-tool-v2/blob/8fcf384c4f4656f8e85f21f19f2038f9a6db599f/src/server/api/routers/teams.ts#L595); [src/server/api/routers/teams.ts](https://github.com/Code-the-Change-YYC/hackathon-management-tool-v2/blob/8fcf384c4f4656f8e85f21f19f2038f9a6db599f/src/server/api/routers/teams.ts#L637); [src/app/components/participant/team/TeamView.tsx](https://github.com/Code-the-Change-YYC/hackathon-management-tool-v2/blob/8fcf384c4f4656f8e85f21f19f2038f9a6db599f/src/app/components/participant/team/TeamView.tsx).

### Developer 4 — Participant event operations and profile

Live server updates, offline recovery, resource access, profile persistence, and concurrent meal redemption.

Code references: [src/app/components/participant/AutoRefresh.tsx](https://github.com/Code-the-Change-YYC/hackathon-management-tool-v2/blob/8fcf384c4f4656f8e85f21f19f2038f9a6db599f/src/app/components/participant/AutoRefresh.tsx#L6); [src/server/api/routers/judging-assignments.ts](https://github.com/Code-the-Change-YYC/hackathon-management-tool-v2/blob/8fcf384c4f4656f8e85f21f19f2038f9a6db599f/src/server/api/routers/judging-assignments.ts#L166); [src/app/participant/resources/page.tsx](https://github.com/Code-the-Change-YYC/hackathon-management-tool-v2/blob/8fcf384c4f4656f8e85f21f19f2038f9a6db599f/src/app/participant/resources/page.tsx); [src/app/participant/layout.tsx](https://github.com/Code-the-Change-YYC/hackathon-management-tool-v2/blob/8fcf384c4f4656f8e85f21f19f2038f9a6db599f/src/app/participant/layout.tsx); [src/app/components/participant/profile/PersonalInformationForm.tsx](https://github.com/Code-the-Change-YYC/hackathon-management-tool-v2/blob/8fcf384c4f4656f8e85f21f19f2038f9a6db599f/src/app/components/participant/profile/PersonalInformationForm.tsx#L38); [src/app/components/participant/profile/AvatarPicker.tsx](https://github.com/Code-the-Change-YYC/hackathon-management-tool-v2/blob/8fcf384c4f4656f8e85f21f19f2038f9a6db599f/src/app/components/participant/profile/AvatarPicker.tsx#L33); [src/server/api/routers/events.ts](https://github.com/Code-the-Change-YYC/hackathon-management-tool-v2/blob/8fcf384c4f4656f8e85f21f19f2038f9a6db599f/src/server/api/routers/events.ts#L232).

### Developer 5 — Judge scoring workspace

Score form navigation, submission, edits, slow responses, failures, unsaved work, and small-screen access.

Code references: [src/app/components/judges/JudgeScorePage.tsx](https://github.com/Code-the-Change-YYC/hackathon-management-tool-v2/blob/8fcf384c4f4656f8e85f21f19f2038f9a6db599f/src/app/components/judges/JudgeScorePage.tsx#L644); [src/app/components/judges/useJudgePortalData.ts](https://github.com/Code-the-Change-YYC/hackathon-management-tool-v2/blob/8fcf384c4f4656f8e85f21f19f2038f9a6db599f/src/app/components/judges/useJudgePortalData.ts); [src/app/components/judges/JudgeDashboardPage.tsx](https://github.com/Code-the-Change-YYC/hackathon-management-tool-v2/blob/8fcf384c4f4656f8e85f21f19f2038f9a6db599f/src/app/components/judges/JudgeDashboardPage.tsx); [src/app/components/judges/JudgeSchedulePage.tsx](https://github.com/Code-the-Change-YYC/hackathon-management-tool-v2/blob/8fcf384c4f4656f8e85f21f19f2038f9a6db599f/src/app/components/judges/JudgeSchedulePage.tsx).

### Developer 6 — Score integrity, access, and released results

Uncovered API validation, alternate-write authorization, replay safety, shared-score races, real aggregation, role boundaries, and mixed traffic.

Code references: [src/server/api/routers/scores.ts](https://github.com/Code-the-Change-YYC/hackathon-management-tool-v2/blob/8fcf384c4f4656f8e85f21f19f2038f9a6db599f/src/server/api/routers/scores.ts#L194); [src/server/api/routers/scores.ts](https://github.com/Code-the-Change-YYC/hackathon-management-tool-v2/blob/8fcf384c4f4656f8e85f21f19f2038f9a6db599f/src/server/api/routers/scores.ts#L313); [src/server/api/routers/scores.ts](https://github.com/Code-the-Change-YYC/hackathon-management-tool-v2/blob/8fcf384c4f4656f8e85f21f19f2038f9a6db599f/src/server/api/routers/scores.ts#L24); [src/server/db/scores-schema.ts](https://github.com/Code-the-Change-YYC/hackathon-management-tool-v2/blob/8fcf384c4f4656f8e85f21f19f2038f9a6db599f/src/server/db/scores-schema.ts#L42); [src/server/api/trpc.ts](https://github.com/Code-the-Change-YYC/hackathon-management-tool-v2/blob/8fcf384c4f4656f8e85f21f19f2038f9a6db599f/src/server/api/trpc.ts); [src/app/judge/layout.tsx](https://github.com/Code-the-Change-YYC/hackathon-management-tool-v2/blob/8fcf384c4f4656f8e85f21f19f2038f9a6db599f/src/app/judge/layout.tsx).


