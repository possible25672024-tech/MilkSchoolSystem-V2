# MilkSchoolSystem-V2

# Sprint Status

Last Update

2026-07-28

---

Current Branch

feature/sprint-4.2-attendance-daily-ui

---

Current Version

V2

---

Current Sprint

Sprint 4.2 — Teacher Daily Attendance CRUD UI

Status

10% — Sprint plan initialized from the completed Sprint 4.1 Teacher shell; Attendance View implementation, workflow tests, isolated write validation, browser validation, responsive validation, Network validation, and clean-tree gate have not started

---

Completed Foundation

✓ Sprint 3.4.2 Recovery merged into `develop`

✓ Sprint 3.4.3 Stock Module merged into `develop`

✓ Sprint 3.4.4 Report Module merged into `develop`

✓ Sprint 3.5 Room Module merged into `develop`

✓ Sprint 3.6 Teacher Service Foundation merged into `develop`

✓ Sprint 3.7 Attendance Service Foundation merged into `develop`

✓ Sprint 3.8 Offline Queue and Sync Module merged into `develop`

✓ Sprint 3.9 Performance and Payload Optimization merged into `develop`

✓ Sprint 4.0 Cutover Readiness and Compatibility merged into `develop`

✓ Sprint 4.1 Teacher UI Shell and Read-Only State fast-forward merged into `develop`

✓ Modular Teacher shell displays school, room, teacher, Room Stock, connection state, queue count, and Logout

✓ Teacher core refresh remains four reads and approximately 1.6 KB in the recorded desktop environment

✓ Admin role routing remained unchanged

✓ Offline/Online and desktop/responsive Console gates passed

✓ Protected `index.html` and `teacher.html` remain operational

✓ Physical iPad remains deferred and must not be represented as PASS

---

Sprint 4.2 Goal

Add a modular daily Attendance interface to the V2 Teacher shell while preserving the completed Attendance, Room Stock, ETag, offline queue, recovery, and protected legacy behavior.

---

Sprint 4.2 In Scope

□ Date-scoped daily Attendance form

□ Current local date default

□ Load one day through `AttendanceManager.loadDay(date)`

□ Authenticated-room student list only

□ Present and absent controls

□ Per-student notes

□ Checked, present, absent, and unchecked totals

□ Create new record through `AttendanceManager.save(input)`

□ Edit existing record through `AttendanceManager.save(input)`

□ Delete through `AttendanceManager.remove(input)` with confirmation

□ Display Room Stock before and after successful mutations

□ Display ETag conflict retry count when available

□ Display partial-save and queued Room Stock status

□ Refresh Teacher Room Stock through the existing Manager boundary

□ Desktop browser validation

□ Chrome Device Toolbar validation at 820 x 1180

□ Isolated/disposable Attendance write validation only

---

Sprint 4.2 Architecture Rules

- Planned View file: `modules/attendance/attendanceView.js`.
- View owns DOM rendering and form interaction only.
- View calls `AttendanceManager`, `TeacherManager`, and existing shell boundaries.
- View must not access Firebase directly.
- View must not access Repositories directly.
- View must not call `fetch()`.
- View must not own Local Storage or Session Storage.
- View must not calculate Room Stock differences.
- View must not construct ledger or stockLog records.
- View must never mutate Main Stock.
- ETag, retry, partial-save, queue, and audit rules remain in existing Services and Managers.
- Teacher data remains limited to the authenticated room.
- Normal day load remains date-scoped and must not load full room history.

---

Required Data Compatibility

Loaded and edited records must preserve:

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

Sprint 4.2 does not add media inputs, but edits must not silently discard existing `photos` or `signature` values.

---

Planned Test

□ `tests/attendance-ui-check.mjs`

Required static coverage:

- valid JavaScript
- dependency order
- no Firebase or Repository access
- no `fetch()`
- no direct storage ownership
- no stock-delta, ledger, or Main Stock calculations in the View

Required workflow coverage:

