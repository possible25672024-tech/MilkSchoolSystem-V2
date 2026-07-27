# MilkSchoolSystem-V2

# Sprint Status

Last Update

2026-07-27

---

Current Branch

feature/sprint-3.4.3-stock

---

Current Version

V2

---

Current Sprint

Sprint 3.4.3 — Stock Module Migration

Status

100% — implementation, static tests, business-rule tests, browser smoke test, and manual login checks passed

---

Sprint 3.4.2 Recovery

✓ Runtime Firebase configuration restored

✓ Firebase Realtime Database REST foundation restored

✓ Admin and Teacher login restored

✓ Browser login tests passed

✓ Logout and session tests passed

✓ Recovery branch fast-forward merged into `develop` at `648fa6d`

---

Sprint 3.4.3 Completed

✓ Branch created from latest `develop`

✓ Sprint plan created

✓ `StockRepository` owns all stock Firebase paths

✓ Main Stock and Room Stock repository methods

✓ Complete stock snapshot loading

✓ Firebase multi-location update boundary

✓ `StockService` implements two-layer stock business rules

✓ Receive calculation: crates × per-crate + extra

✓ Classroom distribution: Main Stock decreases and Room Stock increases

✓ Teacher operations restricted to Room Stock only

✓ Attendance, Pending, Retroactive, and Vacation consumption types

✓ Room Stock rollback support

✓ Main Stock rebuild from receives minus classroom distributions

✓ Room Stock rebuild from distributions minus Room Stock consumption

✓ Stock validation calculations

✓ Compatible `stockTransactions` ledger records

✓ `StockManager` UI-safe command boundary

✓ Stock modules loaded by `index-v2.html` in dependency order

✓ Static and business-rule test file: `tests/stock-module-check.mjs`

✓ Stock migration gap report added

✓ Browser console contains only `MilkSchoolSystem V2 Started`

✓ Admin and Teacher login remain operational

✓ `node tests/login-foundation-check.mjs` passed

✓ `node tests/stock-module-check.mjs` passed

✓ Working tree confirmed clean

✓ Legacy `index.html` and `teacher.html` remain unchanged

---

Merge Gate

PASSED

The branch may be fast-forward merged into `develop`.

---

Next Sprint

Sprint 3.4.4 — Report Module Migration

Target modules:

- `modules/repositories/reportRepository.js`
- `modules/services/reportService.js`
- `modules/report/reportManager.js`
- report calculations and print/export boundaries

---

Protected Business Rules

- Main Stock decreases only when distributing milk to classrooms.
- Teacher attendance, pending milk, retroactive milk, and vacation milk reduce only Room Stock.
- Rebuild calculations use transaction history as the source of truth.
- UI modules never call Firebase directly.
- Legacy `index.html` and `teacher.html` remain unchanged during Sprint 3.x migration.
