# MilkSchoolSystem-V2

# Sprint Status

Last Update

2026-07-27

---

Current Branch

feature/sprint-3.7-attendance

---

Current Version

V2

---

Current Sprint

Sprint 3.7 — Attendance Module Migration

Status

100% — implementation, architecture checks, attendance stock-difference tests, regression tests, Admin and Teacher browser smoke tests, Logout, console validation, and working-tree validation passed

---

Completed Foundation

✓ Sprint 3.4.2 Recovery merged into `develop` at `648fa6d`

✓ Sprint 3.4.3 Stock Module merged into `develop` at `f56e430`

✓ Sprint 3.4.4 Report Module merged into `develop`

✓ Sprint 3.5 Room Module merged into `develop`

✓ Sprint 3.6 Teacher Module merged into `develop`

✓ Login, Firebase, Stock, Report, Room, and Teacher rules protected

---

Sprint 3.7 Completed

✓ Branch created from latest `develop`

✓ Sprint plan created: `docs/SPRINT_3_7_PLAN.md`

✓ Legacy attendance save, edit, Room Stock difference, ledger, deletion, rollback, media, signature, and offline queue workflows inspected

✓ `AttendanceRepository` added

✓ Attendance key format preserved as `{roomId}_{YYYY-MM-DD}`

✓ Room attendance reads use the `{roomId}_` through `{roomId}_\uf8ff` Firebase key-prefix query

✓ Attendance record and Room Stock mutation-state reads implemented

✓ Firebase multi-location attendance mutation boundary implemented under `milkApp`

✓ `AttendanceService` added

✓ Teacher session and authenticated-room validation reused from `TeacherService`

✓ Admin and cross-room attendance operations rejected

✓ Legacy-compatible attendance record fields preserved

✓ New attendance consumes Room Stock by the present count

✓ Attendance edits adjust Room Stock by the present-count difference only

✓ Attendance deletion restores the deleted record's present count

✓ Compatible `ATTENDANCE` and `ROLLBACK` ledger records implemented

✓ Compatible `stockLog` records implemented

✓ Negative Room Stock remains visible and is not clamped

✓ Every attendance result reports `mainStockDelta: 0`

✓ No attendance update contains the Main Stock `stock` path

✓ `AttendanceManager` load, save, delete, cache, and event boundary implemented

✓ Attendance modules loaded by `index-v2.html` in dependency order

✓ Automated test file added: `tests/attendance-module-check.mjs`

✓ Attendance migration gap documentation added

✓ `node tests/login-foundation-check.mjs` passed

✓ `node tests/stock-module-check.mjs` passed

✓ `node tests/report-module-check.mjs` passed

✓ `node tests/room-module-check.mjs` passed

✓ `node tests/teacher-module-check.mjs` passed

✓ `node tests/attendance-module-check.mjs` passed

✓ Admin Login browser smoke test passed

✓ Teacher Login browser smoke test passed

✓ Logout browser smoke test passed

✓ Browser console contains only `MilkSchoolSystem V2 Started`

✓ Working tree confirmed clean

✓ Legacy `index.html` and `teacher.html` remain unchanged

---

Merge Gate

PASSED

The branch may be fast-forward merged into `develop`.

---

Known Migration Gaps

The operational attendance form, media capture, signatures, printing, ETag Room Stock write, and persistent offline queue remain in `teacher.html` during this extraction.

The modular multi-location PATCH is atomic for its included paths, but it does not yet include the legacy ETag compare-and-retry protection for simultaneous Room Stock writers.

Persistent offline queue, retry, reconnect flush, baseline preservation, queued-edit replacement, and conflict handling move to Sprint 3.8.

The Smart Excel parser, complete-room concurrency, and Report local-data adapter gaps remain recorded from earlier Sprints.

---

Next Sprint

Sprint 3.8 — Offline Queue and Sync Migration

Target modules:

- `modules/storage/queueStorage.js`
- `modules/services/syncService.js`
- `modules/sync/syncManager.js`
- `tests/sync-module-check.mjs`
- `docs/SYNC_MIGRATION_GAP_REPORT.md`

---

Protected Business Rules

- Attendance keys remain `{roomId}_{YYYY-MM-DD}`.
- Only the authenticated room may be read or written.
- New attendance reduces Room Stock by the number of present students.
- Attendance edits adjust Room Stock by the present-count difference only.
- Attendance deletion restores the previously consumed Room Stock.
- Offline retries must preserve the original attendance baseline.
- Repeated queued edits for the same room and date must keep only the latest record while preserving the original baseline.
- Main Stock must remain unchanged.
- Ledger records remain compatible.
- Negative Room Stock is not silently clamped.
- Existing Room IDs and Room Stock links remain stable.
- Legacy `index.html` and `teacher.html` remain unchanged during Sprint 3.x migration.