- Teacher room student rendering
- Admin session rejection
- current date default
- empty-day load
- existing-day load
- existing notes, photos, and signature preservation
- present/absent/unchecked totals
- create delegation
- edit delegation
- delete confirmation and delegation
- successful Room Stock result rendering
- partial-save and queued Room Stock feedback
- queue-count refresh
- form clearing after Logout
- zero and negative Room Stock compatibility

---

Automated Regression Gate

□ `node tests/login-foundation-check.mjs`

□ `node tests/stock-module-check.mjs`

□ `node tests/report-module-check.mjs`

□ `node tests/room-module-check.mjs`

□ `node tests/teacher-module-check.mjs`

□ `node tests/attendance-module-check.mjs`

□ `node tests/sync-module-check.mjs`

□ `node tests/firebase-request-header-check.mjs`

□ `node tests/performance-module-check.mjs`

□ `node tests/teacher-core-payload-check.mjs`

□ `node tests/cutover-concurrency-check.mjs`

□ `node tests/audit-recovery-check.mjs`

□ `node tests/cutover-documentation-check.mjs`

□ `node tests/teacher-ui-shell-check.mjs`

□ `node tests/attendance-ui-check.mjs`

---

Browser Gate

Desktop Chrome using isolated/disposable Attendance data:

□ Admin Login remains unchanged

□ Teacher Login renders shell and Attendance form

□ Authenticated room students display correctly

□ Load an empty test date

□ Save a controlled record

□ Edit the controlled record and verify difference-only Room Stock result

□ Delete the controlled record and verify Room Stock restoration

□ Partial-save/queued feedback behaves correctly

□ No cross-room request

□ No Main Stock request or mutation

□ Logout returns to login form

□ Console clean

Chrome Device Toolbar at 820 x 1180:

□ Student rows remain readable

□ Present/absent controls remain usable

□ Notes input remains usable

□ Totals remain visible

□ Save/delete controls remain reachable

□ Status feedback remains readable

□ No abnormal horizontal overflow

□ Console clean

Physical iPad remains deferred and must not be represented as PASS.

---

Network Gate

Normal form load:

□ One date-scoped Attendance read only

□ No full room-history Attendance read

□ No full rooms read after Teacher Login

□ No deferred Teacher collections

Save/edit/delete:

□ Only expected Attendance, Room Stock ETag, ledger, stockLog, updated data, and queue-related operations

□ No Main Stock request or mutation

□ No all-school Attendance request

---

Out of Scope

- Pending milk
- Retroactive milk
- Vacation milk
- Photos and signatures
- Printing
- Attendance history-range views
- Report UI
- Admin UI
- XLSX parsing
- Firebase schema changes
- Replacement or removal of `teacher.html`
- Production deployment

---

Current Production Blockers

- Operational Admin UI remains in `index.html`.
- Pending, retroactive, vacation, media, signature, print, and history-range Teacher workflows remain in `teacher.html`.
- Report browser-local adapter is not implemented.
- XLSX binary parsing remains in the protected legacy flow.
- Real isolated Firebase multi-writer evidence is not recorded.
- Real sanitized legacy queue evidence is not recorded.
- Backup export and isolated restore rehearsal are not recorded.
- Physical iPad evidence remains deferred.
- Explicit production approval is not granted.

---

Protected Business Rules

- Main Stock decreases only on classroom distribution.
- Classroom distribution increases Room Stock.
- Teacher, Attendance, Pending, Retroactive, Vacation, and Sync operations change Room Stock only.
- Attendance edits change Room Stock by the present-count difference only.
- Attendance deletion restores previously consumed Room Stock.
- Attendance key remains `{roomId}_{YYYY-MM-DD}`.
- ETag conflicts read the latest Room Stock and recalculate before retry.
- Offline retries preserve the original Attendance baseline.
- Partial saves queue only the unresolved Room Stock adjustment.
- Audit-only retries never repeat a successful Room Stock mutation.
- Reports remain read-only.
- Firebase paths remain compatible.
- Room IDs remain stable.
- Negative Room Stock is not silently clamped.
- Legacy files remain available until explicit production-cutover approval.
