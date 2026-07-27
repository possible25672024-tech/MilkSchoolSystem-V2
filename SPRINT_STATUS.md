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

70% — Repository, Service, Manager, static tests, and migration documentation implemented; local validation pending

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

✓ `StockService` two-layer business rules

✓ Receive calculation: crates × per-crate + extra

✓ Classroom distribution: Main Stock decreases and Room Stock increases

✓ Teacher operations restricted to Room Stock only

✓ Pending, Retroactive, Vacation, and Attendance consumption types

✓ Room Stock rollback support

✓ Main Stock rebuild from receives minus classroom distributions

✓ Room Stock rebuild from distributions minus all Room Stock consumption

✓ Stock validation report calculations

✓ Compatible `stockTransactions` ledger records

✓ `StockManager` UI-safe command boundary

✓ Stock modules loaded by `index-v2.html` in dependency order

✓ Static and business-rule test file added: `tests/stock-module-check.mjs`

✓ Stock migration gap report added

✓ Legacy `index.html` and `teacher.html` remain unchanged

---

Pending Before Merge

□ Pull `feature/sprint-3.4.3-stock` to the local workspace

□ Run `node tests/login-foundation-check.mjs`

□ Run `node tests/stock-module-check.mjs`

□ Open `index-v2.html` through Live Server

□ Confirm Admin and Teacher login remain operational

□ Confirm no missing stock-module scripts in Browser Console

□ Review Stock Module diff

□ Decide whether distribution edit-differential is included in this Sprint or the next Stock hardening task

□ Update PROJECT_MEMORY.md and CHANGELOG.md after validation

□ Merge Stock branch into `develop` only after all checks pass

---

Protected Business Rules

1. Main Stock increases only from receiving milk.
2. Main Stock decreases only when distributing to classrooms.
3. Classroom distribution transfers quantity to Room Stock.
4. Attendance, Pending, Retroactive, and Vacation operations reduce Room Stock only.
5. Rollback restores the same stock layer changed by the original operation.
6. Rebuild uses source transactions rather than cached balances.

---

Next Sprint

Sprint 3.4.4 — Report Module

Do not begin Sprint 3.4.4 until Sprint 3.4.3 passes local tests and is merged into `develop`.

---

Migration Progress

Architecture

██████████ 100%

Firebase Foundation

██████████ 100%

Login Foundation

██████████ 100%

Repository Foundation

██████████ 100%

Stock

███████░░░ 70%

Report

█░░░░░░░░░ 10%

Teacher

░░░░░░░░░░ 0%

Room

░░░░░░░░░░ 0%

Offline

░░░░░░░░░░ 0%

Testing

██████░░░░ 60%

---

Notes

Sprint 3.4.2 was validated manually by the user and fast-forward merged into `develop`. Sprint 3.4.3 is isolated on its own feature branch. Legacy pages and their business behavior are protected during migration.
