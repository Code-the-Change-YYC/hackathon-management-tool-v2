# Shared participant foundation

This change provides the common event banner, submission countdown, compact judging status,
loading/error state, event metadata, clock, and responsive participant shell. It does not
replace the dashboard, schedule, or judging routes.

Apply the schema using `pnpm db:push`, or use `drizzle/participant-events.sql` for only
the five additive columns. Set the submission deadline, participant time zone, judging
phase, and active judging round in `/admin`. Event location and optional HTTP(S) directions
links can be configured in `/admin/schedule`.

Published events are selected deterministically: the earliest-started ongoing event,
with an exclusive end boundary, followed by up to three chronological upcoming events.
The countdown uses the configured deadline and clamps at zero. Judging phase comes from
settings, rather than elapsed wall-clock time. Missing events retain basic banner copy.

The independent dashboard (HMTV2-107), schedule (HMTV2-106), and judging (HMTV2-109)
changes each build on this foundation, without including a sibling page implementation.
The foundation must merge into `main` before those page PRs target `main`.

Checks: `pnpm typecheck` and `pnpm exec vitest run --project ui`.
