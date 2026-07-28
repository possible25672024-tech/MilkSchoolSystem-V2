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

95% — Runtime, all 15 automated tests, Admin regression, desktop date-scoped read, exact-key Network evidence, and complete 820 x 1180 responsive gates passed. Real-classroom recovery was deferred by the product owner so development can continue. Room `อ.3-3` remains quarantined with a known Attendance/Room Stock discrepancy. The remaining code gate is a complete isolated automated create/edit/delete validation. Production cutover remains blocked until the real-data incident is reconciled and closed.

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

✓ Added and updated `docs/ATTENDANCE_REAL_DATA_TEST_INCIDENT.md`

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

Real Classroom Data Incident — DEFERRED / OPEN

The product owner requested postponement of corrective recovery so implementation can continue.

Known quarantined discrepancy:

- room: `อ.3-3`
- room ID: `mqn0z13eyx5b`
- date: `2026-07-28`
- test-created Attendance record remains with 22 present and 3 absent
- Room Stock remains 1,253 instead of the recorded pre-test value 1,275
- known difference: -22

Reconciled room:

- room: `อ.3-4`
- room ID: `mqn0z13emyrc`
- Attendance is `null`
- Room Stock is 350

Quarantine rules:

- do not use Room `อ.3-3` or date `2026-07-28` for further write testing
- do not treat Room A Attendance, Room Stock, or report values as trusted operational evidence
- do not manually rewrite stock, ledger, stockLog, or transaction history
- use only mocked, in-memory, isolated Firebase, or disposable targets for future write validation

The incident is not resolved. Recovery is moved to the mandatory pre-production checklist.

---

Approved Isolated Write Gate — Not Complete

The real-data observations do not count as the approved isolated write gate.

Required next:

□ Add or run a complete isolated automated write test

□ Verify create deducts exactly the present count from Room Stock

□ Verify edit from fewer to more present students deducts only the increase

□ Verify edit from more to fewer present students restores only the decrease

□ Verify delete restores the previous present count

□ Verify Main Stock remains unchanged

□ Verify compatible Attendance key and fields

□ Verify queue feedback when deliberately simulated

□ Run the full regression suite and confirm a clean working tree

---

Current Development Decision

DEVELOPMENT MAY CONTINUE

Sprint 4.2 may proceed using automated isolated tests only. No additional real-classroom writes are permitted.

A merge into `develop` may be considered after the complete isolated automated write gate and full regression suite pass.

---

Production and Release Decision

BLOCKED

The following remain prohibited until the deferred incident is reconciled and explicitly closed:

- merge to `main`
- production cutover
- official acceptance of the affected Room A Attendance, stock, or reports
- removal of protected legacy rollback paths

Before production use:

- export Firebase
- recover or reconcile Room `อ.3-3`
- verify Attendance becomes `null`
- verify Room Stock is authoritative
- verify Main Stock is unchanged
- review queue, ledger, stockTransactions, and stockLog
- close the incident explicitly

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
