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

10% — Sprint plan and safety boundaries initialized; legacy room workflow inspection and implementation pending

---

Completed Foundation

✓ Sprint 3.4.2 Recovery merged into `develop` at `648fa6d`

✓ Sprint 3.4.3 Stock Module merged into `develop` at `f56e430`

✓ Sprint 3.4.4 Report Module merged into `develop` after all automated and browser gates passed

✓ Login, Firebase, Stock, and read-only Report rules protected

---

Sprint 3.5 Initialized

✓ Branch created from latest `develop`

✓ Sprint plan created: `docs/SPRINT_3_5_PLAN.md`

✓ Protected legacy files identified

✓ Room ID stability requirement recorded

✓ Room Stock preservation requirement recorded

✓ Deletion dependency checks defined

✓ Target Repository → Service → Manager boundaries defined

---

Pending

□ Inspect legacy room creation, editing, import, and deletion workflows

□ Expand `RoomRepository` with `milkApp/rooms` paths and dependency reads

□ Create `RoomService`

□ Create `RoomManager`

□ Add room module dependency wiring to `index-v2.html`

□ Add `tests/room-module-check.mjs`

□ Add `docs/ROOM_MIGRATION_GAP_REPORT.md`

□ Run Login regression tests

□ Run Stock regression tests

□ Run Report regression tests

□ Run Room tests

□ Run Browser smoke test

□ Confirm working tree clean

□ Merge into `develop` only after all gates pass

---

Known Report Migration Gap

The legacy report also combines browser-local stored-milk, backdated-milk, and vacation-milk collections. The modular service supports injection of these collections, but the storage/sync adapter must be completed before the V2 report replaces the operational legacy report.

---

Protected Business Rules

- Existing room IDs must remain stable during edits.
- Room deletion must not orphan Room Stock or operational history.
- Reports are read-only.
- Main Stock decreases only when distributing milk to classrooms.
- Teacher attendance, pending milk, retroactive milk, and vacation milk reduce only Room Stock.
- Rebuild calculations use transaction history as the source of truth.
- UI modules never call Firebase directly.
- Legacy `index.html` and `teacher.html` remain unchanged during Sprint 3.x migration.
