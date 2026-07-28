# Changelog

All notable modular migration changes are recorded here.

## 2026-07-28 — Sprint 4.1 Teacher UI Shell and Read-Only State

### Added

- `modules/teacher/teacherView.js`
- `tests/teacher-ui-shell-check.mjs`
- `docs/SPRINT_4_1_PLAN.md`
- `docs/TEACHER_UI_SHELL_VALIDATION_REPORT.md`

### Changed

- Added separate Admin and Teacher shell containers to `index-v2.html`.
- Added school, room, and teacher identity to the modular Teacher shell.
- Added read-only current Room Stock display without clamping zero or negative values.
- Added persistent queue-count display through the existing Sync boundary.
- Added online/offline badge driven by browser connection events.
- Added Teacher Logout delegated through `LoginManager.logout()`.
- Added restored Teacher-session rendering during App startup.
- Added Login, Logout, Teacher refresh, Sync, and connection-state event handling.
- Preserved Admin role routing after the Teacher shell integration.
- Kept Firebase, Repository, Local Storage, Session Storage, and stock calculations out of the View.
- Preserved the four-read Teacher core refresh and date-scoped Attendance read.
- Defined Sprint 4.2 as Teacher Daily Attendance CRUD UI.

### Validation

- All 14 automated tests passed.
- Desktop Teacher shell passed.
- Teacher core Network gate passed at four reads and approximately 1.6 KB.
- No full rooms, room-history Attendance, deferred collection, write, or Main Stock request was visible during Teacher shell rendering.
- Offline mode changed the badge to `ออฟไลน์`.
- Returning online restored the badge to `ออนไลน์`.
- Teacher and post-Logout Console gates passed.
- 820 x 1180 Teacher Login and Logout passed.
- Admin Login regression passed.
- Admin Logout and Console gates passed.
- Feature branch synchronized with origin.
- Working tree clean.
- `index.html` and `teacher.html` unchanged.

### Integration Decision

- Approved for fast-forward merge into `develop`.
- Does not replace `teacher.html`.
- Does not authorize operational Attendance cutover.
- Does not authorize merge or deployment to `main`.
- Physical iPad testing remains deferred and is not represented as PASS.

## 2026-07-28 — Sprint 4.0 Cutover Readiness and Compatibility

### Added

- `docs/SPRINT_4_0_PLAN.md`
- `docs/CUTOVER_PARITY_MATRIX.md`
- `docs/CUTOVER_READINESS_REPORT.md`
- `docs/CUTOVER_DECISIONS.md`
- `docs/TEACHER_UI_INTEGRATION_PLAN.md`
- `docs/PRODUCTION_ROLLBACK_PLAN.md`
- `tests/cutover-concurrency-check.mjs`
- `tests/audit-recovery-check.mjs`
- `tests/cutover-documentation-check.mjs`

### Changed

- Added Firebase ETag reads using `X-Firebase-ETag: true`.
- Added conditional Room Stock writes using `If-Match`.
- Exposed HTTP 412 as a retryable conflict result.
- Added latest-value Room Stock recalculation and bounded ETag retry.
- Preserved Attendance-first save behavior.
- Converted partial Attendance saves into persistent Room Stock-only retries.
- Added persistent `attendanceAudit` recovery entries.
- Added audit-only replay without repeating successful Attendance or Room Stock mutations.
- Preserved Main Stock isolation for Attendance and Sync workflows.
- Recorded explicit production decisions for physical iPad, Report local adapter, XLSX parser, operational UIs, real Firebase concurrency, legacy queue evidence, and backup/restore.
- Added a phased operational Teacher UI integration plan.
- Added a production backup, deployment, smoke-test, and rollback procedure.
- Updated the V2 shell text to Sprint 4.0.
- Defined Sprint 4.1 as Teacher UI Shell and Read-Only State.

### Validation

- Login foundation checks passed.
- Stock module checks passed.
- Report module checks passed.
- Room module checks passed.
- Teacher module checks passed.
- Attendance module checks passed.
- Sync module checks passed.
- Firebase request-header checks passed.
- Performance module checks passed.
- Teacher core payload checks passed.
- Cutover concurrency checks passed.
- Audit recovery checks passed.
- Cutover documentation checks passed.
- Desktop Admin Login passed.
- Desktop Teacher Login passed.
- Direct Logout passed.
- Desktop Console evidence clean.
- 820 x 1180 Teacher Login and Logout passed.
- Responsive Console evidence clean.
- Feature branch synchronized with origin.
- Working tree clean.

