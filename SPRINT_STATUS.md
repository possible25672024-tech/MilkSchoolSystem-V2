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

95% — Runtime, all 15 automated tests, Admin regression, desktop date-scoped read, exact-key Network evidence, and complete 820 x 1180 responsive gates passed. A Save/Delete test was confirmed to have used real classroom data; the incident is open, Sprint merge is blocked, real data must be verified and reconciled, and the complete write gate must be repeated on an isolated or approved disposable target.

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

✓ Added date selector and exact one-date loading through `AttendanceManager.loadDay(date)`

✓ Added authenticated-room student list, present/absent controls, notes, and totals

✓ Added save/edit delegation through `AttendanceManager.save(input)`

✓ Added confirmed delete delegation through `AttendanceManager.remove(input)`

✓ Added Room Stock before/after, conflict, queue, and audit feedback

✓ Preserved existing `photos`, `signature`, `year`, `term`, and `savedAt`

✓ Kept Firebase, Repository, fetch, browser storage, stock calculation, ledger, stockLog, retry, and ETag ownership out of the View

✓ Added responsive Attendance markup and CSS to `index-v2.html`

✓ Added `tests/attendance-ui-check.mjs`

✓ Added `docs/ATTENDANCE_UI_IMPLEMENTATION_REPORT.md`

✓ Added `docs/ATTENDANCE_REAL_DATA_TEST_INCIDENT.md`

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

✓ Teacher Login rendered Attendance for the authenticated room

✓ Current and historical date records loaded without JavaScript errors

✓ Selected date requested one exact Attendance key: `{roomId}_{YYYY-MM-DD}.json`

✓ No full-history or cross-room Attendance request was visible

✓ No Main Stock request or write request occurred during read-only testing

✓ Console displayed only `MilkSchoolSystem V2 Started`

---

Responsive Interaction Gate Passed

Chrome Device Toolbar at 820 x 1180:

✓ Teacher header, Room Stock, queue, date, totals, all student rows, notes, and controls remained reachable

✓ Present/absent selections updated totals correctly

✓ Save, Delete, and Logout remained visible and reachable

✓ No abnormal horizontal overflow was visible

✓ Responsive Logout returned to the login form

✓ Responsive Console displayed only `MilkSchoolSystem V2 Started`

---

Real Classroom Data Incident — OPEN

The product owner confirmed that the observed Save/Delete validation used real classroom data.

Observed:

- one save reported 22 present and Room Stock `1,275 → 1,253`
- another save reported 7 present and Room Stock `350 → 343`
- delete reported restoration of 7 and Room Stock `343 → 350`
- Console remained free of visible application JavaScript errors

Assessment:

- the second delete reversed the immediately preceding 7-box deduction at the displayed UI-result level
- this does not prove the original real Attendance record was restored
- Git working-tree cleanliness does not prove Firebase data reconciliation

Required safety actions:

- stop all additional Save/Edit/Delete tests against real classroom data
- do not manually delete ledger or stockLog entries
- do not manually rewrite stock without a backup and reviewed reconciliation plan
- complete the read-only verification in `docs/ATTENDANCE_REAL_DATA_TEST_INCIDENT.md`

---

Incident Verification Pending

□ Confirm affected room ID, room name, and date

□ Confirm whether the Attendance key currently exists

□ Compare current Attendance with authoritative school records

□ Verify current Room Stock against the authoritative expected value

□ Verify Main Stock against the authoritative expected value

□ Record queue count

□ Inspect related ledger, stockTransactions, and stockLog entries

□ Confirm whether the 22-present and 7-present sequences involved the same room

□ Export Firebase before any correction

□ Complete any required recovery and review

□ Close the incident

---

Approved Isolated Write Gate — Not Complete

The real-data observations do not count as the approved isolated write gate.

Required after incident closure:

□ Use a mocked, isolated Firebase, or approved disposable room/date target

□ Record Attendance, Room Stock, Main Stock, queue, ledger, and stockLog before and after

□ Verify create

□ Verify edit from fewer to more present students

□ Verify edit from more to fewer present students

□ Verify delete restoration

□ Verify Main Stock remains unchanged

□ Verify compatible Attendance key and fields

□ Verify queue feedback when deliberately simulated

---

Current Merge Decision

BLOCKED

Sprint 4.2 must not merge into `develop` until the real classroom data incident is verified and closed and the complete write gate is repeated on an isolated or approved disposable target.

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
