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

92% — Attendance View, date-scoped authenticated-room loading, present/absent and notes controls, totals, save/edit/delete delegation, media-field preservation, Room Stock and queue feedback, all 15 automated tests, Admin regression, desktop Teacher read-only loading, exact-key Network evidence, responsive upper/middle interaction, responsive Logout, Console, branch synchronization, and clean working tree passed; responsive bottom action/status visibility and approved isolated create/edit/delete validation remain pending

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

✓ Added student number, name, and gender display

✓ Added present and absent controls

✓ Added per-student notes

✓ Added total, checked, present, absent, and unchecked counters

✓ Added save/edit through `AttendanceManager.save(input)`

✓ Added delete confirmation and `AttendanceManager.remove(input)`

✓ Added Room Stock before/after feedback from Manager results

✓ Added ETag conflict-count feedback

✓ Added Attendance-saved/Room-Stock-queued feedback

✓ Added audit-queue feedback

✓ Added Teacher shell refresh after completed mutations

✓ Added form clearing after Logout

✓ Added Admin session rejection

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

Desktop Browser Read-Only Gate Passed

✓ Admin Login displayed the existing Admin shell

✓ Admin Console displayed only `MilkSchoolSystem V2 Started`

✓ Admin Logout returned to the login form

✓ Teacher Login rendered the Teacher shell and Attendance form

✓ Authenticated room displayed 26 students

✓ Current date displayed as 2026-07-28

✓ Current date restored partial existing selections without error

✓ Existing date 2026-07-15 restored 26 checked and 26 present

✓ Student rows, present/absent controls, and notes fields displayed correctly

✓ Console displayed only `MilkSchoolSystem V2 Started`

✓ Logout returned to the login form

✓ No visible JavaScript error or warning

---

Desktop Network Evidence Passed with Scope Note

✓ Selected date 2026-07-15 requested one exact Attendance key: `{roomId}_2026-07-15.json`

✓ Exact-key request returned HTTP 200

✓ No full-history `mcAttendance.json?orderBy=...` request was visible

✓ No cross-room Attendance request was visible

✓ No Main Stock request was visible

✓ No PUT, PATCH, POST, or DELETE request was visible during read-only testing

Scope note:

- the supplied Network panel retained earlier Login and shell reads, including `settings.json` and `rooms.json`
- the capture proves the selected-date load used one exact Attendance key but is not used to measure fresh Login request counts
- the historical record size may include preserved legacy media fields

---

Responsive Interaction Gate — Partial Pass

Chrome Device Toolbar at 820 x 1180:

✓ Teacher header and read-only metrics remained contained

✓ Attendance date and load controls remained visible

✓ Totals remained visible and readable

✓ Student rows remained readable

✓ Present/absent controls were usable

✓ Two absent selections updated totals to 2 checked, 0 present, 2 absent, and 24 unchecked

✓ Notes inputs remained visible for the displayed rows

✓ No abnormal horizontal overflow was visible

✓ Visible Network reads returned HTTP 200

✓ No write request was visible

✓ Responsive Logout returned to the login form

✓ Room/role selector reset after Logout

✓ Password field returned empty

✓ Responsive Console displayed only `MilkSchoolSystem V2 Started`

✓ No visible application JavaScript error or warning

Scope note:

- DevTools displayed an Issues count, but no Issues details were supplied
- the clean Console evidence is recorded independently from the Issues badge

Still pending:

□ Scroll to the bottom and confirm Save and Delete controls remain reachable

□ Confirm status and error feedback areas remain readable

---

Approved Isolated Write Gate Pending

Do not write development Attendance against normal classroom data.

Allowed targets:

- mocked automated tests
- dedicated isolated Firebase project
- approved disposable room and date

Required evidence:

□ Record Attendance, Room Stock, Main Stock, queue count, ledger, and stockLog before testing

□ Create a controlled Attendance record

□ Verify only the present count is deducted from Room Stock

□ Edit from fewer to more present students and deduct only the increase

□ Edit from more to fewer present students and restore only the decrease

□ Delete and restore the previous present count

□ Verify Main Stock remains unchanged

□ Verify compatible Attendance key and fields

□ Verify ledger and stockLog where applicable

□ Verify partial-save queue feedback when deliberately simulated

---

Current Merge Decision

Sprint 4.2 is not ready to merge into `develop` until responsive bottom action/status evidence passes and approved isolated create/edit/delete validation is recorded.

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
