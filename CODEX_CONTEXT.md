# MilkSchoolSystem-V2
# AI Development Context

Version: 2.5
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

✓ Receive and classroom distribution workflows

✓ Main Stock and Room Stock separation

✓ Attendance, Pending, Retroactive, and Vacation Room Stock rules

✓ Rollback, rebuild, validation, and ledger compatibility

✓ Static, business-rule, and browser tests

Merged into `develop` at `f56e430`.

Sprint 3.4.4 — Report Module Migration

✓ Read-only ReportRepository

✓ Classroom, grade-level, and school aggregation

✓ Thai grade normalization and sorting

✓ Print and Excel export models

✓ Cached report view switching

✓ Architecture, aggregation, and browser tests

Known gap: browser-local pending, retroactive, and vacation collections require a Storage/Sync adapter before V2 becomes the operational report.

Sprint 3.5 — Room Module Migration

✓ RoomRepository Firebase boundary

✓ RoomService normalization, validation, import preparation, and deletion safety

✓ RoomManager command boundary

✓ Immutable Room IDs during edits

✓ Room Stock preservation during edits and repeated imports

✓ Duplicate room and duplicate student detection

✓ Deletion blocking for Room Stock and operational references

✓ Login, Stock, Report, Room, browser, and clean-tree validation

Known gaps: XLSX binary parsing remains in the legacy file, and complete room collection writes do not yet include multi-admin optimistic concurrency control.

Sprint 3.6 — Teacher Module Migration

✓ TeacherRepository room-scoped read boundary

✓ TeacherService session validation and authenticated-room-only normalization

✓ TeacherManager session, refresh, dashboard, command, and event boundary

✓ Firebase key-prefix query support

✓ `mcAttendance` loaded for one room only

✓ Admin-session and cross-room access rejection

✓ Teacher dashboard calculations

✓ Room Stock-only consume and rollback command preparation

✓ Every Teacher command has `mainStockDelta: 0`

✓ Login, Stock, Report, Room, Teacher, browser, and clean-tree validation

Sprint 3.7 — Attendance Module Migration

✓ AttendanceRepository room-scoped read and mutation boundary

✓ AttendanceService create, edit, delete, Room Stock difference, ledger, and stockLog rules

✓ AttendanceManager load, save, delete, cache, and event boundary

✓ Key format `{roomId}_{YYYY-MM-DD}` preserved

✓ Cross-room writes rejected

✓ New attendance reduces Room Stock by present count

✓ Edits adjust Room Stock by present-count difference only

✓ Deletion restores Room Stock

✓ Main Stock remains unchanged

✓ Login, Stock, Report, Room, Teacher, Attendance, browser, Logout, console, and clean-tree validation

Known gaps: operational form, media, signatures, printing, legacy ETag Room Stock protection, and persistent offline queue remain outside V2.

---

Current Sprint

Sprint 3.8 — Offline Queue and Sync Migration

Target structure

UI / Browser Events

↓

SyncManager

↓

SyncService

↓

QueueStorage + AttendanceService

↓

AttendanceRepository

↓

FirebaseService

↓

Realtime Database

Target files

- `modules/storage/queueStorage.js`
- `modules/services/syncService.js`
- `modules/sync/syncManager.js`
- sync tests
- sync migration documentation

Required sync workflows

- persist failed attendance saves
- persist failed Room Stock adjustments separately
- survive page refresh and browser restart
- replace queued edits for the same attendance key with the latest record
- preserve the original `baselinePresent` across repeated queued edits
- retry sequentially to avoid Room Stock collisions
- use bounded exponential backoff
- flush on reconnect
- flush periodically while online
- remove only successful queue items
- keep failed items for later retry
- reject corrupt or cross-room queue items safely
- never change Main Stock

---

Protected Legacy Files

- `index.html`
- `teacher.html`

Do not modify these files during Sprint 3.x migration unless explicitly approved.

---

Never Break

- Main Stock decreases only when distributing to classrooms.
- Teacher, Attendance, and queued retry operations reduce only Room Stock.
- Attendance edits change Room Stock by the difference only.
- Offline retries preserve the original attendance baseline.
- Repeated queued edits keep the latest record without replacing the original baseline.
- Attendance keys remain compatible.
- Reports remain read-only.
- Firebase schema and paths remain compatible.
- Room IDs remain stable after creation.
- Admin and Teacher login remain operational.
- Teacher data loads remain scoped to the authenticated room.
- Rebuild calculations use transaction history.

---

Repository Responsibilities

Database operations and queries only.

No calculations.

No UI.

---

Service Responsibilities

Validation.

Normalization.

Calculation.

Workflow.

Business rules.

No UI.

---

Manager Responsibilities

Browser online/offline events.

Retry timing.

Queue status events.

Periodic flush orchestration.

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
10. Update `SPRINT_STATUS.md`, `docs/PROJECT_MEMORY.md`, `CHANGELOG.md`, and `MODULE_MAP.md`.
11. Merge into `develop` only after all gates pass.

---

End of CODEX_CONTEXT.md
