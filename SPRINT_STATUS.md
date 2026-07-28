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

100% CODE COMPLETE — Runtime, all 16 automated regression checks, isolated create/edit/delete/queue validation, Admin regression, desktop exact-date Network evidence, complete 820 x 1180 responsive interaction, branch synchronization, and clean working tree passed. Approved for fast-forward merge into `develop`. The deferred real-classroom incident remains open and continues to block `main`, production cutover, and official use of the quarantined room/date.

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

Sprint 4.2 Runtime Completed

✓ Added `modules/attendance/attendanceView.js`

✓ Added date-scoped daily Attendance form

✓ Added authenticated-room student list

✓ Added present/absent controls and per-student notes

✓ Added total, checked, present, absent, and unchecked counters

✓ Added load through `AttendanceManager.loadDay(date)`

✓ Added create/edit through `AttendanceManager.save(input)`

✓ Added confirmed delete through `AttendanceManager.remove(input)`

✓ Added Room Stock before/after, ETag conflict, queue, and audit feedback

✓ Preserved `photos`, `signature`, `year`, `term`, and `savedAt` during edits

✓ Kept Firebase, Repository, fetch, storage, stock calculations, ledger, retry, and ETag ownership out of the View

✓ Kept Main Stock isolated from Attendance UI operations

✓ Added responsive Attendance markup and CSS to `index-v2.html`

✓ Initialized AttendanceView after TeacherView

✓ Added `tests/attendance-ui-check.mjs`

✓ Added `tests/attendance-isolated-write-check.mjs`

✓ Added Sprint implementation, isolated-write, and incident documentation

✓ `index.html` unchanged

✓ `teacher.html` unchanged

---

Automated Regression Gate Passed

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

✓ Attendance isolated write checks

✓ Feature branch synchronized with origin

✓ Working tree clean

The complete run initially stopped on an exact documentation-wording assertion. Only that assertion was changed to accept both valid Sprint 4.1 merge phrases. The corrected documentation test and the remaining tests then passed. All 16 checks are accepted for the Sprint 4.2 code gate.

---

Isolated Attendance Write Gate Passed

In-memory baseline:

- room ID `isolated-room`
- Room Stock 50
- Main Stock 999
- no Firebase connection
- no production repository
- empty Attendance, queue, ledger, and stockLog

Verified:

✓ Create 3 present: Room Stock `50 → 47`

✓ Edit 3 to 5 present: deduct only 2, Room Stock `47 → 45`

✓ Edit 5 to 2 present: restore only 3, Room Stock `45 → 48`

✓ Delete 2-present record: restore 2, Room Stock `48 → 50`

✓ Main Stock remained 999

✓ Compatible Attendance key and fields preserved

✓ One ledger and stockLog entry per successful operation

✓ Successful CRUD created no retry queue entries

✓ Deliberate stock failure after Attendance save queued exactly one Room Stock retry

✓ Queue difference and Attendance reference remained exact

✓ Manager emitted persistent queue feedback

---

Browser and Responsive Gates Passed

✓ Admin Login and Logout remained unchanged

✓ Teacher Login rendered Attendance for the authenticated room

✓ Current and historical dates loaded without JavaScript errors

✓ Selected date requested one exact Attendance key

✓ No full-history or cross-room Attendance read was visible

✓ No Main Stock request occurred during read-only testing

✓ Desktop Console displayed only `MilkSchoolSystem V2 Started`

✓ 820 x 1180 Teacher header, Room Stock, queue, date, totals, all student rows, notes, Save, Delete, and Logout remained reachable

✓ Present/absent selections updated totals correctly

✓ No abnormal horizontal overflow was visible

✓ Responsive Logout returned to Login

✓ Responsive Console remained clean

---

Real Classroom Data Incident — DEFERRED / OPEN

The product owner deferred recovery so development could continue.

Quarantined discrepancy:

- room `อ.3-3`
- room ID `mqn0z13eyx5b`
- date `2026-07-28`
- test-created Attendance remains with 22 present and 3 absent
- Room Stock remains 1,253 instead of recorded pre-test 1,275
- known difference: -22

Reconciled room:

- room `อ.3-4`
- room ID `mqn0z13emyrc`
- Attendance is `null`
- Room Stock is 350

Quarantine rules:

- do not use `อ.3-3` or `2026-07-28` for further write testing
- do not treat the affected Attendance, Room Stock, or report values as trusted operational evidence
- do not manually rewrite stock, ledger, stockLog, or transaction history
- use only mocked, in-memory, isolated Firebase, or explicitly disposable targets for future write validation

Recovery remains mandatory before `main`, production cutover, or official operational acceptance.

---

Integration Decision

APPROVED FOR FAST-FORWARD MERGE INTO `develop`

NOT APPROVED FOR:

- merge to `main`
- production traffic switching
- replacement or removal of `teacher.html`
- official use of the quarantined room/date
- claiming the Firebase database is fully reconciled

---

Protected Business Rules

- Main Stock decreases only on classroom distribution.
- Classroom distribution increases Room Stock.
- Teacher and Attendance operations change Room Stock only.
- Attendance edits change Room Stock by the present-count difference only.
- Attendance deletion restores previously consumed Room Stock.
- ETag conflicts read the latest Room Stock and recalculate before retry.
- Offline retries preserve the original Attendance baseline.
- Audit-only retries never repeat a successful Room Stock mutation.
- Attendance keys remain compatible.
- Teacher access remains limited to the authenticated room.
- Negative Room Stock is not silently clamped.
- Legacy files remain available until explicit production-cutover approval.
