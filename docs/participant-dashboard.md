# Participant dashboard

Route: `/participant`. This ticket implements the personalized welcome, current-event
banner, up to three upcoming events, submission countdown, and compact judging status.
It introduces the event metadata, event/settings queries, loading/error state, clock,
banner assets, and responsive participant shell that the dashboard needs. Schedule and
judging reuse these components in their later tickets.

Start the configured database and apply `pnpm db:push`, or use
`drizzle/participant-events.sql` for the five additive columns. Configure the submission
deadline, participant time zone, judging phase, and active judging round in `/admin`.
Event locations and optional HTTP(S) directions links are configurable in `/admin/schedule`.

Published events are selected deterministically: the earliest-started ongoing event,
with an exclusive end boundary, followed by up to three chronological upcoming events.
Events and settings refresh every 30 seconds and on focus. The countdown uses the
configured deadline and clamps at zero; judging status uses the configured phase.
Missing data has explicit empty states and basic banner copy. Schedule and judging
links use their existing routes; their page implementations are separate tickets.

The local stack is dashboard (HMTV2-107) -> schedule (HMTV2-106) -> judging (HMTV2-109).
Review dashboard against `main`, schedule against dashboard, and judging against schedule.
Merge in that order, rebasing and retargeting each remaining PR onto `main` when its
preceding ticket lands. There is no separate foundation PR in this stack.

Checks: `pnpm typecheck` and `pnpm exec vitest run --project ui`.

Figma: https://www.figma.com/design/mWhAsdu1jwChcFiuUvI4vj/Prototypes?node-id=245-8119
