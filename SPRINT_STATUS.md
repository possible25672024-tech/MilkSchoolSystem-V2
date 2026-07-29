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

94% — Legacy compatibility, Repository, Service, Manager, View, App integration, typed recovery routing, Operational UI, isolated issue/delete/partial-save validation, and all 22 automated regression checks passed locally. Desktop read-only browser, Network, Console, and 820 x 1180 responsive gates remain pending.

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

✓ Compatible fields `weekStart`, `weekEnd`, `roomId`, `roomName`, `teacher`, issue `date`, `students`, `totalBoxes`, `note`, `signature`, `signatures`, `photos`, and `savedAt`

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

✓ `modules/services/pendingMilkService.js`

- UTC-safe Monday–Friday range
- authenticated-room-only access
- absent-only eligibility
- already-issued exclusion
- Service-level duplicate recheck before save
- compatible record construction
- Room Stock-only issue and rollback
- PENDING/ROLLBACK ledger and OUT/IN stockLog construction
- ETag stock workflow reused through Attendance stock boundary
- Main Stock delta zero
- explicit partial-save error details

✓ `modules/pending/pendingMilkManager.js`

- UI-safe week load, issue, and remove commands
- audit queue delegation
- typed Room Stock retry delegation
- duplicate delete/rollback in-flight guard
- lifecycle events and state clear

✓ `modules/pending/pendingMilkView.js`

- Teacher-only operational panel
- week-date selection
- eligible, already-issued, selected, and box totals
- selectable student/date rows
- note input
- issue confirmation and feedback
- recent room history
- confirmed delete and stock restoration feedback
- responsive layout
- no direct Firebase, Repository, fetch, Local Storage, Session Storage, eligibility, duplicate, stock, ledger, or stockLog logic

✓ App dynamically loads Repository, Service, Manager, and View after Queue UI

✓ `index.html` unchanged

✓ `teacher.html` unchanged

---

Sprint-Specific Gates — PASS

Module Gate:

✓ `tests/pending-milk-module-check.mjs`

✓ `Pending Milk module checks passed.`

Recovery Routing Gate:

✓ `tests/pending-milk-recovery-routing-check.mjs`

✓ legacy retries default to `ATTENDANCE`

✓ `PENDING` and `ROLLBACK` metadata persist

✓ correct ledger and stockLog types

✓ failed audit converts to audit-only work

✓ audit-only retry never repeats Room Stock mutation

✓ `Pending Milk recovery routing checks passed.`

Operational UI Gate:

✓ `tests/pending-milk-ui-check.mjs`

✓ Teacher-only activation and Admin rejection

✓ selected-week delegation

✓ eligible, issued, selected, and box totals

✓ issue confirmation and note delegation

✓ partial-save warning

✓ history and confirmed delete delegation

✓ Logout cleanup

✓ `Pending Milk UI checks passed.`

Isolated Write Gate:

✓ `tests/pending-milk-isolated-write-check.mjs`

✓ successful two-box issue changes Room Stock `50 → 48`

✓ duplicate student/date issue blocked

✓ successful delete restores Room Stock `48 → 50`

✓ partial issue queues typed `PENDING` difference `1`

✓ partial delete queues typed `ROLLBACK` difference `-1`

✓ failed stock operations do not mutate Room Stock before retry

✓ Main Stock remains 999 throughout

✓ `Pending Milk isolated write checks passed.`

Artifacts:

- `docs/PENDING_MILK_RECOVERY_ROUTING_GATE.md`
- `docs/PENDING_MILK_ISOLATED_WRITE_GATE.md`
- `docs/PENDING_MILK_UI_IMPLEMENTATION_REPORT.md`

---

Automated Regression Gate — PASS

Existing Sprint 4.3 tests: 18

Sprint 4.4 tests: 4

Total: 22

Confirmed locally:

✓ all existing 18 regression tests passed

✓ all four Sprint 4.4 tests passed

✓ `ALL 22 REGRESSION CHECKS PASSED`

✓ feature branch synchronized with origin

✓ working tree clean

---

Desktop Browser Gate — READY / READ-ONLY ONLY

Before Teacher Login:

□ inspect `tc_pending_saves_v1`

□ confirm no real pending queue entry exists

□ do not use room `อ.3-3`

□ do not use date `2026-07-28`

□ do not press Pending Milk issue or delete buttons

Admin regression:

□ Admin Login renders the existing Admin shell

□ Admin Logout returns to Login

□ Console clean

Teacher read-only validation:

□ Pending Milk panel renders

□ selected week loads exactly five Attendance dates

□ `absentMilk` request is room-scoped

□ eligible and already-issued states render correctly

□ issue button remains unused

□ delete buttons remain unused

□ no `POST`, `PUT`, `PATCH`, or `DELETE` mutation appears

□ Console clean

---

Responsive Gate at 820 x 1180 — Pending

□ week selector and Load button reachable

□ four summary cards readable

□ student/date rows contained

□ note and issue action reachable

□ history and delete actions contained without being pressed

□ Queue panel and Logout remain reachable

□ no abnormal horizontal overflow

□ Console clean

Physical iPad remains deferred and must not be represented as PASS.

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
