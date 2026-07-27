# MilkSchoolSystem-V2
# AI Development Context

Version: 2.1
Last Updated: 2026-07-27

---

Repository

possible25672024-tech/MilkSchoolSystem-V2

Default integration branch

develop

---

Project Status

Legacy

↓

Modular V2 Migration

Backend

Firebase Realtime Database

---

Completed Sprints

Sprint 3.4.2 — Recovery Foundation

✓ Runtime Firebase configuration

✓ Firebase Realtime Database REST service

✓ BaseRepository

✓ Admin and Teacher login

✓ Session compatibility

✓ Bootstrap and index-v2 dependency order

✓ Static and browser validation

Merged into `develop` at `648fa6d`.

Sprint 3.4.3 — Stock Module Migration

✓ StockRepository

✓ StockService

✓ StockManager

✓ Receive workflow

✓ Classroom distribution workflow

✓ Main Stock and Room Stock separation

✓ Attendance, Pending, Retroactive, and Vacation Room Stock rules

✓ Rollback support

✓ Rebuild and validation calculations

✓ Shared stock ledger compatibility

✓ Static and business-rule tests

✓ Browser smoke test

✓ Legacy files unchanged

---

Current Sprint

Sprint 3.4.4 — Report Module Migration

Target structure

UI

↓

ReportManager

↓

ReportService

↓

ReportRepository

↓

FirebaseService

↓

Realtime Database

Target files

- `modules/repositories/reportRepository.js`
- `modules/services/reportService.js`
- `modules/report/reportManager.js`
- report tests
- report migration documentation

Required report views

- per classroom
- by grade level
- whole school

---

Protected Legacy Files

- `index.html`
- `teacher.html`

Do not modify these files during Sprint 3.x migration unless explicitly approved.

---

Never Break

- Main Stock decreases only when distributing to classrooms.
- Teacher operations reduce only Room Stock.
- Firebase schema and paths remain compatible.
- Admin login remains operational.
- Teacher login remains operational.
- Offline and sync behavior remains untouched until its scheduled Sprint.
- Rebuild calculations use transaction history.

---

Repository Responsibilities

Database operations and queries only.

No calculations.

No UI.

---

Service Responsibilities

Validation.

Calculation.

Aggregation.

Workflow.

Business rules.

No UI.

---

Manager Responsibilities

Display commands.

Events.

Filters.

Navigation.

Print/export orchestration.

Never access Firebase directly.

---

Required Workflow

1. Read `AGENTS.md`.
2. Read `REPOSITORY_RULES.md`.
3. Read `SPRINT_STATUS.md`.
4. Read `MODULE_MAP.md`.
5. Read only related source files.
6. Compare before editing.
7. Implement on a feature branch.
8. Run static and business-rule tests.
9. Run browser smoke tests.
10. Update `SPRINT_STATUS.md`, `docs/PROJECT_MEMORY.md`, and `CHANGELOG.md`.
11. Merge into `develop` only after all gates pass.

---

End of CODEX_CONTEXT.md
