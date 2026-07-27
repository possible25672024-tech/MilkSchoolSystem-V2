# MilkSchoolSystem-V2
# AI Development Context

Version: 2.6
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

✓ StockRepository, StockService, and StockManager

✓ Main Stock and Room Stock separation

✓ Receive, distribute, rollback, rebuild, validation, and ledger rules

✓ Static, business-rule, and browser tests

Merged into `develop` at `f56e430`.

Sprint 3.4.4 — Report Module Migration

✓ Read-only ReportRepository

✓ Classroom, grade-level, and school aggregation

✓ Thai grade normalization and sorting

✓ Print and Excel export models

✓ Architecture, aggregation, and browser tests

Known gap: browser-local pending, retroactive, and vacation collections still require an adapter before V2 replaces the operational report.

Sprint 3.5 — Room Module Migration

✓ RoomRepository, RoomService, and RoomManager

✓ Immutable Room IDs

✓ Room Stock preservation

✓ Duplicate validation, import preparation, and deletion safety

Known gaps: XLSX parsing remains legacy, and complete room writes lack multi-admin optimistic concurrency.

Sprint 3.6 — Teacher Module Migration

✓ Authenticated-room-only teacher boundary

✓ One-room `mcAttendance` query

✓ Teacher session, dashboard, and Room Stock-only command preparation

✓ Admin and cross-room access rejection

Sprint 3.7 — Attendance Module Migration

✓ AttendanceRepository, AttendanceService, and AttendanceManager

✓ Key format `{roomId}_{YYYY-MM-DD}`

✓ Create, edit-by-difference, delete rollback, ledger, and stockLog rules

✓ Main Stock isolation

✓ Full regression and browser validation

Sprint 3.8 — Offline Queue and Sync Migration

✓ QueueStorage using compatible `tc_pending_saves_v1`

✓ Legacy `rec` and `diff` alias normalization

✓ Corrupt-entry filtering

✓ Duplicate queued edit replacement with original baseline preservation

✓ Attendance and Room Stock adjustment replay

✓ Authenticated-room-only sequential replay

✓ Individual success removal and failure retention

✓ Bounded 5s → 10s → 20s → 40s → 60s retry backoff

✓ Startup, reconnect, retry, and periodic online flush

✓ Overlapping flush prevention

✓ Login, Stock, Report, Room, Teacher, Attendance, Sync, browser, Logout, console, and clean-tree validation

Known gaps: operational queue UI remains in `teacher.html`; V2 does not yet provide legacy ETag compare-and-retry Room Stock protection; production cutover requires legacy/V2 queue compatibility validation.

---

Current Sprint

Sprint 3.9 — Performance and Payload Optimization

Target areas

- Firebase request-count and payload audit
- Teacher login payload reduction verification
- room-scoped attendance read verification
- lazy-loading and cache invalidation audit
- mobile and iPad performance validation
- repeatable performance checks
- legacy and V2 queue compatibility fixtures
- performance documentation without invented benchmark numbers

Target files may include

- performance-focused tests under `tests/`
- performance utilities under `modules/performance/` only when justified
- `docs/SPRINT_3_9_PLAN.md`
- `docs/PERFORMANCE_AUDIT_REPORT.md`

---

Protected Legacy Files

- `index.html`
- `teacher.html`

Do not modify these files during Sprint 3.x migration unless explicitly approved.

---

Never Break

- Main Stock decreases only when distributing to classrooms.
- Teacher, Attendance, and Sync operations change only Room Stock.
- Attendance edits change Room Stock by the difference only.
- Offline retries preserve the original attendance baseline.
- Repeated queued edits keep the latest record without replacing the original baseline.
- Attendance keys remain compatible.
- Reports remain read-only.
- Firebase schema and paths remain compatible.
- Room IDs remain stable after creation.
- Admin and Teacher login remain operational.
- Teacher attendance reads remain scoped to the authenticated room.
- Queue entries survive refresh and browser restart.
- Rebuild calculations use transaction history.

---

Repository and Storage Responsibilities

Database paths, queries, serialization, and persistent storage only.

No business calculations.

No UI.

---

Service Responsibilities

Validation.

Normalization.

Calculation.

Workflow.

Retry and performance policy.

Business rules.

No UI.

---

Manager Responsibilities

Browser events.

Retry timing.

Queue and performance status events.

Periodic orchestration.

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
9. Run browser and device smoke tests.
10. Update `SPRINT_STATUS.md`, `docs/PROJECT_MEMORY.md`, `CHANGELOG.md`, and `MODULE_MAP.md`.
11. Merge into `develop` only after all gates pass.

---

End of CODEX_CONTEXT.md
