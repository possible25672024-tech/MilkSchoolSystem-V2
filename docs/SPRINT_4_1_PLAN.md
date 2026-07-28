# Sprint 4.1 — Teacher UI Shell and Read-Only State

Date: 2026-07-28

Branch: `feature/sprint-4.1-teacher-ui-shell`

Status: 100% — runtime, automated, desktop, responsive, network, offline/online, Console, Admin regression, Logout, and clean-working-tree gates passed

## Goal

Create the first modular operational Teacher interface inside the V2 shell without changing Attendance, stock, queue, Firebase, or protected legacy behavior.

Sprint 4.1 implements only the Teacher session shell and read-only state. It does not replace the operational workflows in `teacher.html`.

## Protected Legacy Files

- `index.html`
- `teacher.html`

Both files remain unchanged, operational, and available as rollback paths.

## Completed Runtime Boundary

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

## Automated Validation

All 14 tests passed locally on 2026-07-28:

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

Result:

- PASS
- feature branch synchronized with origin
- working tree clean

## Browser and Responsive Validation

Desktop Chrome:

- Admin Login unchanged — PASS
- Admin Logout returned to login form — PASS
- Admin Console clean — PASS
- Teacher Login rendered modular shell — PASS
- school, room, teacher, and Room Stock displayed correctly — PASS
- queue count displayed — PASS
- online state displayed — PASS
- Offline badge transition — PASS
- Online recovery — PASS
- Teacher Logout returned to login form — PASS
- Teacher and post-Logout Console clean — PASS
- no failed application Fetch/XHR request — PASS

Responsive Chrome Device Toolbar at 820 x 1180:

- Teacher shell contained — PASS
- header fields readable — PASS
- Room Stock visible — PASS
- queue count visible — PASS
- online badge visible — PASS
- Logout usable — PASS
- no abnormal horizontal overflow — PASS
- Console clean — PASS

Physical iPad remains deferred and must not be represented as PASS.

## Data and Network Gate

Passed in the recorded desktop Teacher flow:

- exactly four successful core reads
- approximately 1.6 KB transferred
- no additional full `rooms.json` request after Teacher login
- no full room-history Attendance request
- no deferred Teacher collection request
- no Firebase write request from shell rendering
- no Main Stock request

After Logout, `settings.json` and full `rooms.json` reload to rebuild the login form and 83-room selector. This expected login-form reload is separate from the Teacher core refresh.

## Validation Report

Completed:

- `docs/TEACHER_UI_SHELL_VALIDATION_REPORT.md`

## Merge Gate

All Sprint 4.1 branch gates passed:

- automated tests — PASS
- Teacher identity and Room Stock — PASS
- queue count — PASS
- Offline/Online state — PASS
- Logout — PASS
- desktop Teacher gate — PASS
- desktop Admin regression — PASS
- responsive 820 x 1180 gate — PASS
- Console — PASS
- Network — PASS
- working tree — PASS
- `index.html` and `teacher.html` unchanged — PASS

Sprint 4.1 is approved for fast-forward integration into `develop`.

## Production Meaning

A Sprint 4.1 merge into `develop` does not authorize:

- replacement of `teacher.html`
- operational Attendance cutover
- `main` merge
- production traffic switching
- Firebase schema changes
- legacy-file removal

The next Teacher UI Sprint may begin Attendance CRUD only after this read-only shell is integrated into `develop`.
