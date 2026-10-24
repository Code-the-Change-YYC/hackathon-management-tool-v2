---
name: pr-description
description: Write a short, clear PR description for the changes on the current branch and output it as a copyable markdown block. Use when the user asks for a PR description, PR summary, or PR body.
allowed-tools: Bash(git:*), Bash(gh pr view:*), Read, Grep, Glob
---

Write a pull request description for the changes on the current branch. Output it only. Do not create, edit, or comment on anything on GitHub, and do not change any files.

## 1. Gather the changes

- Find the base branch: if `gh pr view --json baseRefName,title,body` returns a PR for this branch, use its base. Otherwise use the repo's default branch (`git symbolic-ref refs/remotes/origin/HEAD`, falling back to `main`).
- Read `git log --oneline <base>..HEAD`, `git diff <base>...HEAD --stat`, and `git diff <base>...HEAD`. Open files where the diff alone doesn't explain what a change does.
- If there are uncommitted changes, ignore them in the description but mention them in one line after the block.

Describe what the branch does as a whole, not the commit history. Skip intermediate steps that were later undone.

$ARGUMENTS

## 2. Write it

Structure:

1. **Summary**: one or two plain sentences on what the change is and why, with no heading. Mention scope limits that matter to a reviewer (for example "UI only" or "uses mock data").
2. **`## Changes`**: a bullet list grouped by user-facing feature or area, not by file. Each bullet starts with a short bold label, then an em dash and one line. Name components, routes, or functions in backticks when that helps a reviewer find them. Fold small related tweaks into one bullet.
3. **`## Notes`**: anything a reviewer should know that isn't a change: stubs and TODOs, mocked data, known gaps, follow-ups, migrations or env vars, risky spots. Leave this section out if there is nothing worth saying.

Style:

- Plain, direct language. Present tense ("Adds", "Moves"), no filler, no marketing tone.
- Keep it short. Aim for 3–8 bullets under Changes. Leave out trivial noise such as formatting, lockfile churn, and renamed imports unless that is the point of the PR.
- Don't add a title, testing checklist, screenshots placeholder, or attribution line.

## 3. Output

Output the description inside a single fenced code block tagged `markdown` and opened with four backticks, so it is easy to copy and inline code survives. Add nothing before the block. After it, add at most one short line, only if something needs flagging (for example uncommitted changes or a guessed base branch).

## Example

````markdown
Adds the new admin Registered Users page (/admin/participants) with a reusable admin sidebar. This is UI only. The page uses mock data for now.

## Changes

- **Registered Users page** — table of participants with name, email, role, team, institution, major, and food registration.
- **Toolbar** — search, filter (role / institution / major / food), sort, and export (copy all emails, download CSV). Active filters show as removable chips.
- **Dialogs** — invite a user, send an email, edit a participant, and confirm deletion.
- **Admin sidebar** — collapsible navigation for the admin section, with the current page highlighted.
- **Reusable `PageHeader` component** for page titles and descriptions.
- **New shadcn UI primitives** — sidebar, sheet, popover, alert-dialog, input-group, empty, spinner, plus small tweaks to badge and table styles and the accent color tokens.

## Notes

- Participants come from a `MOCK_PARTICIPANTS` array. Invite, email, edit, delete, and CSV export are stubbed with `TODO`s until the users router exists.
- The page is not yet role-guarded (`requireRole([Role.ADMIN])` is a `TODO`).
````
