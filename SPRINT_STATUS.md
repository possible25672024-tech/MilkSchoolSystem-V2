# MilkSchoolSystem-V2

# Sprint Status

Last Update

2026-07-29

---

Current Branch

feature/sprint-4.4-pending-milk-ui

---

Current Version

V2

---

Current Sprint

Sprint 4.4 — Pending Milk Operational UI

Status

70% — Legacy `absentMilk` audit, Repository, Service, Manager, View, App integration, module test, and typed `PENDING`/`ROLLBACK` recovery routing are implemented. The Pending Milk module test passed locally. Recovery routing local execution, UI test, complete isolated write/partial-save gate, full regression, browser, and responsive gates remain pending.

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

✓ Sprint 4.2 Teacher Daily Attendance CRUD UI merged into `develop`

✓ Sprint 4.3 Offline Queue Operational UI fast-forward merged into `develop`

✓ All 18 Sprint 4.3 regression checks passed

✓ Protected `index.html` and `teacher.html` remain operational

✓ Physical iPad remains deferred and must not be represented as PASS

---

Legacy Compatibility Audit — PASS

Protected `teacher.html` was inspected read-only.

Confirmed:

✓ Firebase path `milkApp/absentMilk`

✓ Firebase push ID record keys

✓ Monday–Friday weekly eligibility

✓ One absent student/date pair equals one box

✓ Duplicate identity is `studentId + Attendance date`

✓ Existing issue detection uses `record.students[studentId].days`

✓ Legacy fields `weekStart`, `weekEnd`, `roomId`, `roomName`, `teacher`, issue `date`, `students`, `totalBoxes`, `note`, `signature`, `signatures`, `photos`, and `savedAt`

✓ Issue saves record first, then deducts Room Stock

✓ Delete removes record first, then restores Room Stock

✓ Ledger type `PENDING` on issue

✓ Ledger type `ROLLBACK` on delete

✓ Main Stock remains unchanged

Artifact:

- `docs/PENDING_MILK_LEGACY_AUDIT.md`

---

Runtime Implemented

✓ `modules/repositories/pendingMilkRepository.js`

- exact five Attendance child reads
- room-scoped `absentMilk` query
- Firebase push record creation
- exact record load/delete
- protected legacy paths unchanged

✓ `modules/services/pendingMilkService.js`

- UTC-safe Monday–Friday range
- authenticated-room-only access
- absent-only eligibility
- already-issued exclusion
- Service-level duplicate recheck immediately before save
- legacy-compatible record construction
- Room Stock-only issue and rollback
- PENDING/ROLLBACK ledger and OUT/IN stockLog construction
- ETag stock workflow reused through the completed Attendance stock boundary
- Main Stock delta zero
- explicit partial-save error details

✓ `modules/pending/pendingMilkManager.js`

- UI-safe week load, issue, and remove commands
- audit queue delegation
- Room Stock retry queue delegation
- duplicate delete/rollback in-flight guard
- lifecycle events and state clear

✓ `modules/pending/pendingMilkView.js`

- Teacher-only operational panel
- week-date selection
- eligible, already issued, selected, and box totals
- selectable student/date rows
- note input
- issue confirmation and feedback
- recent room history
- confirmed delete and stock restoration feedback
- responsive layout
- no direct Firebase, Repository, fetch, Local Storage, Session Storage, eligibility, duplicate, stock, ledger, or stockLog logic

✓ App dynamically loads Repository, Service, Manager, and View after the completed Queue UI

✓ `index.html` unchanged

✓ `teacher.html` unchanged

---

Pending Milk Module Gate — PASS

Test:

- `tests/pending-milk-module-check.mjs`

Confirmed locally:

✓ Runtime JavaScript syntax

✓ legacy schema evidence remains present

✓ room-scoped repository boundary

✓ exact Attendance date reads

✓ Monday–Friday range

✓ absent-only eligibility

✓ already-issued exclusion

✓ two-student issue quantity

✓ legacy-compatible record fields

✓ PENDING ledger and OUT stockLog

✓ duplicate issue rejection

✓ delete rollback with ROLLBACK ledger and IN stockLog

✓ Room Stock returns to baseline

