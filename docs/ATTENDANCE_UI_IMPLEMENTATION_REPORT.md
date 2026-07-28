# Sprint 4.2 — Attendance UI Implementation Report

Date started: 2026-07-28

Last updated: 2026-07-28

Branch: `feature/sprint-4.2-attendance-daily-ui`

Overall status: CODE COMPLETE / DEVELOP MERGE APPROVED — Runtime, all 16 automated checks, isolated write gate, desktop read-only and Network gates, complete 820 x 1180 responsive interaction, branch synchronization, and clean working tree passed. Production remains blocked by the deferred real-classroom incident.

## Runtime Added

### Attendance View

File:

- `modules/attendance/attendanceView.js`

Responsibilities:

- activate only for an authenticated Teacher session
- use the Teacher room snapshot for the student list
- default to the current local date
- load one date through `AttendanceManager.loadDay(date)`
- render present, absent, checked, and unchecked totals
- collect per-student notes
- save through `AttendanceManager.save(input)`
- delete through `AttendanceManager.remove(input)` after confirmation
- preserve `photos`, `signature`, `year`, `term`, and `savedAt` during edits
- display Room Stock before and after from Manager results
- display ETag conflict, stock queue, and audit queue feedback
- refresh the Teacher shell after completed mutations
- clear after Logout
- reject Admin sessions

The View does not access Firebase, repositories, browser storage, stock calculations, ledger construction, retry logic, or ETag logic.

### V2 Shell

Updated:

- `index-v2.html`

Added:

- date selector and exact-date load button
- authenticated-room student list
- present and absent controls
- per-student notes
- total, checked, present, absent, and unchecked cards
- save and delete controls
- status and error feedback
- responsive desktop, tablet, and narrow-layout CSS

### App Startup

Updated:

- `modules/core/app.js`

Startup order:

1. LoginManager
2. TeacherView
3. AttendanceView

## Tests Added

- `tests/attendance-ui-check.mjs`
- `tests/attendance-isolated-write-check.mjs`

UI coverage:

- valid JavaScript and dependency order
- no direct Firebase, Repository, fetch, storage, stock, ledger, or retry ownership
- Teacher-only activation
- date default and exact-date loading
- authenticated-room student rendering
- existing record restoration
- present/absent totals and notes
- media-field preservation
- save and delete delegation
- Room Stock result and queue feedback
- Logout clearing and Admin rejection

Isolated write coverage:

- Create 3 present: Room Stock `50 → 47`
- Edit 3 to 5 present: deduct only 2, `47 → 45`
- Edit 5 to 2 present: restore only 3, `45 → 48`
- Delete latest 2-present record: restore 2, `48 → 50`
- Main Stock remains 999
- compatible Attendance key and fields
- one ledger and stockLog record per successful operation
- no queue for successful CRUD
- deliberate Room Stock failure after Attendance save
- exactly one Room Stock retry queued with the correct difference and reference

The isolated test uses in-memory state only. It does not load FirebaseService, the production AttendanceRepository, or any real classroom room ID.

## Node.js 24 Compatibility Corrections

Two test-harness-only issues were corrected:

- normalized a VM-created photo array with `Array.from()` before deep comparison
- allowed the Cutover documentation test to accept both valid Sprint 4.1 merge phrases

Neither correction changed Runtime, Attendance data, stock behavior, Firebase writes, or media preservation.

## Automated Validation

Confirmed:

- Login foundation checks passed
- Stock module checks passed
- Report module checks passed
- Room module checks passed
- Teacher module checks passed
- Attendance module checks passed
- Sync module checks passed
- Firebase request header checks passed
- Performance module checks passed
- Teacher core payload checks passed
- Cutover concurrency checks passed
- Audit recovery checks passed
- Cutover documentation checks passed
- Teacher UI shell checks passed
- Attendance UI checks passed
- Attendance isolated write checks passed
- feature branch synchronized with origin
- working tree clean

The full sequence initially stopped on the Cutover documentation wording assertion. After changing only that assertion, the documentation test and all remaining tests passed. All 16 checks are accepted for the Sprint 4.2 code gate.

## Desktop Browser Validation

### Admin Regression

Result: PASS

- Admin Login succeeded
- existing Admin shell remained visible
- Console displayed only `MilkSchoolSystem V2 Started`
- Logout returned to Login

### Teacher Attendance

Result: PASS

- Teacher Login rendered the Attendance interface
- authenticated room displayed 26 students
- current date defaulted correctly
- historical date restored existing status values
- student rows, controls, notes, and totals rendered
- Console remained clean

### Exact-Date Network

Result: PASS

- selected historical date requested one exact `{roomId}_{date}.json` record
- no full-history `mcAttendance.json?orderBy=...` request was visible
- no cross-room Attendance request was visible
- no Main Stock request was visible
- no write request occurred during read-only validation

## Responsive Validation

Environment:

- Chrome Device Toolbar
- 820 x 1180 CSS pixels

Result: PASS

- Teacher header and metrics remained contained
- date and totals remained readable
- all 26 student rows were reachable
- present/absent controls and notes remained usable
- totals reacted to selections
- Save, Delete, status area, and Logout remained reachable
- no abnormal horizontal overflow was visible
- Logout returned to Login
- Console remained clean

## Deferred Real-Classroom Incident

Status: DEFERRED / OPEN

Quarantined room:

- room `อ.3-3`
- room ID `mqn0z13eyx5b`
- date `2026-07-28`
- test-created Attendance: 22 present and 3 absent
- Room Stock: 1,253
- recorded pre-test Room Stock: 1,275
- known discrepancy: -22

Reconciled room:

- room `อ.3-4`
- room ID `mqn0z13emyrc`
- Attendance: `null`
- Room Stock: 350

The product owner deferred correction so development could continue. This is not incident closure.

Rules:

- do not use the quarantined room/date for further writes
- do not use the affected values as trusted report or stock evidence
- do not manually rewrite Room Stock, Main Stock, ledger, stockLog, or transaction history
- use isolated targets for all further write testing

Recovery and explicit incident closure remain mandatory before `main`, production cutover, or official operational acceptance.

## Compatibility Protection

- Attendance key remains `{roomId}_{YYYY-MM-DD}`.
- Main Stock is not requested or mutated by Attendance workflows.
- Room Stock differences remain inside AttendanceService.
- ETag conflict retry remains inside AttendanceService.
- Partial saves remain inside AttendanceManager and SyncService.
- Audit-only retry remains inside the existing queue boundary.
- Negative Room Stock remains visible.
- Existing media fields remain compatible.
- `index.html` and `teacher.html` remain unchanged and operational.

## Integration Decision

Sprint 4.2 code is approved for fast-forward merge into `develop`.

This approval does not authorize:

- merge to `main`
- production cutover
- replacement of `teacher.html`
- claiming the Firebase data is fully reconciled
- official use of the quarantined room/date

Next implementation phase: Offline Queue Operational UI.
