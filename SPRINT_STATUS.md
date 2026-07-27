# MilkSchoolSystem-V2

# Sprint Status

Last Update

2026-07-27

---

Current Branch

feature/sprint-3.5-room

---

Current Version

V2

---

Current Sprint

Sprint 3.5 — Room Module Migration

Status

70% — Repository, Service, Manager, dependency wiring, automated tests, and migration documentation implemented; local validation pending

---

Completed Foundation

✓ Sprint 3.4.2 Recovery merged into `develop` at `648fa6d`

✓ Sprint 3.4.3 Stock Module merged into `develop` at `f56e430`

✓ Sprint 3.4.4 Report Module merged into `develop` after all automated and browser gates passed

✓ Login, Firebase, Stock, and read-only Report rules protected

---

Sprint 3.5 Completed

✓ Branch created from latest `develop`

✓ Sprint plan created: `docs/SPRINT_3_5_PLAN.md`

✓ Legacy manual-room, student-import, room-report, and deletion workflows inspected

✓ `RoomRepository` expanded with `milkApp/rooms` storage operations

✓ Room dependency reads implemented for Room Stock, distributions, attendance, pending, retroactive, vacation, and ledger data

✓ `RoomService` added

✓ Array- and object-shaped room normalization implemented

✓ Manual room creation preserves entered student count without inventing student records

✓ Existing room IDs are immutable during edits

✓ Room Stock is preserved during edits and repeated student imports

✓ Duplicate room ID and room name validation implemented

✓ Imported student field preservation implemented

✓ Duplicate-student detection implemented

✓ Student import preview and confirmation boundary implemented

✓ Existing grade and teacher metadata preserved when import data omits those fields

✓ Room deletion dependency report implemented

✓ Room deletion blocked when operational references exist

✓ Zero-valued Room Stock records block deletion until explicitly migrated or archived

✓ `RoomManager` create, update, import, refresh, and delete command boundary implemented

✓ Room modules loaded by `index-v2.html` in dependency order

✓ Automated test file added: `tests/room-module-check.mjs`

✓ Room migration gap documentation added

✓ Legacy `index.html` and `teacher.html` remain unchanged

---

Pending Before Merge

□ Pull `feature/sprint-3.5-room` to the local workspace

□ Run `node tests/login-foundation-check.mjs`

□ Run `node tests/stock-module-check.mjs`

□ Run `node tests/report-module-check.mjs`

□ Run `node tests/room-module-check.mjs`

□ Open `index-v2.html` through Live Server

□ Confirm Admin and Teacher login remain operational

□ Confirm Browser Console contains no room-module error

□ Confirm working tree is clean

□ Update Project Memory, Changelog, AI Context, and Module Map after validation

□ Merge into `develop` only after all gates pass

---

Known Migration Gaps

The Smart Excel binary parser remains in the legacy file. The modular Room service accepts parsed sheet data but does not yet replace XLSX parsing.

The compatible Room workflow writes the complete `milkApp/rooms` collection and does not yet include multi-admin optimistic concurrency control.

The known Report local-data adapter gap remains until browser-local pending, retroactive, and vacation records are connected to the modular report.

---

Protected Business Rules

- Existing room IDs must remain stable during edits and repeated imports.
- Room deletion must not orphan Room Stock or operational history.
- Room operations must not change Main Stock.
- Room edits and imports must not silently reset Room Stock.
- Reports are read-only.
- Main Stock decreases only when distributing milk to classrooms.
- Teacher attendance, pending milk, retroactive milk, and vacation milk reduce only Room Stock.
- Rebuild calculations use transaction history as the source of truth.
- UI modules never call Firebase directly.
- Legacy `index.html` and `teacher.html` remain unchanged during Sprint 3.x migration.
