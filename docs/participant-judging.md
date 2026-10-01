# Participant judging information

Route: `/participant/judging`. This ticket adds the detailed phase timeline, round
filtering, shared rubric presentation variant, criteria-to-round mapping, and
participant-safe released results. Its diff against the schedule branch contains
only judging changes.

It reuses the current-event banner, submission countdown, event/settings data,
participant shell, and loading/error state introduced by dashboard and extended by
schedule. The banner uses the participant team's actual assigned round/time/room/meeting
link when available.

Apply `pnpm db:push`, or apply `drizzle/participant-judging.sql` for the additive
criteria mapping after the dashboard event/settings schema. Existing criteria remain
shared across all rounds; administrators can assign specific rounds. The judge scoring
UI and API honor the same mapping.

Judging status follows the configured phase and current round. Team scores are hidden
until `winners_announced`, including on the server. The results query resolves the
signed-in user's own team and returns criterion averages without judge identities
or internal prescreening notes. No public comments are fabricated: the current score
schema does not store feedback.

Review against `HMTV2-106-participant-schedule-page` until schedule merges, then rebase
and retarget onto `main`. Dashboard must merge before schedule, and schedule before judging.

Checks: `pnpm typecheck` and `pnpm exec vitest run --project ui`.
Live database validation requires a running database and the two additive schema updates.

Figma: https://www.figma.com/design/mWhAsdu1jwChcFiuUvI4vj/Prototypes?node-id=240-7380
