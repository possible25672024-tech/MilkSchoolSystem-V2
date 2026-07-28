# Sprint 4.1 — Teacher UI Shell and Read-Only State

Date: 2026-07-28

Branch: `feature/sprint-4.1-teacher-ui-shell`

Status: 10% — plan initialized; runtime implementation not started

## Goal

Create the first modular operational Teacher interface inside the V2 shell without changing Attendance, stock, queue, Firebase, or protected legacy behavior.

Sprint 4.1 implements only the Teacher session shell and read-only state. It does not replace the operational workflows in `teacher.html`.

## Protected Legacy Files

- `index.html`
- `teacher.html`

Both files remain unchanged, operational, and available as rollback paths.

## In Scope

### Teacher Session Header

Display:

- school name
- room name
- teacher name
- current Room Stock
- online/offline connection state
- pending queue count
- Logout action

### Read-Only State Sources

Use existing modular boundaries:

- `AuthService` for the authenticated session
- `TeacherManager` for the Teacher snapshot and dashboard
- `SyncManager` or `SyncService` status for queue count
- browser `online` and `offline` events for connection state

### View Boundary

The view may:

- create and update DOM elements
- format display-only values
- call Manager methods
- subscribe to existing browser events
- emit UI interaction events where needed

The view must not:

- access Firebase directly
- access repositories directly
- calculate Main Stock or Room Stock rules
- mutate Attendance
- mutate Room Stock
- own the offline queue
- change session-storage keys

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
- The view must not silently clamp, recalculate, or rewrite stock values.

## Planned Runtime Files

Create only when implementation starts:

- `modules/teacher/teacherView.js`

Optional only if the current shell structure requires a separate renderer:

- `modules/teacher/teacherShellRenderer.js`

Do not create additional Service or Repository modules for display-only concerns.

## Planned Test Files

- `tests/teacher-ui-shell-check.mjs`

The test must verify:

- valid JavaScript
- dependency order in `index-v2.html`
- no direct `FirebaseService` access
- no `fetch()` in the view
- no direct repository access
- no stock calculations in the view
- authenticated Teacher state rendering
- Room Stock display including zero and negative values
- queue count rendering
- online/offline state rendering
- Logout delegation
- Admin sessions do not render the Teacher shell
- shell clears after Logout

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
- no deferred Teacher collection request unless explicitly requested by an existing Manager flow
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
```

New Sprint test:

```powershell
node tests/teacher-ui-shell-check.mjs
```

## Merge Gate

Sprint 4.1 may merge into `develop` when:

- the Teacher shell is implemented through a View boundary
- no direct Firebase or Repository access exists in the view
- Teacher room identity and Room Stock display are correct
- queue count and connection state are correct
- Logout works
- all existing and new automated tests pass
- desktop browser gate passes
- 820 x 1180 responsive gate passes
- Console is clean
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
