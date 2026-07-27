# MilkSchoolSystem-V2

# Sprint Status

Last Update

2026-07-27

---

Current Branch

feature/sprint-3.8-offline-sync

---

Current Version

V2

---

Current Sprint

Sprint 3.8 — Offline Queue and Sync Migration

Status

100% — QueueStorage, SyncService, SyncManager, Room Stock adjustment replay, regression tests, browser smoke tests, logout validation, console validation, and clean-tree validation passed

---

Completed Foundation

✓ Sprint 3.4.2 Recovery merged into `develop` at `648fa6d`

✓ Sprint 3.4.3 Stock Module merged into `develop` at `f56e430`

✓ Sprint 3.4.4 Report Module merged into `develop`

✓ Sprint 3.5 Room Module merged into `develop`

✓ Sprint 3.6 Teacher Module merged into `develop`

✓ Sprint 3.7 Attendance Module merged into `develop`

✓ Login, Firebase, Stock, Report, Room, Teacher, and Attendance rules protected

---

Sprint 3.8 Completed

✓ Branch created from latest `develop`

✓ Sprint plan created: `docs/SPRINT_3_8_PLAN.md`

✓ Legacy queue storage, replacement, baseline preservation, retry, reconnect, periodic flush, Room Stock adjustment, and badge workflows inspected

✓ `QueueStorage` added with compatible `tc_pending_saves_v1` key

✓ Legacy `rec` and `diff` aliases accepted during queue normalization

✓ Missing and malformed queue storage recovers safely

✓ Invalid queue entries are filtered individually

✓ Attendance queue entries persist across browser restarts

✓ Duplicate attendance edits replace the latest record

✓ Original unsynced `baselinePresent` is preserved

✓ Original queue timestamp is preserved

✓ Newer queued edits reset retry attempts

✓ Room Stock adjustment queue entries implemented

✓ Individual queue removal implemented

✓ `AttendanceService.adjustRoomStock` added for Room Stock-only replay without rewriting attendance

✓ `SyncService` added

✓ Teacher session and authenticated-room replay checks implemented

✓ Attendance replay delegates to `AttendanceService.saveAttendance`

✓ Room Stock adjustment replay delegates to `AttendanceService.adjustRoomStock`

✓ Queue replay is sequential

✓ Successful entries are removed individually

✓ Failed entries remain queued and increment attempts

✓ Retry timestamps and bounded 5s → 10s → 20s → 40s → 60s backoff implemented

✓ Every Sync result reports `mainStockDelta: 0`

✓ `SyncManager` added

✓ Startup, reconnect, retry, and periodic online flush boundaries implemented

✓ Overlapping flush prevention implemented

✓ Queue-count and sync lifecycle events implemented

✓ Sync modules loaded by `index-v2.html` in dependency order

✓ Automated test file added: `tests/sync-module-check.mjs`

✓ Sync migration and ETag concurrency gap documentation added

✓ `node tests/login-foundation-check.mjs` passed

✓ `node tests/stock-module-check.mjs` passed

✓ `node tests/report-module-check.mjs` passed

✓ `node tests/room-module-check.mjs` passed

✓ `node tests/teacher-module-check.mjs` passed

✓ `node tests/attendance-module-check.mjs` passed

✓ `node tests/sync-module-check.mjs` passed

✓ Admin browser smoke test passed

✓ Teacher browser smoke test passed

✓ Logout passed

✓ Browser console contains only `MilkSchoolSystem V2 Started`

✓ Working tree confirmed clean

✓ Legacy `index.html` and `teacher.html` remain unchanged

---

Merge Gate

PASSED

The branch may be fast-forward merged into `develop`.

---

Known Migration Gaps

The operational attendance form, media capture, signatures, printing, queue badge, and offline banner remain in `teacher.html` while the modular sync boundary is extracted.

The modular Attendance and Sync multi-location PATCH is atomic for its included paths, but it does not yet include the legacy ETag compare-and-retry protection for simultaneous Room Stock writers.

Production cutover still requires compatibility testing between queues written by legacy `teacher.html` and queues normalized by V2.

The Smart Excel parser, complete-room concurrency, and Report local-data adapter gaps remain recorded from earlier Sprints.

---

Next Sprint

Sprint 3.9 — Performance and Payload Optimization

Target areas:

- room-scoped Firebase reads
- payload and request-count audit
- cache and lazy-loading boundaries
- mobile and iPad validation
- browser performance instrumentation
- compatibility tests for modular and legacy queue data

---

Protected Business Rules

- Queue entries survive refresh and browser restart.
- Corrupt entries are filtered individually without deleting valid entries.
- Repeated queued attendance edits keep the latest record while preserving the original baseline.
- Attendance replay uses AttendanceService Room Stock difference rules.
- Room Stock adjustment retry does not rewrite attendance unnecessarily.
- Queue replay is sequential.
- Only the authenticated room may be replayed.
- Failed entries remain queued.
- Successful entries are removed individually.
- Retry timing uses bounded exponential backoff.
- Main Stock must remain unchanged.
- Attendance keys remain `{roomId}_{YYYY-MM-DD}`.
- Negative Room Stock is not silently clamped.
- Legacy `index.html` and `teacher.html` remain unchanged during Sprint 3.x migration.
