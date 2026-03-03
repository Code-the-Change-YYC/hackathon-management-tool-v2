# Hackathon Admin Panel — User Stories

---

## Epic 1: Hackathon Settings

**As an admin, I want to configure the hackathon's global settings so that the platform reflects the real event schedule and state.**

### User Stories

**US-01 — Set Event Dates**
> As an admin, I want to set the hackathon start and end date so that participants and judges know when the event is active.
- Acceptance: Admin can update `startDate` and `endDate` in settings
- Acceptance: Dates are validated (start must be before end)

**US-02 — Toggle Hackathon Active State**
> As an admin, I want to activate or deactivate the hackathon so that I can control when participants can access the platform.
- Acceptance: Admin can flip `isActive` on or off
- Acceptance: When inactive, non-admin users see a holding page

**US-03 — Set Active Judging Round**
> As an admin, I want to set the currently active judging round so that the scoring views reflect the correct round.
- Acceptance: Admin can select any existing round to set as `currentRoundId`
- Acceptance: Setting is persisted to the singleton settings row (id = 1)

---

## Epic 2: Criteria & Sidepot Management

**As an admin, I want to manage judging criteria so that teams are evaluated on the correct categories.**

### User Stories

**US-04 — Add Criteria**
> As an admin, I want to add a new judging criteria with a name and max score so that judges know what to evaluate.
- Acceptance: Admin can create a criteria with `name` and `maxScore`
- Acceptance: New criteria appears in the scoring UI immediately

**US-05 — Edit Criteria**
> As an admin, I want to edit a criteria's name and max score so that I can correct mistakes before judging begins.
- Acceptance: Admin can update `name` and `maxScore` on any criteria
- Acceptance: Warning shown if scores already exist for this criteria

**US-06 — Toggle Sidepot**
> As an admin, I want to mark a criteria as a sidepot so that it is tracked and displayed separately from the main competition scores.
- Acceptance: Admin can toggle `isSidepot` on any criteria
- Acceptance: Sidepot criteria are visually distinct in the scoring and rankings UI

**US-07 — Delete Criteria**
> As an admin, I want to delete a criteria so that I can remove categories that are no longer needed.
- Acceptance: Admin is warned if scores exist for the criteria before deletion
- Acceptance: Deletion cascades and removes all associated scores
- Note: Once judging is live, prefer archiving over hard deletion

---

## Epic 3: User Management

**As an admin, I want to manage user accounts so that I have full oversight and control over who is on the platform.**

### User Stories

**US-08 — View All Users**
> As an admin, I want to see a list of all users with their roles so that I have a clear picture of who is on the platform.
- Acceptance: Table shows `name`, `email`, `role`, `banned`, `completedRegistration`

**US-09 — Change User Role**
> As an admin, I want to change a user's role so that I can fix misassignments or promote participants to judges.
- Acceptance: Admin can set role to `participant`, `judge`, or `admin`
- Acceptance: If a judge is demoted, their `judging_room_staff` rows are cleaned up automatically

**US-10 — Ban a User**
> As an admin, I want to ban a user with a reason and optional expiry so that bad actors are blocked from the platform.
- Acceptance: Admin can set `banned = true`, `banReason`, and optional `banExpires`
- Acceptance: Banned users cannot log in or access the platform

**US-11 — Delete a Specific User**
> As an admin, I want to delete a specific user account so that I can remove invalid or test accounts.
- Acceptance: Deletion cascades to `sessions`, `accounts`, `members`
- Acceptance: Confirmation required before deletion

**US-12 — Bulk Delete All Users**
> As an admin, I want to delete all users at once so that I can wipe test data before a real event.
- Acceptance: Scoped to non-admin accounts by default
- Acceptance: Double confirmation required (destructive action)

---

## Epic 4: Room Management

**As an admin, I want to manage judging rooms so that teams and judges are properly organized during the event.**

### User Stories

**US-13 — Create a Judging Room**
> As an admin, I want to create a judging room for a round with a meeting link so that judges and teams know where to go.
- Acceptance: Admin can create a room with a `roomLink` and associate it to a `judgingRound`

**US-14 — Assign a Judge to a Room**
> As an admin, I want to assign a judge as staff to a room so that each room has a designated evaluator.
- Acceptance: Admin can add a user to `judging_room_staff` for a given room
- Acceptance: Duplicate assignments are prevented (unique constraint on `roomId + staffId`)

**US-15 — Assign a Team to a Room**
> As an admin, I want to assign a team to a room so that judging assignments are structured and trackable.
- Acceptance: Admin can create a `judging_assignment` linking a team to a room
- Acceptance: Optional `timeSlot` can be set per assignment

