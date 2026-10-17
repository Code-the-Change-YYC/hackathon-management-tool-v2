---
name: audit
description: Audit an app or one area of it (a page, feature, flow, directory, or branch diff) for bugs, missing states, edge-case inputs, security holes, and broken or inconsistent UI at every screen size, then deliver an HTML report of every issue ordered by severity. Use when the user runs /audit or asks to audit, QA, bug-bash, or stress-test something.
argument-hint: "[scope, e.g. checkout flow, /settings, mobile only]"
---

Audit $ARGUMENTS (or the whole project if empty) like a meticulous QA
engineer, senior engineer, and product designer in one. Find everything
that is broken, wrong, fragile, or awkward.

Don't fix anything. Don't trigger real side effects: no real emails,
payments, or production writes. Use test data and test accounts.

Read the code behind every screen, flow, and endpoint in scope, then
actually use the app. Try every state (loading, empty, many items, long
content, errors, no permission) and every class of input (empty, huge,
unicode, markup, boundaries). Check every screen at phone, tablet, and
desktop widths, in light and dark mode.

Only report issues you can prove, either reproduced in the app or pinned
to specific code. Rate each one Critical, High, Medium, or Low and number
them (C1, H1, M1, L1) so I can say "fix H2".

Deliver a polished HTML report with steps to reproduce, screenshots or
code for each issue, and a suggested fix. Then give me the counts by
severity and the top issues in one line each.
