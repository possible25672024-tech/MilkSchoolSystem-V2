# Sprint 4.2 — Teacher Daily Attendance CRUD UI

Date: 2026-07-28

Branch: `feature/sprint-4.2-attendance-daily-ui`

Status: 65% — Attendance View, responsive form, App integration, workflow test, and implementation report completed; automated, browser, isolated write, responsive, Network, Console, and clean-tree validation remain pending

## Goal

Add a modular daily Attendance interface to the V2 Teacher shell while preserving the completed Attendance, Room Stock, ETag, offline queue, recovery, and protected legacy behavior.

Sprint 4.2 integrates the existing `AttendanceManager` into the View. It must not move Attendance business rules into the DOM layer and must not replace `teacher.html`.

## Protected Legacy Files

- `index.html`
- `teacher.html`

Both remain unchanged, operational, and available as rollback paths.

## Implemented Runtime

### Date-Scoped Attendance Form

Implemented:

- current local date default
- one-date selector in `YYYY-MM-DD`
- load through `AttendanceManager.loadDay(date)`
- no full room Attendance history request in the View

### Authenticated-Room Student List

Implemented:

- student list from the existing Teacher room snapshot
- stable student IDs
- number, name, and gender display
- no all-room or all-student View query

### Present, Absent, and Notes

Implemented:

- present and absent radio controls
- existing status restoration
- per-student notes
- total, checked, present, absent, and unchecked counters

### Create and Edit

Implemented:

- save through `AttendanceManager.save(input)` only
- existing Room Stock difference calculation remains in AttendanceService
- Room Stock before and after display from the Manager result
- conflict count display when reported
- no direct Room Stock calculation or write in the View

### Delete

Implemented:

- explicit confirmation
- delete through `AttendanceManager.remove(input)` only
- restored quantity and resulting Room Stock display
- no rollback ledger construction in the View

### Partial Save and Queue Feedback

Implemented:

- `milkapp:attendance-stock-queued` feedback
- Attendance-saved/Room-Stock-pending message
- audit-queue feedback
- form state remains visible
- Teacher shell refresh after completed mutations
- no direct retry from the View

### Existing Teacher Shell

Preserved:

- school
- room
- teacher
- Room Stock
- online/offline state
- queue count
- Logout

## Runtime Files

Added:

- `modules/attendance/attendanceView.js`

Updated:

- `index-v2.html`
- `modules/core/app.js`
- `tests/cutover-documentation-check.mjs`

## Architecture Boundary

The View may:

- render DOM
- manage form interaction state
- call `AttendanceManager`
- call `TeacherManager.refresh()` after completed mutations
- subscribe to Attendance, Sync, Login, Logout, and Teacher events
- format display-only numbers and dates

The View must not:

- access `FirebaseService`
- access any Repository
- call `fetch()`
- access Local Storage or Session Storage directly
- calculate Room Stock differences
- create ledger or stockLog records
- mutate Main Stock
- own retry or ETag logic

No new Service or Repository was added because the existing business boundary is sufficient.

## Existing Manager Methods Used

- `AttendanceManager.loadDay(date)`
- `AttendanceManager.save(input)`
- `AttendanceManager.remove(input)`
- `TeacherManager.refresh()`
- `SyncManager.getStatus()` through the existing shell
- `LoginManager.logout()` through the existing shell

## Existing Events Consumed

- `milkapp:attendance-day-loaded`
- `milkapp:attendance-saved`
- `milkapp:attendance-deleted`
- `milkapp:attendance-stock-queued`
- `milkapp:attendance-audit-queued`
- `milkapp:teacher-refreshed`
- `milkapp:login-success`
- `milkapp:logout`

## Data Compatibility

Loaded and edited records preserve:

- `clsId` through the authenticated `roomId`
- `roomName`
- `date`
- `year`
- `term`
- `teacher`
- `data`
- `notes`
- `photos`
- `signature`
- `savedAt`

Sprint 4.2 does not add media inputs, but an edit does not silently discard existing `photos` or `signature` values.

## Business Protection

- Main Stock delta remains zero.
- Attendance save consumes Room Stock by the present-count difference only.
- Editing from fewer to more present students consumes only the increase.
- Editing from more to fewer present students restores only the decrease.
- Delete restores the previously consumed present count.
- ETag conflict retry remains inside the Service.
- Partial save queues only the unresolved Room Stock adjustment.
- Audit-only recovery never repeats Room Stock.
- Negative Room Stock remains visible.
- Attendance key remains `{roomId}_{YYYY-MM-DD}`.
- Teacher access remains limited to the authenticated room.

## Automated Test Added

- `tests/attendance-ui-check.mjs`

Coverage:

- valid JavaScript
- dependency order
- no direct Firebase, Repository, fetch, or storage access
- no stock-delta, ledger, stockLog, or Main Stock calculation in the View
- Teacher-only activation
- current date default
- room student rendering
- existing-day load
- notes and unsupported media-field preservation
- present/absent/unchecked totals
- save delegation
- delete confirmation and delegation
- Room Stock result and conflict display
- partial-save queue feedback
- shell refresh after mutation
- Logout clearing
- Admin rejection

## Validation Report

Added:

- `docs/ATTENDANCE_UI_IMPLEMENTATION_REPORT.md`

## Offline Scope

Sprint 4.2 exposes the existing partial-save and queue result in the UI.

Complete offline-first form-save UX, manual retry controls, item-level queue details, and restart/reconnect workflow remain in the next Offline Queue UI phase unless supplied by existing Manager events without new business logic.

## Isolated Write Validation

Do not intentionally write Attendance against production classroom data for development validation.

Allowed targets:

- deterministic VM tests with mocked Managers
- a dedicated isolated Firebase project
- a disposable test room and date approved for testing

Record before and after:

- Attendance record
- Room Stock
- queue count
- ledger and stockLog when available

## Automated Regression Gate

Pending local execution:

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
node tests/attendance-ui-check.mjs
```

## Browser Gate

Desktop Chrome using isolated/disposable Attendance data:

- Admin Login remains unchanged
- Teacher Login renders shell and Attendance form
- authenticated room students display correctly
- empty and existing test dates load
- controlled create, edit, and delete work
- difference-only Room Stock result is verified
- partial-save/queued feedback works
- no cross-room request
- no Main Stock request or mutation
- Logout returns to login form
- Console clean

Chrome Device Toolbar at 820 x 1180:

- student rows remain readable
- present/absent controls remain usable
- notes remain usable
- totals remain visible
- save/delete controls remain reachable
- status feedback remains readable
- no abnormal horizontal overflow
- Console clean

Physical iPad remains deferred and must not be represented as PASS.

## Merge Gate

Sprint 4.2 may merge into `develop` only when:

- all existing and new automated tests pass
- read-only browser loading passes
- isolated create/edit/delete evidence passes
- difference-only Room Stock behavior is recorded
- no Main Stock request or mutation occurs
- desktop and 820 x 1180 gates pass
- Network and Console are clean
- working tree is clean
- `index.html` and `teacher.html` remain unchanged

## Production Meaning

A Sprint 4.2 merge into `develop` does not authorize:

- replacement of `teacher.html`
- pending, retroactive, or vacation milk cutover
- photos, signatures, printing, or full-history cutover
- `main` merge
- production traffic switching
- Firebase schema changes
- legacy-file removal
