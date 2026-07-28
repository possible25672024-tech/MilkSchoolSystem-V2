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

85% — Attendance View, responsive form foundation, date-scoped loading, authenticated-room students, present/absent and notes controls, totals, save/edit/delete delegation, media-field preservation, Room Stock result feedback, partial-save feedback, all 15 automated tests, Admin regression, desktop Teacher read-only loading, current-date rendering, existing-date restoration, one-key Attendance Network evidence, Console, Logout, branch synchronization, and clean working tree passed; 820 x 1180 Attendance interaction and approved isolated create/edit/delete validation remain pending

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

✓ Added date-scoped load through `AttendanceManager.loadDay(date)`

✓ Added authenticated-room student list from the existing Teacher snapshot

✓ Added student number, name, and gender display

✓ Added present and absent controls

✓ Added per-student notes

✓ Added total, checked, present, absent, and unchecked counters

✓ Added save and edit through `AttendanceManager.save(input)`

✓ Added explicit delete confirmation and `AttendanceManager.remove(input)`

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

✓ Added responsive Attendance form markup and CSS to `index-v2.html`

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

✓ Current date displayed as 2026-07-28 in the date control

✓ Current date showed 3 checked, 3 present, 0 absent, and 23 unchecked

✓ Existing date 2026-07-15 restored 26 checked and 26 present

✓ Student rows, present/absent controls, and notes fields displayed correctly

✓ Console displayed only `MilkSchoolSystem V2 Started`

✓ Logout returned to the login form

✓ No visible JavaScript error or warning in the supplied Console captures

---

Desktop Network Evidence Passed with Scope Note

✓ Selected date 2026-07-15 requested one exact Attendance key: `{roomId}_2026-07-15.json`

✓ Exact-key request returned HTTP 200

✓ No full-history `mcAttendance.json?orderBy=...` request was visible

✓ No cross-room Attendance request was visible

✓ No Main Stock request was visible

✓ No PUT, PATCH, POST, or DELETE request was visible during the read-only test

Scope note:

- the supplied Network panel retained earlier Login and shell requests, including `settings.json` and `rooms.json`;
- therefore the capture proves the selected-date load used one exact Attendance key, but it is not used to measure fresh Login request counts;
- DevTools displayed an Issues count, but the Issues details were not supplied and are not classified as application JavaScript errors by this evidence.

---

Responsive Interaction Gate Pending

Chrome Device Toolbar at 820 x 1180:

□ Student rows readable

□ Present/absent controls usable

□ Notes input usable

□ Totals visible

□ Save and delete controls reachable

□ Status feedback readable

□ No abnormal horizontal overflow

□ Console clean

---

Approved Isolated Write Gate Pending

Do not write development Attendance against normal classroom data.

Allowed targets:

- mocked automated tests
- a dedicated isolated Firebase project
- an approved disposable room and date

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

□ Verify no duplicate Attendance or Room Stock mutation during retry

---

Out of Scope

- pending milk
- retroactive milk
- vacation milk
- photo and signature input
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
