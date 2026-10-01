# Participant schedule

Route: `/participant/schedule`. This ticket adds the full event timeline, date grouping,
category presentation, timeline assets, purple banner variant, and schedule tests.
It reuses the dashboard ticket's event banner, event metadata and queries, clock,
participant shell, and loading/error state. Its diff against the dashboard branch
contains only schedule changes.

All published event categories are displayed, including completed events. Dates and
times use the configured participant time zone, and ongoing rows update on the shared
30-second clock. The existing meal-only schedule retains its default presentation.

Review against `HMTV2-107-participant-dashboard-page` until dashboard merges, then
rebase and retarget onto `main`. Judging builds on this branch as the next ticket.

Checks: `pnpm typecheck` and `pnpm exec vitest run --project ui`.

Figma: https://www.figma.com/design/mWhAsdu1jwChcFiuUvI4vj/Prototypes?node-id=6-3
