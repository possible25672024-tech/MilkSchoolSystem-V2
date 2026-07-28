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

65% — Attendance View, responsive daily form, date-scoped load, authenticated-room student rendering, present/absent and notes controls, totals, save/edit/delete delegation, compatible media-field preservation, Room Stock result feedback, partial-save queue feedback, App startup integration, automated workflow test, and implementation report completed; automated, browser, isolated write, responsive, Network, Console, and clean-tree gates remain pending

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

Sprint 4.2 Runtime Implemented

✓ Added `modules/attendance/attendanceView.js`

✓ Added date selector defaulting to the current local date

✓ Added date-scoped load through `AttendanceManager.loadDay(date)`

✓ Added authenticated-room student list from the existing Teacher snapshot

✓ Added student number, name, and gender display

✓ Added present and absent controls

✓ Added per-student notes

✓ Added total, checked, present, absent, and unchecked counters

✓ Added save and edit through `AttendanceManager.save(input)`

✓ Added explicit delete confirmation and `AttendanceManager.remove(input)`

✓ Added Room Stock before/after feedback from Manager results

✓ Added reported ETag conflict-count feedback

✓ Added Attendance-saved/Room-Stock-queued feedback

✓ Added audit-queue feedback

✓ Added Teacher shell refresh after completed mutations

✓ Added form clearing after Logout

✓ Added Admin session rejection

✓ Preserved existing `photos`, `signature`, `year`, `term`, and `savedAt` values during edits

✓ Kept Firebase, Repository, fetch, Local Storage, Session Storage, stock-delta, ledger, stockLog, retry, and ETag ownership out of the View

✓ Kept Main Stock out of the Attendance View

✓ Updated `index-v2.html` with responsive Attendance form markup and CSS

✓ Updated `modules/core/app.js` to initialize AttendanceView after TeacherView

✓ Added `tests/attendance-ui-check.mjs`

✓ Added `docs/ATTENDANCE_UI_IMPLEMENTATION_REPORT.md`

✓ Updated Cutover documentation regression checks for Sprint 4.2

✓ `index.html` unchanged

✓ `teacher.html` unchanged

---

Architecture Rules Preserved

- View owns DOM rendering and form interaction only.
- View calls AttendanceManager and TeacherManager.
- View does not access Firebase directly.
- View does not access Repositories directly.
- View does not call `fetch()`.
- View does not own browser storage.
- View does not calculate Room Stock differences.
- View does not construct ledger or stockLog records.
- View never mutates Main Stock.
- ETag, retry, partial-save, queue, and audit rules remain in existing Services and Managers.
- Teacher data remains limited to the authenticated room.
- Normal day load remains date-scoped and does not load full room history.

---

Data Compatibility Preserved

- `clsId` / authenticated `roomId`
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
- Attendance key `{roomId}_{YYYY-MM-DD}`

Sprint 4.2 does not add media inputs, but edits do not silently discard existing photos or signatures.

---

Automated Gate Pending

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

□ Feature branch synchronized with origin

□ Working tree clean

---

Browser Read-Only Gate Pending

□ Admin Login remains unchanged

□ Teacher Login renders the shell and Attendance form

□ Authenticated-room student list displays correctly

□ Current date defaults correctly

□ Empty date loads without full-history request

□ Existing date restores statuses and notes

□ No cross-room request

□ No Main Stock request

□ Logout returns to login form

□ Console clean

---

Isolated Write Gate Pending

Use only mocked tests, an isolated Firebase project, or an approved disposable room/date.

□ Record Attendance and Room Stock before testing

□ Create a controlled Attendance record

□ Verify only the present count is deducted from Room Stock

□ Edit from fewer to more present students and verify only the increase is deducted

□ Edit from more to fewer present students and verify only the decrease is restored

□ Delete and verify the previous present count is restored

□ Verify Main Stock remains unchanged

□ Verify compatible Attendance key and fields

□ Verify ledger and stockLog when available

□ Verify queue count and partial-save feedback when deliberately simulated

□ Verify no duplicate Attendance or Room Stock mutation during retry

---

Responsive and Network Gate Pending

Chrome Device Toolbar at 820 x 1180:

□ Student rows readable

□ Present/absent controls usable

□ Notes input usable

□ Totals visible

□ Save/delete controls reachable

□ Status feedback readable

□ No abnormal horizontal overflow

□ Console clean

Network:

□ Date load requests one Attendance key only

□ No full room-history Attendance request

□ No cross-room request

□ No Main Stock request or mutation

□ Writes occur only during approved isolated save/delete validation

---

Out of Scope

- pending milk
- retroactive milk
- vacation milk
- photos and signature input
- printing
- history-range views
- Report UI
- Admin operational UI
- XLSX parsing
- Firebase schema changes
- replacement or removal of `teacher.html`
- production deployment

---

Current Production Blockers

- Operational Admin UI remains in `index.html`.
- Pending, retroactive, vacation, media, signature, print, and full-history Teacher workflows remain in `teacher.html`.
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
- ETag conflicts read the latest Room Stock and recalculate before retry.
- Offline retries preserve the original Attendance baseline.
- Audit-only retries never repeat a successful Room Stock mutation.
- Reports remain read-only.
- Firebase paths and Attendance keys remain compatible.
- Room IDs remain stable.
- Negative Room Stock is not silently clamped.
- Legacy files remain available until explicit production-cutover approval.
