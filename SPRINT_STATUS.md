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

97% — Attendance View, all 15 automated tests, Admin regression, desktop date-scoped read, exact-key Network evidence, complete 820 x 1180 responsive interaction, one successful save with correct Room Stock delta, one successful delete with exact Room Stock restoration, clean Console, branch synchronization, and clean working tree passed; target isolation, Main Stock, ledger/stockLog, queue, and controlled edit-increase/edit-decrease evidence remain pending

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

✓ Sprint 4.1 Teacher UI Shell and Read-Only State merged into `develop`

✓ Protected `index.html` and `teacher.html` remain operational

✓ Physical iPad remains deferred and must not be represented as PASS

---

Sprint 4.2 Runtime Implemented

✓ Added `modules/attendance/attendanceView.js`

✓ Added date selector defaulting to the current local date

✓ Added one-date loading through `AttendanceManager.loadDay(date)`

✓ Added authenticated-room student list from the Teacher snapshot

✓ Added present and absent controls and per-student notes

✓ Added total, checked, present, absent, and unchecked counters

✓ Added save/edit through `AttendanceManager.save(input)`

✓ Added delete confirmation and `AttendanceManager.remove(input)`

✓ Added Room Stock before/after feedback from Manager results

✓ Added ETag conflict-count, queue, and audit feedback

✓ Added Teacher shell refresh after completed mutations

✓ Added form clearing after Logout and Admin session rejection

✓ Preserved existing `photos`, `signature`, `year`, `term`, and `savedAt` during edits

✓ Kept Firebase, Repository, fetch, browser storage, stock calculation, ledger, stockLog, retry, and ETag ownership out of the View

✓ Kept Main Stock out of the Attendance View

✓ Added responsive Attendance markup and CSS to `index-v2.html`

✓ Initialized AttendanceView after TeacherView

✓ Added `tests/attendance-ui-check.mjs`

✓ Added `docs/ATTENDANCE_UI_IMPLEMENTATION_REPORT.md`

✓ Corrected the Node.js 24 cross-VM Array assertion without changing Runtime behavior

✓ `index.html` unchanged

✓ `teacher.html` unchanged

---

Automated Gate Passed

✓ Login foundation checks

✓ Stock module checks

✓ Report module checks

✓ Room module checks

✓ Teacher module checks

✓ Attendance module checks

✓ Sync module checks

✓ Firebase request-header checks

✓ Performance module checks

✓ Teacher core-payload checks

✓ Cutover concurrency checks

✓ Audit recovery checks

✓ Cutover documentation checks

✓ Teacher UI shell checks

✓ Attendance UI checks

✓ Feature branch synchronized with origin

✓ Working tree clean

---

Desktop Browser and Network Gate Passed

✓ Admin Login and Logout remained unchanged

✓ Teacher Login rendered the Attendance form for the authenticated room

✓ Current and historical date records loaded without JavaScript errors

✓ Selected date requested one exact Attendance key: `{roomId}_{YYYY-MM-DD}.json`

✓ No full-history `mcAttendance.json?orderBy=...` request was visible

✓ No cross-room Attendance request was visible

✓ No Main Stock request was visible during read-only testing

✓ No write request occurred during read-only testing

✓ Console displayed only `MilkSchoolSystem V2 Started`

---

Responsive Interaction Gate Passed

Chrome Device Toolbar at 820 x 1180:

✓ Teacher header and read-only metrics remained contained

✓ Attendance date, totals, all student rows, notes, and controls remained reachable

✓ Present/absent selections updated totals correctly

✓ `บันทึกข้อมูล` remained visible and reachable

✓ `ลบข้อมูลวันที่เลือก` remained visible and reachable

✓ Teacher Logout remained visible and reachable

✓ No abnormal horizontal overflow was visible

✓ Responsive Logout returned to the login form

✓ Responsive Console displayed only `MilkSchoolSystem V2 Started`

---

Observed Write Evidence — Partial Pass

✓ A successful save reported 22 present and 3 absent students

✓ That save reported Room Stock `1,275 → 1,253`, a decrease of 22 matching the present count

✓ A later successful save reported 7 present and 3 absent students

✓ That save reported Room Stock `350 → 343`, a decrease of 7 matching the present count

✓ Delete required explicit confirmation for date `2026-07-28`

✓ Delete reported restoration of 7 boxes

✓ Delete reported Room Stock `343 → 350`, exactly reversing the prior 7-box deduction

✓ Console remained free of visible application JavaScript errors

What remains unverified:

□ The write target was a dedicated isolated Firebase project or approved disposable room/date

□ Attendance exact key and record before/after

□ Main Stock before/after

□ queue count before/after

□ ledger and stockLog records

□ controlled edit from fewer to more present students

□ controlled edit from more to fewer present students

---

Approved Isolated Write Gate — Not Complete

Do not continue development writes against normal classroom data.

Allowed targets:

- mocked automated tests
- dedicated isolated Firebase project
- approved disposable room and date

Required completion evidence:

□ Confirm target isolation or disposable approval

□ Record Attendance, Room Stock, Main Stock, queue count, ledger, and stockLog before and after

□ Verify create

□ Verify edit from fewer to more present students and deduct only the increase

□ Verify edit from more to fewer present students and restore only the decrease

✓ Verify delete restores the previous present count at the UI result level

□ Verify Main Stock remains unchanged

□ Verify compatible Attendance key and fields

□ Verify ledger and stockLog where applicable

□ Verify partial-save queue feedback when deliberately simulated

---

Current Merge Decision

Sprint 4.2 is not ready to merge into `develop` until target isolation is confirmed and the remaining controlled write evidence is recorded.

---

Protected Business Rules

- Main Stock decreases only on classroom distribution.
- Classroom distribution increases Room Stock.
- Teacher and Attendance operations change Room Stock only.
- Attendance edits change Room Stock by the difference only.
- Attendance deletion restores previously consumed Room Stock.
- ETag conflicts read the latest Room Stock and recalculate before retry.
- Offline retries preserve the original Attendance baseline.
- Audit-only retries never repeat a successful Room Stock mutation.
- Attendance keys remain compatible.
- Teacher access remains limited to the authenticated room.
- Negative Room Stock is not silently clamped.
- Legacy files remain available until explicit production-cutover approval.
