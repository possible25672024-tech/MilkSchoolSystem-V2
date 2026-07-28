# Sprint 4.2 — Attendance UI Implementation Report

Date started: 2026-07-28

Last updated: 2026-07-28

Branch: `feature/sprint-4.2-attendance-daily-ui`

Status: IMPLEMENTED — automated and browser validation pending

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

### Automated

- all existing regression tests
- `tests/attendance-ui-check.mjs`
- clean working tree

### Browser Read-Only

- Admin Login remains unchanged
- Teacher Login renders the Attendance form
- correct authenticated-room student list
- empty and existing date load
- no full room-history Attendance request
- no cross-room request
- Console clean
- responsive 820 x 1180 layout

### Isolated Write Validation

Do not use production classroom Attendance for development writes.

Use only:

- mocked automated tests
- a dedicated isolated Firebase project
- an approved disposable room/date

Record before and after:

- Attendance record
- Room Stock
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

Runtime implementation is ready for automated validation. Sprint 4.2 is not ready to merge into `develop` until automated, read-only browser, isolated write, responsive, Network, Console, and clean-tree gates pass.
