# Sprint 4.2 — Teacher Daily Attendance CRUD UI

Date: 2026-07-28

Branch: `feature/sprint-4.2-attendance-daily-ui`

Status: 90% — runtime, all automated tests, desktop read-only loading, exact-key Network evidence, and upper/middle 820 x 1180 interaction passed; responsive bottom controls/Console and approved isolated create/edit/delete validation remain pending

## Goal

Add a modular daily Attendance interface to the V2 Teacher shell while preserving the completed Attendance, Room Stock, ETag, offline queue, recovery, and protected legacy behavior.

Sprint 4.2 integrates the existing `AttendanceManager` into the View. It must not move Attendance business rules into the DOM layer and must not replace `teacher.html`.

## Protected Legacy Files

- `index.html`
- `teacher.html`

Both remain unchanged, operational, and available as rollback paths.

## Implemented Runtime

### Date-Scoped Attendance Form

- current local date default
- one-date selector
- load through `AttendanceManager.loadDay(date)`
- no full-room Attendance history request in the View

### Authenticated-Room Student List

- students from the existing Teacher room snapshot
- stable student IDs
- number, name, and gender display
- no all-room or all-student View query

### Present, Absent, and Notes

- present and absent controls
- existing-status restoration
- per-student notes
- total, checked, present, absent, and unchecked counters

### Create, Edit, and Delete Delegation

- save through `AttendanceManager.save(input)` only
- delete through `AttendanceManager.remove(input)` only after confirmation
- Room Stock difference calculation remains in AttendanceService
- Room Stock before/after and conflict count display come from Manager results
- no direct Room Stock or ledger calculation in the View

### Partial Save and Queue Feedback

- Attendance-saved/Room-Stock-pending feedback
- audit-queue feedback
- form state remains visible
- Teacher shell refresh after completed mutations
- no direct retry from the View

### Existing Data Preservation

Loaded and edited records preserve:

- room ID and room name
- date, year, and term
- teacher
- attendance data and notes
- photos
- signature
- savedAt

Sprint 4.2 does not add media inputs, but edits do not silently discard existing media fields.

## Runtime Files

Added:

- `modules/attendance/attendanceView.js`
- `tests/attendance-ui-check.mjs`
- `docs/ATTENDANCE_UI_IMPLEMENTATION_REPORT.md`

Updated:

- `index-v2.html`
- `modules/core/app.js`
- `tests/cutover-documentation-check.mjs`

## Architecture Boundary

The View may:

- render DOM
- manage form interaction state
- call AttendanceManager
- call TeacherManager.refresh() after completed mutations
- subscribe to application events
- format display-only values

The View must not:

- access FirebaseService
- access any Repository
- call fetch()
- access Local Storage or Session Storage directly
- calculate Room Stock differences
- create ledger or stockLog records
- mutate Main Stock
- own retry or ETag logic

No new Service or Repository was added because the existing business boundary is sufficient.

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

## Automated Gate

All 15 tests passed locally:

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

Result:

- PASS
- feature branch synchronized with origin
- working tree clean

## Desktop Browser Gate

Passed:

- Admin Login and Logout
- clean Admin Console
- Teacher Login and Attendance rendering
- authenticated-room student list
- current-date rendering
- existing-date restoration
- Teacher Logout
- clean Teacher Console

## Desktop Network Gate

Passed for date-scoped read:

- selected date requested one exact Attendance key
- exact-key request returned HTTP 200
- no full-history Attendance query
- no cross-room Attendance request
- no Main Stock request
- no write request during read-only validation

The supplied Network capture retained earlier Login reads, so it is not used as a fresh Login request-count measurement.

## Responsive Gate — Partial Pass

Chrome Device Toolbar at 820 x 1180:

Passed:

- Teacher header and metrics contained
- date and load controls visible
- totals visible
- student rows readable
- present/absent controls usable
- two absent selections updated totals correctly
- notes inputs visible
- no abnormal horizontal overflow
- visible Network reads returned HTTP 200
- no write request visible

Pending:

- scroll to bottom and confirm Save/Delete controls reachable
- confirm status and error feedback readable
- open Console and confirm clean
- Logout and confirm clean return to Login

Physical iPad remains deferred and must not be represented as PASS.

## Approved Isolated Write Validation

Do not intentionally write Attendance against normal classroom data.

Allowed targets:

- deterministic mocked tests
- a dedicated isolated Firebase project
- an approved disposable room and date

Record before and after:

- Attendance record
- Room Stock
- Main Stock
- queue count
- ledger and stockLog when applicable

Required workflow:

- create
- edit from fewer to more present students
- edit from more to fewer present students
- delete and restore Room Stock
- verify Main Stock unchanged
- verify compatible Attendance key and fields
- verify queue feedback when deliberately simulated

## Merge Gate

Sprint 4.2 may merge into `develop` only when:

- all automated tests pass — PASS
- desktop read-only and Network gates pass — PASS
- responsive top/middle interaction passes — PASS
- responsive bottom controls and Console pass — PENDING
- approved isolated create/edit/delete evidence passes — PENDING
- no Main Stock request or mutation occurs
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
