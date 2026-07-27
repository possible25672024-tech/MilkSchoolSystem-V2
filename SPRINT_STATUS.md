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

100% — implementation, room-scoped query support, architecture checks, teacher workflow tests, regression tests, browser smoke test, and clean-tree validation passed

---

Completed Foundation

✓ Sprint 3.4.2 Recovery merged into `develop` at `648fa6d`

✓ Sprint 3.4.3 Stock Module merged into `develop` at `f56e430`

✓ Sprint 3.4.4 Report Module merged into `develop`

✓ Sprint 3.5 Room Module merged into `develop`

✓ Login, Firebase, Stock, Report, and Room rules protected

---

Sprint 3.6 Completed

✓ Branch created from latest `develop`

✓ Sprint plan created: `docs/SPRINT_3_6_PLAN.md`

✓ Legacy teacher session, room loading, Room Stock, distribution, attendance, pending, retroactive, vacation, and rollback workflows inspected

✓ `FirebaseService` supports JSON-encoded Realtime Database query parameters

✓ `BaseRepository` supports scoped read queries

✓ `TeacherRepository` expanded into a read-only teacher Firebase boundary

✓ Room Stock reads are scoped to the authenticated room path

✓ Attendance reads use the `{roomId}_` through `{roomId}_\uf8ff` key-prefix query

✓ Teacher settings, rooms, distributions, pending, retroactive, vacation, ledger, and update reads implemented

✓ `TeacherService` added

✓ Teacher session validation implemented

✓ Admin sessions rejected by the Teacher service

✓ Cross-room teacher access rejected

✓ Room and student normalization implemented

✓ Every teacher collection filtered to the authenticated room

✓ Teacher dashboard calculations implemented

✓ ATTENDANCE, PENDING, RETRO, and VACATION command preparation reduces only Room Stock

✓ Teacher rollback command preparation restores only Room Stock

✓ Every prepared Teacher command has `mainStockDelta: 0`

✓ `TeacherManager` session, refresh, dashboard, command, event, and clear boundary implemented

✓ Teacher modules loaded by `index-v2.html` in dependency order

✓ Automated test file added: `tests/teacher-module-check.mjs`

✓ Teacher migration gap documentation added

✓ `node tests/login-foundation-check.mjs` passed

✓ `node tests/stock-module-check.mjs` passed

✓ `node tests/report-module-check.mjs` passed

✓ `node tests/room-module-check.mjs` passed

✓ `node tests/teacher-module-check.mjs` passed

✓ Teacher browser smoke test passed

✓ Browser console contains only `MilkSchoolSystem V2 Started`

✓ Working tree confirmed clean

✓ Legacy `index.html` and `teacher.html` remain unchanged

---

Merge Gate

PASSED

The branch may be fast-forward merged into `develop`.

---

Known Migration Gaps

The operational teacher forms, media capture, signatures, print views, attendance writes, and atomic Room Stock writes remain in `teacher.html`.

Attendance write migration is scheduled for Sprint 3.7.

The persistent offline queue and retry behavior remain untouched until Sprint 3.8.

Only `mcAttendance` uses a Firebase room-prefix query in this Sprint. Smaller teacher collections are read and filtered in the Service to avoid requiring production `.indexOn` rule changes.

The Smart Excel parser, complete-room concurrency, and Report local-data adapter gaps remain recorded from earlier Sprints.

---

Next Sprint

Sprint 3.7 — Attendance Module Migration

Target modules:

- `modules/repositories/attendanceRepository.js`
- `modules/services/attendanceService.js`
- `modules/attendance/attendanceManager.js`
- attendance save and rollback tests
- attendance migration documentation

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
