# Sprint 4.2 — Attendance UI Implementation Report

Date started: 2026-07-28

Last updated: 2026-07-28

Branch: `feature/sprint-4.2-attendance-daily-ui`

Status: AUTOMATED GATE PASSED — browser read-only, isolated write, responsive interaction, Network, and Console validation pending

## Runtime Added

### Attendance View

File:

- `modules/attendance/attendanceView.js`

Responsibilities:

- activate only for an authenticated Teacher session
- use the existing Teacher room snapshot for the student list
- default the date field to the current local date
- load one date through `AttendanceManager.loadDay(date)`
- render present, absent, checked, and unchecked totals
- collect per-student notes
- save through `AttendanceManager.save(input)`
- delete through `AttendanceManager.remove(input)` after confirmation
- preserve existing `photos`, `signature`, `year`, `term`, and `savedAt` values during edits
- display Room Stock before and after from Manager results
- display reported ETag conflict count
- display partial-save, stock-queue, and audit-queue feedback
- refresh the read-only Teacher shell after completed mutations
- clear the form after Logout
- reject Admin sessions

The View does not access Firebase, repositories, browser storage, stock calculations, ledger construction, retry logic, or ETag logic.

### V2 Shell

Updated:

- `index-v2.html`

Added:

- date selector and date-scoped load button
- authenticated-room student list container
- present and absent controls
- per-student notes
- total, checked, present, absent, and unchecked summary cards
- save and delete controls
- status and error feedback
- responsive desktop, tablet, and narrow-layout CSS
- Sprint 4.2 shell text
- preserved Sprint 4.0 and Sprint 4.1 foundation markers for regression tests

### App Startup

Updated:

- `modules/core/app.js`

Startup order:

1. LoginManager
2. TeacherView
3. AttendanceView

This preserves the Teacher snapshot before restored-session Attendance rendering.

## Automated Test Added

File:

- `tests/attendance-ui-check.mjs`

Coverage:

- valid JavaScript
- required markup and dependency order
- no direct Firebase, repository, fetch, storage, stock-delta, ledger, or stock-log ownership
- Teacher-only activation
- current local date default
- authenticated-room student rendering
- empty and existing day loading
- present, absent, checked, and unchecked totals
- note editing
- compatible photo, signature, and savedAt preservation
- save delegation
- delete confirmation and delegation
- Room Stock result display
- reported conflict display
- persistent queue feedback
- Teacher shell refresh after mutation
- form clearing after Logout
- Admin session rejection

## Node.js 24 Test Compatibility

The first local execution reported a failed `deepStrictEqual` for two visually identical photo arrays. The saved array was created inside the Node VM realm while the expected array was created in the test realm. Node.js 24 compares Array prototypes across realms during strict deep comparison.

The test now normalizes the VM value with `Array.from(savedInput.photos)` before comparison.

This correction changes only the test harness. It does not change `AttendanceView`, Attendance data, Room Stock, Main Stock, Firebase writes, or media preservation behavior.

## Automated Validation Result

Verified locally by the user on 2026-07-28:

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
- Attendance UI checks passed after cross-realm test normalization
- feature branch synchronized with origin
- working tree clean

Result: PASS

## Compatibility Protection

- Attendance key remains `{roomId}_{YYYY-MM-DD}`.
- Main Stock is not requested or mutated by the View.
- Room Stock differences remain inside AttendanceService.
- ETag conflict retry remains inside AttendanceService.
- Partial saves remain inside AttendanceManager and SyncService.
- Audit-only retry remains inside the existing queue boundary.
- Negative Room Stock remains visible in the Teacher shell.
- Existing media values are preserved even though Sprint 4.2 does not add media inputs.
- `index.html` and `teacher.html` remain unchanged and operational.

## Validation Still Required

### Browser Read-Only

- Admin Login remains unchanged
- Teacher Login renders the Attendance form
- correct authenticated-room student list
- current date defaults correctly
- an empty approved test date loads without full-history access
- an existing approved test date restores statuses and notes
- no full room-history Attendance request
- no cross-room request
- no Main Stock request
- Logout returns to login form
- Console clean

### Responsive and Network

- 820 x 1180 student rows remain readable
- present/absent controls remain usable
- notes input remains usable
- totals and status feedback remain visible
- save/delete controls remain reachable
- no abnormal horizontal overflow
- one selected Attendance key per date load
- no room-history request
- no cross-room request
- no Main Stock request or mutation
- writes occur only during approved isolated validation

### Isolated Write Validation

Do not use production classroom Attendance for development writes.

Use only:

- mocked automated tests
- a dedicated isolated Firebase project
- an approved disposable room/date

Record before and after:

- Attendance record
- Room Stock
- Main Stock
- queue count
- ledger and stockLog when applicable

Test:

- create
- edit from fewer to more present students
- edit from more to fewer present students
- delete and Room Stock restoration
- conflict retry when an isolated multi-writer setup is available
- partial-save/queue feedback without repeating Attendance or Room Stock changes

## Current Decision

Runtime implementation and the complete automated gate passed. Sprint 4.2 is not ready to merge into `develop` until browser read-only, approved isolated write, responsive interaction, Network, and Console gates pass.
