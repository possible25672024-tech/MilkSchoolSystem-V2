# Sprint 4.1 — Teacher UI Shell and Read-Only State

Date: 2026-07-28

Branch: `feature/sprint-4.1-teacher-ui-shell`

Status: 65% — Teacher View, responsive shell markup, role routing, App initialization, and deterministic shell tests implemented; local regression and browser gates remain pending

## Goal

Create the first modular operational Teacher interface inside the V2 shell without changing Attendance, stock, queue, Firebase, or protected legacy behavior.

Sprint 4.1 implements only the Teacher session shell and read-only state. It does not replace the operational workflows in `teacher.html`.

## Protected Legacy Files

- `index.html`
- `teacher.html`

Both files remain unchanged, operational, and available as rollback paths.

## Implemented Runtime Boundary

### Teacher View

Added:

- `modules/teacher/teacherView.js`

Implemented behavior:

- restores the shell from an existing Teacher session
- reacts to `milkapp:login-success`
- clears on `milkapp:logout`
- calls `TeacherManager.refresh()` for room-scoped read-only state
- renders school, room, teacher, and current Room Stock
- renders queue count from `SyncManager.getStatus()`
- renders online/offline state from browser events
- delegates Logout to `LoginManager.logout()`
- keeps negative Room Stock visible
- ignores Admin sessions
- clears stale Teacher values after Logout

### V2 Shell Markup

Updated:

- `index-v2.html`

Added:

- explicit Admin and Teacher shell containers
- responsive Teacher identity cards
- Room Stock read-only metric
- queue-count metric
- online/offline badge
- Teacher Logout action
- responsive one-column layout below 600 CSS pixels
- Sprint 4.1 user-visible shell text
- completed Sprint 4.0 foundation marker for existing regression protection

### Role and Startup Integration

Updated:

- `modules/login/loginManager.js`
- `modules/core/app.js`

Implemented:

- Teacher sessions route to the modular Teacher shell
- Admin sessions retain the existing Admin shell
- Logout hides and clears the Teacher shell
- App initializes TeacherView after LoginManager
- restored Teacher sessions render after bootstrap

## Architecture Protection

The View:

- owns DOM rendering and browser interaction only
- calls Managers
- subscribes to browser and application events
- does not access Firebase directly
- does not access Repositories directly
- does not call `fetch()`
- does not own Local Storage or Session Storage
- does not calculate stock deltas
- does not mutate Attendance or Room Stock

## Out of Scope

- Attendance create, edit, or delete forms
- pending milk issue
- retroactive milk issue
- vacation milk issue
- photos
- signatures
- printing
- history screens
- Report UI
- Admin UI
- XLSX parsing
- Firebase schema changes
- replacement or removal of `teacher.html`
- production deployment

## Required Business Protection

- Main Stock must never change from the Teacher UI.
- Room Stock is display-only in this Sprint.
- Teacher data must remain limited to the authenticated room.
- Normal Teacher refresh must remain date-scoped and must not load full room history.
- Queue count must come from the existing persistent queue boundary.
- Logout must clear the active session and return to the login form.
- Negative Room Stock must remain visible.
- The View must not silently clamp, recalculate, or rewrite stock values.

## Test Implementation

Added:

- `tests/teacher-ui-shell-check.mjs`

Coverage:

- valid JavaScript
- dependency order in `index-v2.html`
- no direct Firebase access
- no `fetch()` in the View
- no direct Repository access
- no stock-delta calculations in the View
- restored authenticated Teacher state
- school, room, and teacher rendering
- positive, zero, and negative Room Stock rendering
- queue-count rendering and update events
- online/offline rendering
- Logout delegation
- Admin session rejection
- shell clearing after Logout

Updated:

- `tests/cutover-documentation-check.mjs`

Reason:

- preserve completed Sprint 4.0 evidence while `SPRINT_STATUS.md` advances to Sprint 4.1

## Browser Gate

Desktop Chrome:

- Admin login remains unchanged
- Teacher login renders the new shell
- school, room, teacher, and Room Stock display correctly
- queue count displays
- online state displays
- offline state changes when DevTools Offline mode is enabled
- Logout returns to the login form
- Console clean
- no failed application Fetch/XHR requests

Responsive Chrome Device Toolbar at 820 x 1180:

- Teacher shell remains contained
- header fields remain readable
- Room Stock remains visible
- queue count remains visible
- Logout remains usable
- no abnormal horizontal overflow
- Console clean

Physical iPad remains deferred and must not be represented as PASS.

## Data and Network Gate

- no additional full `rooms.json` request after Teacher login
- no full room-history Attendance request during normal shell refresh
- no deferred Teacher collection request
- no write request from shell rendering
- no Main Stock request required for the Teacher shell

## Automated Regression Gate

All existing tests remain mandatory:

```powershell
node tests/login-foundation-check.mjs
node tests/stock-module-check.mjs
node tests/report-module-check.mjs
node tests/room-module-check.mjs
node tests/teacher-module-check.mjs
node tests/attendance-module-check.mjs
node tests/sync-module-check.mjs
node tests/firebase-request-header-check.mjs
node tests/performance-module-check.mjs
node tests/teacher-core-payload-check.mjs
node tests/cutover-concurrency-check.mjs
node tests/audit-recovery-check.mjs
node tests/cutover-documentation-check.mjs
node tests/teacher-ui-shell-check.mjs
```

## Current Pending Gate

- pull the latest feature branch
- run all 14 automated tests
- confirm working tree clean
- run desktop Admin Login
- run desktop Teacher Login and verify shell values
- switch DevTools Network to Offline and verify the badge
- return Online and verify the badge
- verify queue count
- Logout and confirm the login form
- confirm Console clean
- repeat Teacher Login and Logout at 820 x 1180
- inspect Fetch/XHR for unexpected reads or writes

## Merge Gate

Sprint 4.1 may merge into `develop` when:

- all existing and new automated tests pass
- Teacher room identity and Room Stock display are correct
- queue count and connection state are correct
- Logout works
- desktop browser gate passes
- 820 x 1180 responsive gate passes
- Console is clean
- no unexpected network reads or writes occur
- working tree is clean
- `index.html` and `teacher.html` remain unchanged

## Production Meaning

A Sprint 4.1 merge into `develop` does not authorize:

- replacement of `teacher.html`
- operational Attendance cutover
- `main` merge
- production traffic switching
- Firebase schema changes
- legacy-file removal

The next Teacher UI Sprint may begin Attendance CRUD only after this read-only shell is stable.