✓ Main Stock remains 999

✓ cross-room rejection

✓ View architecture restrictions

✓ `Pending Milk module checks passed.`

---

Recovery Routing Gate — IMPLEMENTED / LOCAL EXECUTION PENDING

Updated:

- `modules/storage/queueStorage.js`
- `modules/services/syncService.js`
- `modules/sync/syncManager.js`
- `modules/sync/syncView.js`

Added:

- `tests/pending-milk-recovery-routing-check.mjs`
- `docs/PENDING_MILK_RECOVERY_ROUTING_GATE.md`

Implemented:

✓ Existing queue key remains `tc_pending_saves_v1`

✓ Legacy `diff` alias remains compatible

✓ Existing entries without operation metadata default to `ATTENDANCE`

✓ `operationType: PENDING` persists for issue retries

✓ `operationType: ROLLBACK` persists for delete retries

✓ Pending-specific reviewed note metadata persists

✓ Attendance retries continue through the existing Attendance route

✓ PENDING retries create PENDING ledger and OUT stockLog

✓ ROLLBACK retries create ROLLBACK ledger and IN stockLog

✓ Typed retries remain Room Stock-only

✓ Main Stock delta remains zero

✓ Failed audit converts to audit-only work

✓ Audit-only retry preserves the original PENDING/ROLLBACK audit payload

✓ Audit-only retry never repeats Room Stock mutation

✓ Queue UI labels typed Pending Milk retries safely

Local command pending:

```powershell
node tests/pending-milk-recovery-routing-check.mjs
```

Until this gate passes locally:

- do not perform browser Pending Milk writes;
- do not create real queue entries;
- use isolated/in-memory tests only.

---

Remaining Tests

□ Run `tests/pending-milk-recovery-routing-check.mjs`

□ Add `tests/pending-milk-ui-check.mjs`

□ Add `tests/pending-milk-isolated-write-check.mjs`

□ Run all existing 18 tests plus all Sprint 4.4 tests

Expected final count: at least 22 tests.

---

Browser and Responsive Gates — Not Started

Desktop Chrome read-only gate:

□ Admin Login/Logout unchanged

□ Teacher Pending Milk panel renders

□ Selected week loads only five authenticated-room Attendance records

□ `absentMilk` request is room-scoped

□ Eligible and already-issued states render correctly

□ No mutation during read-only validation

□ Console clean

Chrome Device Toolbar at 820 x 1180:

□ Date, totals, student rows, history, feedback, action, and Logout remain reachable

□ No abnormal horizontal overflow

□ Console clean

All browser write interaction remains prohibited until the complete isolated write and recovery gates pass.

---

Out of Scope

- Retroactive Milk
- Vacation Milk
- photos and signatures capture
- Attendance history and printing
- Report UI
- Admin operational UI
- Firebase schema migration
- replacement or removal of `teacher.html`
- production deployment
- real-classroom write tests

---

Deferred Real-Classroom Incident — OPEN

Quarantined:

- room `อ.3-3`
- room ID `mqn0z13eyx5b`
- date `2026-07-28`
- Attendance 22 present / 3 absent
- Room Stock 1,253 versus recorded pre-test 1,275
- known discrepancy -22

Rules:

- do not use the quarantined room/date for Pending Milk or Queue tests
- do not use its values as trusted operational evidence
- do not manually edit Attendance, Room Stock, Main Stock, queue, ledger, stockLog, or transaction history
- recovery remains mandatory before `main` or production cutover

---

Protected Business Rules

- Main Stock decreases only on classroom distribution.
- Pending Milk deducts Room Stock only.
- One eligible student/date pair equals one box.
- Quantity is deducted exactly once.
- Duplicate issue is blocked by Service logic.
- Teacher access remains limited to the authenticated room.
- ETag conflicts read the latest Room Stock and recalculate before retry.
- Audit-only recovery never repeats a successful Room Stock mutation.
- Existing Attendance records are read-only eligibility sources.
- Firebase path `milkApp/absentMilk` remains compatible.
- Queue storage key remains `tc_pending_saves_v1`.
- Negative Room Stock is not silently clamped.
- Legacy files remain available until explicit production-cutover approval.