**US-16 — Remove a Judge or Team from a Room**
> As an admin, I want to remove a judge or team from a room so that I can correct assignment mistakes.
- Acceptance: Removing a team from a room warns that associated scores will be deleted

---

## Epic 5: Reset Controls

**As an admin, I want scoped reset controls so that I can clean up specific parts of the platform without accidentally wiping everything.**

### User Stories

**US-17 — Reset Rooms Only**
> As an admin, I want to reset all rooms so that I can restructure judging assignments without affecting user accounts.
- Acceptance: Wipes `judging_room`, `judging_room_staff`, `judging_assignment`
- Acceptance: ⚠️ Warning shown: this also cascades and deletes all scores
- Acceptance: Confirmation modal required

**US-18 — Reset Scores Only**
> As an admin, I want to reset only scores so that judging can restart without losing the room structure.
- Acceptance: Wipes `hackathon_score` only
- Acceptance: Rooms, assignments, and users are untouched
- Acceptance: Confirmation modal required

**US-19 — Reset Judging Entirely**
> As an admin, I want to reset all judging data so that I can start a fresh judging round from scratch.
- Acceptance: Wipes `judging_round`, `judging_room`, `judging_room_staff`, `judging_assignment`, `hackathon_score`
- Acceptance: Confirmation modal required with explicit list of what will be deleted

**US-20 — Delete All Users**
> As an admin, I want to delete all non-admin users so that I can reset the participant list between events.
- Acceptance: Cascades to `sessions`, `accounts`, `members`, `invitations`
- Acceptance: Admin accounts are preserved by default
- Acceptance: Double confirmation required

**US-21 — Full Clean Slate**
> As an admin, I want to fully reset the platform to a clean state so that I can reuse it for a new hackathon event.
- Acceptance: Wipes all of the above
- Acceptance: Resets `hackathon_settings` to defaults
- Acceptance: Requires typing a confirmation phrase (e.g. "RESET") before executing

---

## Epic 6: Audit Log *(Recommended — not yet in schema)*

**As an admin, I want a log of all admin actions so that I can trace who changed what and when.**

### User Stories

**US-22 — View Audit Log**
> As an admin, I want to see a chronological log of all admin actions so that I have accountability and traceability.
- Acceptance: Log shows `adminName`, `action`, `timestamp`, and any relevant metadata
- Acceptance: Filterable by action type and date range

**US-23 — Log Destructive Actions**
> As an admin, I want all reset and delete actions to be logged automatically so that accidental changes can be investigated.
- Acceptance: Every reset action writes a record to `hackathon_admin_log`
- Acceptance: Log entries are immutable (no delete on log table)

---

---

# Feature Summary

| # | Feature | Epic | Risk |
|---|---|---|---|
| US-01 | Set event dates | Settings | Low |
| US-02 | Toggle hackathon active state | Settings | Low |
| US-03 | Set active judging round | Settings | Low |
| US-04 | Add judging criteria | Criteria | Low |
| US-05 | Edit criteria name/max score | Criteria | Medium |
| US-06 | Toggle sidepot flag | Criteria | Low |
| US-07 | Delete criteria | Criteria | High — cascades scores |
| US-08 | View all users | Users | Low |
| US-09 | Change user role | Users | Medium — requires room staff cleanup |
| US-10 | Ban a user | Users | Low |
| US-11 | Delete a specific user | Users | Medium |
| US-12 | Bulk delete all users | Users | High |
| US-13 | Create a judging room | Rooms | Low |
| US-14 | Assign judge to room | Rooms | Low |
| US-15 | Assign team to room | Rooms | Low |
| US-16 | Remove judge/team from room | Rooms | Medium — cascades scores |
| US-17 | Reset rooms only | Resets | High — cascades scores |
| US-18 | Reset scores only | Resets | High |
| US-19 | Reset judging entirely | Resets | High |
| US-20 | Delete all users | Resets | High |
| US-21 | Full clean slate | Resets | Critical |
| US-22 | View audit log | Audit | Low |
| US-23 | Log destructive actions | Audit | Low |

---

### Key Technical Constraints to Keep in Mind

- **Settings is a singleton** — always `UPDATE` where `id = 1`, never `INSERT` a second row
- **Rooms → Scores are tightly coupled** — any room reset cascades and wipes all scores; this must be communicated clearly in the UI
- **Role demotion cleanup** — demoting a judge must also clean up their `judging_room_staff` rows
- **Criteria deletes are destructive** — once judging is live, prefer an `isArchived` soft delete over hard deletes to preserve score history
- **Audit log does not exist yet** — strongly recommended before building reset controls