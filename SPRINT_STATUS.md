# MilkSchoolSystem-V2

# Sprint Status

Last Update

2026-07-27

---

Current Branch

feature/sprint-3.4.4-report

---

Current Version

V2

---

Current Sprint

Sprint 3.4.4 — Report Module Migration

Status

100% — implementation, architecture checks, aggregation tests, browser smoke test, login regression, and working-tree validation passed

---

Completed Foundation

✓ Sprint 3.4.2 Recovery merged into `develop` at `648fa6d`

✓ Sprint 3.4.3 Stock Module merged into `develop` at `f56e430`

✓ Login, Firebase, and two-layer Stock rules protected

---

Sprint 3.4.4 Completed

✓ Branch created from latest `develop`

✓ Sprint plan created

✓ Legacy report calculations inspected without modifying legacy files

✓ `ReportRepository` implemented as a read-only data boundary

✓ `ReportRepository` composes settings and the shared stock snapshot

✓ `ReportService` normalizes rooms and transaction collections

✓ Thai grade parser supports dotted and non-dotted room names

✓ Explicit `room.level` takes priority over room-name parsing

✓ Natural grade sorting implemented

✓ Per-classroom report aggregation implemented

✓ Grade-level report aggregation implemented

✓ Whole-school report aggregation implemented

✓ Distributed, attendance, pending, retroactive, vacation, and remaining totals implemented

✓ Percentage-used calculation preserved

✓ Optional legacy local-data adapters supported

✓ Excel export models implemented

✓ Print models implemented

✓ `ReportManager` view and refresh command boundary implemented

✓ Cached room/grade/school view switching without additional Firebase reads

✓ Report modules loaded by `index-v2.html` in dependency order

✓ Automated test file added: `tests/report-module-check.mjs`

✓ Report migration gap documentation added

✓ Report operations remain read-only

✓ `node tests/login-foundation-check.mjs` passed

✓ `node tests/stock-module-check.mjs` passed

✓ `node tests/report-module-check.mjs` passed

✓ Admin login passed

✓ Teacher login remained operational from the previous regression gate

✓ Browser console contains only `MilkSchoolSystem V2 Started`

✓ Working tree confirmed clean

✓ Legacy `index.html` and `teacher.html` remain unchanged

---

Merge Gate

PASSED

The branch may be fast-forward merged into `develop`.

---

Known Migration Gap

The legacy report also combines browser-local stored-milk, backdated-milk, and vacation-milk collections. The modular service supports injection of these collections, but the storage/sync adapter must be completed before the V2 report replaces the operational legacy report.

---

Next Sprint

Sprint 3.5 — Room Module Migration

Target modules:

- `modules/repositories/roomRepository.js`
- `modules/services/roomService.js`
- `modules/room/roomManager.js`
- room validation and import boundaries
- room tests and migration documentation

---

Protected Business Rules

- Reports are read-only.
- Main Stock decreases only when distributing milk to classrooms.
- Teacher attendance, pending milk, retroactive milk, and vacation milk reduce only Room Stock.
- Rebuild calculations use transaction history as the source of truth.
- UI modules never call Firebase directly.
- Legacy `index.html` and `teacher.html` remain unchanged during Sprint 3.x migration.