### Integration Decision

- Approved for fast-forward merge into `develop`.
- Not approved for merge or deployment to `main`.
- Production traffic switching remains blocked.
- `index.html` and `teacher.html` remain protected operational rollback paths.
- Physical iPad testing is deferred and is not represented as PASS.

## 2026-07-28 — Sprint 3.9 Performance and Payload Optimization

### Added

- `tests/performance-module-check.mjs`
- `tests/firebase-request-header-check.mjs`
- `tests/teacher-core-payload-check.mjs`
- `docs/SPRINT_3_9_PLAN.md`
- `docs/PERFORMANCE_AUDIT_REPORT.md`

### Changed

- Added identical in-flight Firebase GET deduplication without persistent response caching.
- Removed automatic `Content-Type: application/json` from body-less Firebase GET requests to avoid unnecessary CORS preflights.
- Preserved JSON Content-Type for write requests.
- Added a five-minute cloned Login context cache.
- Reused already-loaded settings and rooms during immediate credential validation.
- Added the authenticated Teacher room snapshot to the session.
- Reused session room data during Teacher core refresh.
- Reduced default Teacher attendance loading to `mcAttendance/{roomId}_{date}/data` for today.
- Kept room-history and deferred Teacher data behind explicit `refreshFull()`.
- Excluded distributions, pending, retroactive, vacation, and stock transactions from normal Teacher refresh.
- Reduced QueueStorage upsert persistent reads from two to one.
- Added legacy/V2 queue compatibility and corrupt-record fixtures.
- Updated the V2 Sprint status message.

### Measured Desktop Result

Environment: Chrome desktop on Windows, Live Server, actual 83-room dataset.

- Before final Teacher core optimization: approximately 20.5 MB across 5 requests.
- After final Teacher core optimization: approximately 1.6 KB across 4 requests.
- Final core refresh included settings, one Room Stock value, today's attendance `/data`, and updatedAt.
- No rooms request, room-history attendance request, deferred collection request, GET preflight, or HTTP error was present.

These results describe the captured environment and are not universal production benchmarks.

### Validation

- Login foundation checks passed.
- Stock module checks passed.
- Report module checks passed.
- Room module checks passed.
- Teacher module checks passed.
- Attendance module checks passed.
- Sync module checks passed.
- Firebase request-header checks passed.
- Performance module checks passed.
- Teacher core payload checks passed.
- Admin Login passed.
- Teacher Login passed.
- Logout passed.
- Browser Network validation passed.
- Browser console clean after test-generated errors were cleared.
- Working tree clean.
- `index.html` and `teacher.html` unchanged.

### Deferred Cutover Gates

- Responsive mobile and physical iPad validation remain required.
- Legacy ETag compare-and-retry Room Stock protection remains unresolved in V2.
- Legacy/V2 production queue compatibility still requires cutover testing.
- Report local adapters, XLSX parsing, and complete-room multi-admin concurrency remain unresolved.

## 2026-07-27 — Sprint 3.8 Offline Queue and Sync Module

### Added

- `modules/storage/queueStorage.js`
- `modules/services/syncService.js`
- `modules/sync/syncManager.js`
- `tests/sync-module-check.mjs`
- `docs/SPRINT_3_8_PLAN.md`
- `docs/SYNC_MIGRATION_GAP_REPORT.md`

### Changed

- Added persistent queue compatibility through `tc_pending_saves_v1`.
- Added legacy queue alias normalization for `rec` and `diff`.
- Added individual corrupt-entry filtering without discarding valid entries.
- Added duplicate attendance replacement while preserving the first unsynced `baselinePresent` and original queue timestamp.
- Added Room Stock adjustment replay without rewriting attendance records.
- Added authenticated-room-only and sequential replay.
- Added individual success removal, failure retention, attempt counting, and retry timestamps.
- Added bounded exponential backoff at 5, 10, 20, 40, and 60 seconds.
- Added startup, reconnect, retry-timer, and periodic online flush orchestration.
- Added overlapping-flush protection and sync lifecycle events.
- Added `AttendanceService.adjustRoomStock` for Room Stock-only offline adjustment replay.
- Loaded Queue, Sync Service, and Sync Manager modules in dependency order from `index-v2.html`.

