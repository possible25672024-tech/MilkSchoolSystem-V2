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

97% — Runtime, the original 15 automated tests, Admin regression, desktop date-scoped read, exact-key Network evidence, and complete 820 x 1180 responsive gates passed. A complete in-memory isolated create/edit/delete/queue test has now been added and awaits local execution plus the full regression suite. Real-classroom recovery remains deferred; room `อ.3-3` stays quarantined and production cutover remains blocked until that incident is reconciled.

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

✓ Added `tests/attendance-isolated-write-check.mjs`

✓ Added `docs/ATTENDANCE_UI_IMPLEMENTATION_REPORT.md`

✓ Added `docs/ATTENDANCE_ISOLATED_WRITE_GATE.md`

✓ Added and updated `docs/ATTENDANCE_REAL_DATA_TEST_INCIDENT.md`

✓ `index.html` unchanged

✓ `teacher.html` unchanged

---

Original Automated Gate Passed

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

Isolated Automated Write Gate — Implemented / Local Run Pending

File:

- `tests/attendance-isolated-write-check.mjs`

In-memory only:

✓ Uses room `isolated-room`, Room Stock 50, and Main Stock 999 inside the Node.js process

✓ Does not load FirebaseService or the production AttendanceRepository

✓ Does not call the production Firebase URL

Coverage awaiting local confirmation:

□ Create 3 present: Room Stock `50 → 47`

□ Edit 3 to 5 present: deduct only 2, Room Stock `47 → 45`

□ Edit 5 to 2 present: restore only 3, Room Stock `45 → 48`

□ Delete 2-present record: restore 2, Room Stock `48 → 50`

□ Verify Main Stock remains 999 through all operations

□ Verify compatible Attendance key and fields

□ Verify one ledger and stockLog entry per successful operation

□ Verify successful CRUD creates no retry queue entries

□ Deliberately fail Room Stock after Attendance save and verify exactly one protected retry is queued

□ Verify queue difference and reference key remain exact

□ Verify Manager emits persistent queue feedback

Run:

```powershell
node tests/attendance-isolated-write-check.mjs
```

Expected:

```text
Attendance isolated write checks passed.
```

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

The incident is not resolved. Recovery remains on the mandatory pre-production checklist.

---

Remaining Gate

□ Run `tests/attendance-isolated-write-check.mjs`

□ Run the complete regression suite including all 16 tests

□ Confirm feature branch synchronized with origin

□ Confirm working tree clean

---

Current Development Decision

DEVELOPMENT MAY CONTINUE

Sprint 4.2 may proceed using automated isolated tests only. No additional real-classroom writes are permitted.

A merge into `develop` may be considered after the isolated automated write gate and the full regression suite pass. This does not authorize merge to `main` or production cutover while the real-data incident remains open.
