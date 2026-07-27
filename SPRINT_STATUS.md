# MilkSchoolSystem-V2

# Sprint Status

Last Update

2026-07-27

---

Current Branch

feature/sprint-3.6-teacher

---

Current Version

V2

---

Current Sprint

Sprint 3.6 — Teacher Module Migration

Status

10% — Sprint plan and safety boundaries initialized; legacy teacher workflow inspection and implementation pending

---

Completed Foundation

✓ Sprint 3.4.2 Recovery merged into `develop` at `648fa6d`

✓ Sprint 3.4.3 Stock Module merged into `develop` at `f56e430`

✓ Sprint 3.4.4 Report Module merged into `develop`

✓ Sprint 3.5 Room Module merged into `develop` after Login, Stock, Report, Room, Browser, and clean-tree gates passed

✓ Login, Firebase, Stock, Report, and Room rules protected

---

Sprint 3.6 Initialized

✓ Branch created from latest `develop`

✓ Sprint plan created: `docs/SPRINT_3_6_PLAN.md`

✓ Protected legacy files identified

✓ Authenticated room-only access requirement recorded

✓ Room-scoped attendance loading requirement recorded

✓ Main Stock isolation requirement recorded

✓ Offline queue deferral to Sprint 3.8 recorded

✓ Repository → Service → Manager boundaries defined

---

Pending

□ Inspect legacy teacher session, room loading, Room Stock, distributions, attendance, pending, retroactive, and vacation workflows

□ Create `TeacherRepository`

□ Create `TeacherService`

□ Create `TeacherManager`

□ Add Teacher module dependency wiring to `index-v2.html`

□ Add `tests/teacher-module-check.mjs`

□ Add `docs/TEACHER_MIGRATION_GAP_REPORT.md`

□ Run Login regression tests

□ Run Stock regression tests

□ Run Report regression tests

□ Run Room regression tests

□ Run Teacher tests

□ Run Browser smoke test

□ Confirm working tree clean

□ Merge into `develop` only after all gates pass

---

Known Migration Gaps

The Smart Excel binary parser remains in the legacy file. The modular Room service accepts parsed sheet data but does not yet replace XLSX parsing.

The compatible Room workflow writes the complete `milkApp/rooms` collection and does not yet include multi-admin optimistic concurrency control.

The legacy Report local-data adapter gap remains until browser-local pending, retroactive, and vacation records are connected to the modular report.

---

Protected Business Rules

- A teacher may access only the authenticated room.
- Teacher login must not download all-school attendance data.
- Teacher operations must not change Main Stock.
- Attendance, pending milk, retroactive milk, and vacation milk reduce only Room Stock.
- Existing Room IDs and Room Stock links must remain stable.
- Reports are read-only.
- Rebuild calculations use transaction history as the source of truth.
- UI modules never call Firebase directly.
- Offline queue behavior remains unchanged until Sprint 3.8.
- Legacy `index.html` and `teacher.html` remain unchanged during Sprint 3.x migration.
