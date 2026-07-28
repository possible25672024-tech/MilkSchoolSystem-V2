# Sprint 4.2 — Teacher Daily Attendance CRUD UI

Date: 2026-07-28

Branch: `feature/sprint-4.2-attendance-daily-ui`

Status: 100% CODE COMPLETE — approved for fast-forward merge into `develop`; deferred real-classroom incident remains open and blocks `main` and production cutover

## Goal

Add a modular daily Attendance interface to the V2 Teacher shell while preserving the completed Attendance, Room Stock, ETag, offline queue, recovery, and protected legacy behavior.

Sprint 4.2 integrates the existing `AttendanceManager` into the View. It does not move Attendance business rules into the DOM layer and does not replace `teacher.html`.

## Protected Legacy Files

- `index.html`
- `teacher.html`

Both remain unchanged, operational, and available as rollback paths.

## Completed Runtime

### Date-Scoped Attendance Form

- current local date default
- one-date selector
- load through `AttendanceManager.loadDay(date)`
- no full-room Attendance history request in the View

### Authenticated-Room Student List

- students from the Teacher room snapshot
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
- Room Stock before/after and conflict count come from Manager results
- no direct Room Stock or ledger calculation in the View

### Partial Save and Queue Feedback

- Attendance-saved/Room-Stock-pending feedback
- audit-queue feedback
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
- `tests/attendance-isolated-write-check.mjs`
- `docs/ATTENDANCE_UI_IMPLEMENTATION_REPORT.md`
- `docs/ATTENDANCE_ISOLATED_WRITE_GATE.md`
- `docs/ATTENDANCE_REAL_DATA_TEST_INCIDENT.md`

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

No new Service or Repository was required because the existing business boundary was sufficient.

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

All 16 checks accepted as passed:

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
node tests/attendance-isolated-write-check.mjs
```

The complete run initially stopped on one exact documentation-wording assertion. Only that assertion was changed. The corrected Cutover documentation test and all remaining tests then passed.

Result:

- PASS
- feature branch synchronized with origin
- working tree clean

## Isolated Write Gate

In-memory only:

- room `isolated-room`
- Room Stock 50
- Main Stock 999
- no FirebaseService
- no production AttendanceRepository

Passed:

- Create 3 present: Room Stock `50 → 47`
- Edit 3 to 5 present: deduct only 2, `47 → 45`
- Edit 5 to 2 present: restore only 3, `45 → 48`
- Delete 2-present record: restore 2, `48 → 50`
- Main Stock remained 999
- compatible Attendance key and fields
- ledger and stockLog records
- no retry queue for successful CRUD
- exactly one protected Room Stock retry after deliberate partial-save failure
- exact queue difference and reference key
- Manager queue-feedback event

## Desktop Browser and Network Gates

Passed:

- Admin Login and Logout
- clean Admin Console
- Teacher Login and Attendance rendering
- authenticated-room student list
- current-date rendering
- existing-date restoration
- Teacher Logout
- clean Teacher Console
- one exact Attendance key for selected date
- no full-history Attendance query
- no cross-room Attendance request
- no Main Stock request
- no write request during read-only validation

## Responsive Gate

Chrome Device Toolbar at 820 x 1180 passed:

- Teacher header and metrics contained
- date, load, totals, all student rows, notes, and controls reachable
- present/absent controls usable
- totals updated correctly
- Save and Delete reachable
- status area readable
- Logout reachable
- no abnormal horizontal overflow
- clean Console

Physical iPad remains deferred and must not be represented as PASS.

## Deferred Real-Classroom Incident

The product owner deferred correction so development could continue.

Quarantined:

- room `อ.3-3`
- room ID `mqn0z13eyx5b`
- date `2026-07-28`
- Attendance: 22 present, 3 absent
- Room Stock: 1,253
- recorded pre-test Room Stock: 1,275
- discrepancy: -22

Reconciled:

- room `อ.3-4`
- room ID `mqn0z13emyrc`
- Attendance: `null`
- Room Stock: 350

The incident remains open. Do not use the quarantined room/date for further writes or trusted operational evidence. Recovery remains mandatory before `main` or production cutover.

## Merge Gate

- all automated tests pass — PASS
- isolated create/edit/delete/queue test passes — PASS
- desktop read-only and Network gates pass — PASS
- complete responsive gate passes — PASS
- Main Stock remains unchanged — PASS IN ISOLATED TEST
- working tree clean — PASS
- `index.html` and `teacher.html` unchanged — PASS

Decision:

- approved for fast-forward merge into `develop`
- not approved for `main`
- not approved for production cutover

## Next Sprint

Sprint 4.3 — Offline Queue Operational UI

Planned scope:

- offline banner
- persistent queue status and item count
- last successful sync time
- retrying, failed, and deferred states
- manual retry
- safe item-level error summary
- restart and reconnect validation
- preserve `tc_pending_saves_v1`, `rec`, `diff`, and original baseline behavior
- no direct QueueStorage mutation from the View
- no real-classroom write tests
