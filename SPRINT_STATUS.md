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

10% — Sprint plan initialized from the completed Sprint 4.3 Offline Queue foundation. Legacy-compatible `absentMilk` schema audit, dedicated Repository/Service/Manager/View implementation, isolated write tests, browser validation, and responsive validation have not started.

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

Sprint 4.4 Goal

Add the modular Pending Milk workflow for absent students while preserving Room Stock-only consumption, Main Stock isolation, authenticated-room-only access, legacy-compatible `absentMilk` records, duplicate prevention, audit references, and rollback safety.

---

Legacy-Compatible Audit — Pending

□ Confirm `absentMilk` key format

□ Confirm room and student identity fields

□ Confirm source Attendance date and issue date fields

□ Confirm quantity fields

□ Confirm teacher, room-name, timestamp, and reference fields

□ Confirm duplicate prevention behavior

□ Confirm ledger and stockLog types/references

□ Confirm deletion or rollback behavior

Legacy files may be inspected read-only only.

---

Planned Runtime Modules

□ `modules/repositories/pendingMilkRepository.js`

□ `modules/services/pendingMilkService.js`

□ `modules/pending/pendingMilkManager.js`

□ `modules/pending/pendingMilkView.js`

Reuse existing boundaries where appropriate. Do not place Firebase paths, eligibility, duplicates, stock calculations, or audit payload construction in the View.

---

Sprint 4.4 In Scope

□ Load one valid Attendance date for the authenticated room

□ Show absent students eligible for pending milk

□ Exclude already-issued students for the same source date/reference

□ Select one or more eligible students

□ Issue legacy-compatible Pending Milk records

□ Deduct Room Stock only

□ Preserve Main Stock delta zero

□ Prevent duplicates in the Service

□ Return Room Stock before/after and transaction reference

□ Create compatible ledger and stockLog records

□ Implement exact rollback only when confirmed by legacy evidence

□ Add responsive Teacher UI feedback

---

Architecture Rules

- Repository owns paths, queries, persistence, and conditional-write boundaries only.
- Service owns session validation, eligibility, duplicates, quantity, stock workflow, compatibility, and audit construction.
- Manager owns UI-safe commands, events, and recovery orchestration.
- View owns DOM rendering and user interaction only.
- View must not access Firebase, Repository, fetch, Local Storage, or Session Storage.
- View must not calculate eligibility, duplicates, quantity, Room Stock, ledger, or stockLog.
- Main Stock must never change.

---

Protected Business Rules

- Main Stock decreases only on classroom distribution.
- Pending Milk deducts Room Stock only.
- Quantity is deducted exactly once.
- Duplicate issue is blocked by Service logic.
- Teacher access remains limited to the authenticated room.
- ETag conflicts read the latest Room Stock and recalculate before retry.
- Audit-only recovery never repeats a successful Room Stock mutation.
- Existing Attendance records are read-only eligibility sources.
- Firebase path `milkApp/absentMilk` remains compatible.
- Negative Room Stock is not silently clamped.

---

Planned Tests

□ `tests/pending-milk-module-check.mjs`

□ `tests/pending-milk-ui-check.mjs`

□ `tests/pending-milk-isolated-write-check.mjs`

Required coverage:

- authenticated-room eligibility
- absent-only eligibility
- already-issued exclusion
- legacy-compatible fields
- duplicate prevention
- one-student and multi-student quantities
- Room Stock-only deduction
- Main Stock unchanged
- ETag conflict recalculation
- partial-save/audit recovery
- exact rollback when supported
- no direct business or persistence logic in View

Existing 18 tests remain mandatory.

---

Browser and Responsive Gates — Not Started

Desktop Chrome:

□ Admin Login/Logout unchanged

□ Teacher Pending Milk section renders

□ Selected date loads only authenticated-room Attendance

□ Eligible and already-issued states render correctly

□ Read-only validation causes no mutation

□ Console clean

□ No full-school Attendance or absentMilk read

Chrome Device Toolbar at 820 x 1180:

□ Date, student rows, totals, feedback, action, and Logout remain reachable

□ No abnormal horizontal overflow

□ Console clean

All write interaction must use in-memory or a fully isolated target.

---

Out of Scope

- Retroactive Milk
- Vacation Milk
- photos and signatures
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

- do not use the quarantined room/date for eligibility or Pending Milk tests
- do not use its values as trusted operational evidence
- do not manually edit Attendance, Room Stock, Main Stock, queue, ledger, stockLog, or transaction history
- recovery remains mandatory before `main` or production cutover