### Validation

- Login foundation checks passed.
- Stock module checks passed.
- Report module checks passed.
- Room module checks passed.
- Teacher module checks passed.
- Attendance module checks passed.
- Sync module architecture and workflow checks passed.
- Admin browser smoke test passed.
- Teacher browser smoke test passed.
- Logout passed.
- Browser console clean.
- Working tree clean.
- `index.html` and `teacher.html` unchanged.

### Known Gaps

- Operational queue badge, offline banner, media capture, signatures, and printing remain in `teacher.html`.
- Modular Attendance and Sync do not yet provide the legacy ETag compare-and-retry Room Stock protection for simultaneous writers.
- Production cutover still requires compatibility validation between legacy-written queues and V2 normalization.

## 2026-07-27 — Sprint 3.7 Attendance Module

### Added

- `modules/repositories/attendanceRepository.js`
- `modules/services/attendanceService.js`
- `modules/attendance/attendanceManager.js`
- `tests/attendance-module-check.mjs`
- `docs/SPRINT_3_7_PLAN.md`
- `docs/ATTENDANCE_MIGRATION_GAP_REPORT.md`

### Changed

- Added room-scoped attendance reads using the Firebase key-prefix range from `{roomId}_` through the high Unicode sentinel.
- Preserved attendance keys as `{roomId}_{YYYY-MM-DD}`.
- Added authenticated-room-only attendance read, save, edit, and delete boundaries.
- Added present and absent validation while preserving legacy attendance record fields.
- Added Room Stock adjustment based on the difference between previous and new present counts.
- Added attendance deletion rollback that restores the deleted present count to Room Stock.
- Added compatible `ATTENDANCE` and `ROLLBACK` ledger records.
- Added compatible `stockLog` records.
- Added Firebase multi-location attendance mutation updates under `milkApp`.
- Loaded Attendance modules in dependency order from `index-v2.html`.

### Validation

- Login foundation checks passed.
- Stock module checks passed.
- Report module checks passed.
- Room module checks passed.
- Teacher module checks passed.
- Attendance module architecture and business-rule checks passed.
- Admin Login browser smoke test passed.
- Teacher Login browser smoke test passed.
- Logout browser smoke test passed.
- Browser console clean.
- Working tree clean.
- `index.html` and `teacher.html` unchanged.

### Known Gaps

- Operational attendance forms, media capture, signatures, and printing remain in `teacher.html`.
- The modular multi-location PATCH does not yet include the legacy ETag compare-and-retry Room Stock protection.
- Persistent offline queue, retry, reconnect flush, baseline preservation, and queued-edit conflict handling move to Sprint 3.8.

## 2026-07-27 — Sprint 3.6 Teacher Module

### Added

- `modules/services/teacherService.js`
- `modules/teacher/teacherManager.js`
- `tests/teacher-module-check.mjs`
- `docs/SPRINT_3_6_PLAN.md`
- `docs/TEACHER_MIGRATION_GAP_REPORT.md`

### Changed

- Expanded `modules/repositories/teacherRepository.js` into a room-scoped, read-only teacher Firebase boundary.
- Added JSON-encoded Realtime Database query-parameter support to `FirebaseService`.
- Added scoped query reads to `BaseRepository`.
- Added authenticated-room-only Room Stock, attendance, distributions, pending, retroactive, vacation, ledger, and update reads.
- Added the `mcAttendance` `{roomId}_` prefix query to avoid downloading all-school attendance.
- Added Teacher session validation, Admin-session rejection, and cross-room access rejection.
- Added teacher dashboard calculations and Room Stock-only command preparation.
- Loaded Teacher modules in dependency order from `index-v2.html`.

### Validation

- Login foundation checks passed.
- Stock module checks passed.
- Report module checks passed.
- Room module checks passed.
- Teacher module architecture and workflow checks passed.
- Teacher browser smoke test passed.
- Browser console clean.
- Working tree clean.
- `index.html` and `teacher.html` unchanged.

### Known Gaps

- Operational forms, media capture, signatures, print views, attendance writes, and atomic Room Stock writes remain in `teacher.html`.
- Attendance write migration is scheduled for Sprint 3.7.
- Persistent offline queue and retry behavior remain unchanged until Sprint 3.8.

