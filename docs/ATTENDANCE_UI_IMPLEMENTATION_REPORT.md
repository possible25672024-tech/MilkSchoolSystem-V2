# Sprint 4.2 — Attendance UI Implementation Report

Date started: 2026-07-28

Last updated: 2026-07-28

Branch: `feature/sprint-4.2-attendance-daily-ui`

Overall status: PARTIAL PASS — automated, desktop read-only, exact-key Network, and complete 820 x 1180 responsive interaction, Logout, and Console gates passed; approved isolated create/edit/delete validation remains pending

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

The first local execution reported a failed strict deep comparison for two visually identical photo arrays. The saved array was created inside the Node VM realm while the expected array was created in the test realm. Node.js 24 compares Array prototypes across realms.

The test now normalizes the VM value with `Array.from(savedInput.photos)` before comparison.

This correction changes only the test harness. It does not change AttendanceView, Attendance data, Room Stock, Main Stock, Firebase writes, or media preservation behavior.

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

## Desktop Browser Read-Only Validation

Environment:

- Chrome desktop
- Live Server at `127.0.0.1:5500/index-v2.html`
- current connected Firebase data
- date observed: 2026-07-28

### Admin Regression

Result: PASS

Observed:

- Admin Login succeeded
- existing Admin shell remained visible
- Sprint 4.2 shell text displayed
- Console displayed only `MilkSchoolSystem V2 Started`
- Admin Logout returned to the login form
- room/role selector reset
- password field returned empty

### Teacher Attendance Shell

Result: PASS

Observed:

- Teacher Login rendered the Teacher Attendance interface
- authenticated room displayed 26 students
- date field defaulted to 2026-07-28
- current-date form displayed 3 checked, 3 present, 0 absent, and 23 unchecked in the supplied desktop capture
- student number, name, gender, present/absent controls, and notes fields rendered
- Console displayed only `MilkSchoolSystem V2 Started`
- no visible application JavaScript error or warning

### Existing-Date Restoration

Result: PASS

Observed for 2026-07-15:

- 26 total students
- 26 checked
- 26 present
- 0 absent
- 0 unchecked
- existing statuses restored in the form

The supplied capture does not provide a note-bearing historical record, so historical note restoration remains protected primarily by automated coverage.

### Logout

Result: PASS

Observed:

- Teacher UI cleared
- login form returned
- Console remained free of visible application errors

## Desktop Network Evidence

Result: PASS FOR DATE-SCOPED READ

Observed:

- selected date 2026-07-15 requested one exact record named `{roomId}_2026-07-15.json`
- exact-key request returned HTTP 200
- no full-history `mcAttendance.json?orderBy=...` request was visible
- no cross-room Attendance request was visible
- no Main Stock request was visible
- no PUT, PATCH, POST, or DELETE request was visible during read-only validation

Scope note:

- the Network panel retained earlier Login and shell requests, including `settings.json` and `rooms.json`
- the capture proves that the selected-date action used one exact Attendance key, but it is not used as a fresh Login request-count measurement
- the exact historical record was approximately 1.3 MB in the supplied capture, which is consistent with a record potentially containing legacy media fields; Sprint 4.2 intentionally preserves those fields during edits
- DevTools displayed an Issues count, but no Issues details were supplied; this report does not classify that count as an application JavaScript failure

## Responsive Attendance Interaction

Environment recorded from supplied screenshots:

- Chrome Device Toolbar
- Responsive viewport at 820 x 1180 CSS pixels
- Teacher room displayed 26 students
- Room Stock displayed as 1,404 boxes
- queue count displayed as 0

### Complete Responsive Form

Result: PASS

Observed:

- Teacher header and read-only metrics remained contained
- Attendance heading, date control, and load button remained visible
- totals remained visible and readable
- student rows 1 through 26 remained reachable by vertical scrolling
- present and absent controls remained visible and usable
- two absent selections were reflected in the totals as 2 checked, 0 present, 2 absent, and 24 unchecked
- notes inputs remained visible
- the final student row remained readable
- instructional/status text below the student list remained readable
- `บันทึกข้อมูล` remained visible and reachable
- `ลบข้อมูลวันที่เลือก` remained visible and reachable
- Teacher Logout remained visible and reachable below the Attendance actions
- no abnormal horizontal overflow was visible
- visible Network reads returned HTTP 200
- no write request was visible because the test intentionally did not press Save or Delete

### Responsive Logout and Console

Result: PASS

Observed:

- Logout returned the responsive viewport to the login form
- room/role selector returned to the unselected state
- password field returned empty
- room connection status remained visible
- Console displayed only `MilkSchoolSystem V2 Started`
- no visible application JavaScript error or warning

DevTools displayed an Issues count, but the Issues details were not supplied. This evidence records the Console as clean and does not classify the Issues badge itself as an application failure.

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

## Approved Isolated Write Validation

Status: PENDING

Do not use normal classroom Attendance for development writes.

Allowed targets:

- mocked automated tests
- a dedicated isolated Firebase project
- an approved disposable room and date

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
- verify Main Stock remains unchanged
- verify compatible Attendance key and fields
- verify partial-save/queue feedback when deliberately simulated

## Current Decision

Automated, desktop read-only, exact-key Network, and complete 820 x 1180 responsive Attendance gates passed. Sprint 4.2 is not ready to merge into `develop` until approved isolated create/edit/delete validation is recorded.
