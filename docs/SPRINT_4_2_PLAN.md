# Sprint 4.2 — Teacher Daily Attendance CRUD UI

Date: 2026-07-28

Branch: `feature/sprint-4.2-attendance-daily-ui`

Status: 10% — plan initialized; runtime implementation not started

## Goal

Add a modular daily Attendance interface to the V2 Teacher shell while preserving the completed Attendance, Room Stock, ETag, offline queue, recovery, and protected legacy behavior.

Sprint 4.2 integrates the existing `AttendanceManager` into the View. It must not move Attendance business rules into the DOM layer and must not replace `teacher.html`.

## Protected Legacy Files

- `index.html`
- `teacher.html`

Both remain unchanged, operational, and available as rollback paths.

## In Scope

### Date-Scoped Attendance Form

- default to the current local date
- allow selecting one date in `YYYY-MM-DD`
- load only `{roomId}_{date}` through `AttendanceManager.loadDay(date)`
- do not load full room Attendance history during normal form use

### Authenticated-Room Student List

- render students only from the authenticated Teacher room snapshot
- preserve stable student IDs
- show student names and existing metadata needed for recognition
- do not query all rooms or all students after Teacher login

### Present and Absent Controls

- mark each student `present` or `absent`
- preserve existing record status when a day is loaded
- support per-student notes
- show checked, present, absent, and unchecked totals

### Create and Edit

- save through `AttendanceManager.save(input)` only
- use the existing Service difference calculation
- display previous and current present totals when available
- display Room Stock before and after when the operation succeeds
- display conflict retry count when reported
- never calculate or write Room Stock directly in the View

### Delete

- delete through `AttendanceManager.remove(input)` only
- require an explicit user confirmation
- display the restored Room Stock quantity and resulting balance
- do not construct rollback ledger entries in the View

### Partial Save and Queue Feedback

Handle `milkapp:attendance-stock-queued`:

- show that Attendance data was saved
- show that Room Stock adjustment is waiting in the persistent queue
- keep the form state visible
- refresh queue count through the existing Sync boundary
- do not retry Room Stock directly from the View

### Existing Teacher Shell

Keep visible:

- school
- room
- teacher
- Room Stock
- online/offline state
- queue count
- Logout

After Attendance save/delete, refresh the read-only Teacher dashboard through the existing Manager boundary so the displayed Room Stock remains current.

## Architecture Boundary

### View

Planned file:

- `modules/attendance/attendanceView.js`

The View may:

- render DOM
- manage form interaction state
- call `AttendanceManager`
- call `TeacherManager.refresh()` after completed mutations
- subscribe to Attendance, Sync, Login, Logout, and connection events
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

No new Service or Repository is planned unless a measured missing business boundary is discovered.

## Existing Manager Methods

Use the current boundaries:

- `AttendanceManager.loadDay(date)`
- `AttendanceManager.save(input)`
- `AttendanceManager.remove(input)`
- `TeacherManager.refresh()`
- `SyncManager.getStatus()`
- `LoginManager.logout()` through the existing Teacher shell

## Existing Events

Consume:

- `milkapp:attendance-day-loaded`
- `milkapp:attendance-saved`
- `milkapp:attendance-deleted`
- `milkapp:attendance-stock-queued`
- `milkapp:teacher-refreshed`
- Sync lifecycle/status events already used by the Teacher shell
- `milkapp:login-success`
- `milkapp:logout`

## Required Data Compatibility

Attendance record must remain compatible with:

- `clsId`
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

Sprint 4.2 does not add media input, but loaded records must not discard existing `photos` or `signature` values when an edit is saved. The View must preserve unsupported existing fields through its form model or Manager input.

## Required Business Protection

- Main Stock delta is always zero.
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

## Offline Scope

Sprint 4.2 must expose the existing partial-save/queue result in the UI.

A complete offline-first form-save UX, manual retry controls, item-level queue details, and restart/reconnect workflow remain in the next Offline Queue UI phase unless the existing Manager already supplies them without new business logic.

## Isolated Write Validation

Do not intentionally write Attendance against production classroom data for development validation.

Allowed validation targets:

- deterministic VM tests with mocked Managers
- a dedicated isolated Firebase project
- a disposable test room and date approved for testing

Record before/after values for:

- Attendance record
- Room Stock
- queue count
- ledger and stockLog when available

## Planned Tests

Add:

- `tests/attendance-ui-check.mjs`

Required static coverage:

- valid JavaScript
- dependency order in `index-v2.html`
- no Firebase or Repository access
- no `fetch()`
- no Local Storage or Session Storage ownership
- no stock-delta or ledger calculations in the View
- no Main Stock references for mutation

Required workflow coverage:

- authenticated Teacher renders only room students
- Admin session does not render Attendance form
- current date default
- load empty day
- load existing day
- preserve existing notes, photos, and signature values
- present/absent/unchecked totals
- save delegation
- edit delegation
- delete confirmation and delegation
- successful Room Stock result rendering
- partial-save/queued stock rendering
- queue-count refresh
- form clears after Logout
- zero and negative Room Stock display remains valid

All previous tests remain mandatory.

## Browser Gate

Desktop Chrome using isolated/disposable Attendance data:

- Admin Login remains unchanged
- Teacher Login renders shell and Attendance form
- authenticated room students display correctly
- load an empty date
- save a controlled record
- edit the controlled record and verify difference-only Room Stock result
- delete the controlled record and verify Room Stock restoration
- Console clean
- no cross-room request
- no Main Stock write
- Logout returns to login form

Responsive Chrome Device Toolbar at 820 x 1180:

- student rows remain readable
- present/absent controls remain usable
- notes input remains usable
- totals remain visible
- save/delete controls remain reachable
- status feedback remains readable
- no abnormal horizontal overflow
- Console clean

Physical iPad remains deferred and must not be represented as PASS.

## Network Gate

Normal form load:

- one date-scoped Attendance read only
- no full room-history Attendance read
- no full rooms read after Teacher Login
- no deferred Teacher collections

Save/edit/delete:

- only expected Attendance, Room Stock ETag, ledger, stockLog, updated data, and queue-related operations
- no Main Stock request or mutation
- no all-school Attendance request

## Automated Regression Gate

Run all existing tests plus:

```powershell
node tests/attendance-ui-check.mjs
```

The complete gate includes:

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

## Merge Gate

Sprint 4.2 may merge into `develop` only when:

- Attendance View uses Managers only
- no Firebase, Repository, storage, or stock business logic exists in the View
- authenticated-room student rendering passes
- create, edit-by-difference, and delete-restoration tests pass
- partial-save/queued feedback passes
- all previous and new automated tests pass
- isolated write validation passes
- desktop browser gate passes
- 820 x 1180 responsive gate passes
- Network and Console gates pass
- working tree is clean
- `index.html` and `teacher.html` remain unchanged

## Production Meaning

A Sprint 4.2 merge into `develop` does not authorize:

- replacement of `teacher.html`
- pending, retroactive, or vacation milk cutover
- photos, signatures, or printing cutover
- merge or deployment to `main`
- production traffic switching
- Firebase schema changes
- legacy-file removal