## 2026-07-27 — Sprint 3.5 Room Module

### Added

- `modules/services/roomService.js`
- `modules/room/roomManager.js`
- `tests/room-module-check.mjs`
- `docs/SPRINT_3_5_PLAN.md`
- `docs/ROOM_MIGRATION_GAP_REPORT.md`

### Changed

- Expanded `modules/repositories/roomRepository.js` into the room Firebase boundary.
- Added room reads, complete room collection writes, and dependency reads for deletion safety.
- Added array- and object-shaped room normalization.
- Added manual room creation and metadata update workflows.
- Made existing Room IDs immutable during edits.
- Preserved Room Stock during edits and repeated imports.
- Added duplicate room ID, duplicate room name, and duplicate student validation.
- Added student import preparation while preserving imported fields and existing metadata.
- Added deletion dependency reports and blocking for operational references.
- Loaded Room modules in dependency order from `index-v2.html`.

### Validation

- Login foundation static checks passed.
- Stock module checks passed.
- Report module checks passed.
- Room module architecture and workflow checks passed.
- Admin browser smoke test passed.
- Browser console clean.
- Working tree clean.
- `index.html` and `teacher.html` unchanged.

### Known Gaps

- XLSX binary parsing remains in the legacy file; RoomService accepts already parsed sheet data.
- Complete `milkApp/rooms` writes do not yet include multi-admin optimistic concurrency control.

## 2026-07-27 — Sprint 3.4.4 Report Module

### Added

- `modules/report/reportManager.js`
- `tests/report-module-check.mjs`
- `docs/SPRINT_3_4_4_PLAN.md`
- `docs/REPORT_MIGRATION_GAP_REPORT.md`

### Changed

- Expanded `modules/repositories/reportRepository.js` into a read-only Firebase report boundary.
- Expanded `modules/services/reportService.js` with classroom, grade-level, and whole-school aggregation.
- Added Thai grade normalization for dotted and non-dotted room names.
- Added distributed, attendance, pending, retroactive, vacation, remaining, and percentage-used totals.
- Added print and Excel export models.
- Added cached report view switching without additional Firebase reads.
- Loaded report modules in dependency order from `index-v2.html`.
- Corrected Node.js 24 tests for cross-VM object comparison and locale-dependent Thai sorting.

### Validation

- Login foundation static checks passed.
- Stock module static and business-rule checks passed.
- Report module architecture and aggregation checks passed.
- Admin login passed.
- Browser console clean.
- Working tree clean.
- `index.html` and `teacher.html` unchanged.

### Known Gap

- Browser-local pending, retroactive, and vacation collections still require a Storage/Sync adapter before the V2 report replaces the operational legacy report.

## 2026-07-27 — Sprint 3.4.3 Stock Module

### Added

- `modules/services/stockService.js`
- `modules/stock/stockManager.js`
- `tests/stock-module-check.mjs`
- `docs/SPRINT_3_4_3_PLAN.md`
- `docs/STOCK_MIGRATION_GAP_REPORT.md`

### Changed

- Expanded `modules/repositories/stockRepository.js` to own all stock-related Firebase paths and multi-location updates.
- Loaded stock modules in dependency order from `index-v2.html`.
- Added Main Stock receive and classroom distribution workflows.
- Added Room Stock consumption for attendance, pending, retroactive, and vacation operations.
- Added Room Stock rollback, stock rebuild, validation, and compatible stock ledger calculations.
- Updated Sprint and project documentation.
- Suppressed the unnecessary missing favicon request in the V2 shell.

### Validation

- Login foundation static checks passed.
- Stock module static and business-rule checks passed.
- Admin login passed.
- Teacher login passed.
- Logout passed.
- Browser console clean.
- Working tree clean.
- `index.html` and `teacher.html` unchanged.

## 2026-07-27 — Sprint 3.4.2 Recovery Foundation

### Added or Restored

- Runtime Firebase configuration.
- Firebase Realtime Database REST service.
- Repository foundation through `BaseRepository`.
- Admin and Teacher login flow.
- Compatible `milkApp_loginSession` session storage.
- V2 bootstrap and dependency order.
- Login foundation static tests.

### Validation

- Firebase room loading passed.
- Incorrect Admin and Teacher passwords rejected.
- Correct Admin and Teacher passwords accepted.
- Logout and session clearing passed.
