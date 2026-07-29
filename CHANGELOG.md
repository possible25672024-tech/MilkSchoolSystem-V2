# Changelog

All notable modular migration changes are recorded here.

## 2026-07-29 — Sprint 4.4 Pending Milk Operational UI

### Added

- `modules/repositories/pendingMilkRepository.js`
- `modules/services/pendingMilkService.js`
- `modules/pending/pendingMilkManager.js`
- `modules/pending/pendingMilkView.js`
- `tests/pending-milk-module-check.mjs`
- `tests/pending-milk-recovery-routing-check.mjs`
- `tests/pending-milk-ui-check.mjs`
- `tests/pending-milk-isolated-write-check.mjs`
- `docs/PENDING_MILK_LEGACY_AUDIT.md`
- `docs/PENDING_MILK_RECOVERY_ROUTING_GATE.md`
- `docs/PENDING_MILK_ISOLATED_WRITE_GATE.md`
- `docs/PENDING_MILK_UI_IMPLEMENTATION_REPORT.md`
- `docs/PENDING_MILK_BROWSER_VALIDATION_REPORT.md`
- `docs/FIREBASE_RULES_PENDING_MILK_INDEX.md`

### Changed

- Added exact Monday–Friday Attendance reads for Pending Milk eligibility.
- Added authenticated-room `absentMilk` query and Firebase `roomId` index.
- Added absent-only eligibility and already-issued exclusion.
- Added Service-level duplicate prevention for student/date pairs.
- Preserved compatible `absentMilk` record fields and Firebase push IDs.
- Added Room Stock-only issue and rollback.
- Added `PENDING` and `ROLLBACK` ledger routing.
- Added `OUT` and `IN` stockLog routing.
- Added typed Queue recovery for partial issue and delete stock work.
- Preserved audit-only recovery without repeating Room Stock mutation.
- Kept Main Stock unchanged.
- Kept `index.html` and `teacher.html` unchanged.

### Validation

- All four Sprint-specific tests passed.
- All 22 regression checks passed.
- Successful two-box issue changed Room Stock `50 → 48`.
- Duplicate student/date issue was blocked.
- Successful delete restored Room Stock `48 → 50`.
- Partial issue queued typed `PENDING` difference `1`.
- Partial delete queued typed `ROLLBACK` difference `-1`.
- Main Stock remained 999 throughout isolated tests.
- Admin regression passed.
- Exactly five date-scoped Attendance reads were observed.
- Indexed room-scoped `absentMilk` query returned HTTP 200.
- Eligibility, already-issued, empty state, and room history rendered.
- Network remained read-only with no POST, PUT, PATCH, or DELETE.
- Console remained clean.
- Completed-data 820 x 1180 responsive gate passed.
- Feature branch, origin, and `develop` were synchronized at the integration point.
- Working tree was clean.

### Integration Decision

- Approved for fast-forward merge into `develop`.
- Does not replace `teacher.html`.
- Does not authorize merge or deployment to `main`.
- Does not authorize production cutover while the real-data incident and Firebase security blocker remain open.
- Next Sprint: Retroactive Milk Operational UI.

## 2026-07-29 — Sprint 4.3 Offline Queue Operational UI

### Added

- `modules/sync/syncView.js`
- `tests/sync-ui-check.mjs`
- `tests/sync-restart-reconnect-check.mjs`
- `docs/SPRINT_4_3_PLAN.md`
- `docs/SYNC_UI_IMPLEMENTATION_REPORT.md`
- `docs/SYNC_UI_BROWSER_VALIDATION_REPORT.md`

### Changed

- Added operational online, offline, syncing, pending, failed, deferred, and synchronized states.
- Added persistent queue count, maximum attempts, last successful sync time, latest summary, and next retry display.
- Added safe item-level queue summaries without student, photo, signature, ledger, or stockLog payload exposure.
- Added manual retry through `SyncManager.flushNow("manual-ui")`.
- Disabled retry while offline, flushing, or empty.
- Added Teacher-only Sync lifecycle start/stop and event-driven rendering.
- Added safe `queueItems` to `SyncManager.getStatus()`.
- Preserved overlapping-flush protection and Main Stock isolation.
- App initializes SyncView after Login, Teacher, and Attendance Views.
- Kept QueueStorage, SyncService, Firebase, Repository, fetch, Local Storage, and Session Storage out of the View.
- Corrected the Sync UI test to accept programmatic `sync-panel` creation without changing Runtime.

### Validation

- All 18 regression checks passed on Node.js 24.18.0.
- QueueStorage recreation persistence passed.
- Offline startup performed no replay.
- Reconnect replayed isolated entries sequentially.
- Successful entries were removed individually.
- Failed/deferred entries and retry metadata survived restart.
- Attendance partial save converted to Room Stock-only work.
- Main Stock remained 999 throughout isolated replay.
- Browser queue was empty before Teacher Login.
- Offline/reconnect transitions and settled synchronized state passed.
- Network evidence showed read-only GET/fetch traffic with no visible PUT, PATCH, or DELETE.
- Console remained clean.
- Teacher Logout hid Queue UI.
- Admin Login/Logout remained unchanged.
- 820 x 1180 responsive layout passed.
- Feature branch synchronized with origin and working tree clean.
- `index.html` and `teacher.html` remained unchanged.

### Integration Decision

- Approved for fast-forward merge into `develop`.
- Does not replace `teacher.html`.
- Does not authorize merge or deployment to `main`.
- Does not authorize production cutover while the real-data incident remains open.
- Next Sprint: Pending Milk Operational UI.

## 2026-07-28 — Sprint 4.2 Teacher Daily Attendance CRUD UI

### Added

- `modules/attendance/attendanceView.js`
- `tests/attendance-ui-check.mjs`
- `tests/attendance-isolated-write-check.mjs`
- `docs/SPRINT_4_2_PLAN.md`
- `docs/ATTENDANCE_UI_IMPLEMENTATION_REPORT.md`
- `docs/ATTENDANCE_ISOLATED_WRITE_GATE.md`
- `docs/ATTENDANCE_REAL_DATA_TEST_INCIDENT.md`

### Changed

- Added a date-scoped daily Attendance form to the modular Teacher shell.
- Added authenticated-room-only student rendering.
- Added present/absent controls and per-student notes.
- Added checked, present, absent, and unchecked totals.
- Added one-day loading through `AttendanceManager.loadDay()`.
- Added create/edit through `AttendanceManager.save()`.
- Added confirmed delete through `AttendanceManager.remove()`.
- Added Room Stock before/after, ETag conflict, queue, and audit feedback.
- Preserved existing `photos`, `signature`, `year`, `term`, and `savedAt` during edits.
- Kept Firebase, Repository, browser storage, stock calculations, ledger, retry, and ETag ownership out of the View.
- Preserved Main Stock isolation.
- Added responsive desktop and 820 x 1180 Attendance layouts.
- Corrected Node.js 24 cross-VM Array comparison in the UI test.
- Corrected the Cutover documentation test to accept both valid Sprint 4.1 merge phrases.

### Isolated Write Validation

- Create 3 present changed Room Stock `50 → 47`.
- Edit 3 to 5 present deducted only 2: `47 → 45`.
- Edit 5 to 2 present restored only 3: `45 → 48`.
- Delete restored 2: `48 → 50`.
- Main Stock remained 999 throughout.
- Compatible Attendance keys and record fields were preserved.
- Successful operations created compatible ledger and stockLog records.
- Deliberate Room Stock failure after Attendance save queued exactly one Room Stock retry.
- No production Firebase service or repository was loaded by the isolated test.

### Validation

- All 16 regression checks accepted as passed.
- Admin Login and Logout regression passed.
- Desktop exact-date Attendance read passed.
- No full-history, cross-room, Main Stock, or write request occurred during read-only validation.
- Complete 820 x 1180 Attendance interaction passed.
- Save, Delete, and Logout remained reachable.
- Desktop and responsive Console gates passed.
- Feature branch synchronized with origin.
- Working tree clean.
- `index.html` and `teacher.html` unchanged.

### Real-Data Incident

- A development write was confirmed against real room `อ.3-3` / `mqn0z13eyx5b`, date `2026-07-28`.
- The test-created record remains with 22 present and 3 absent.
- Room Stock remains 1,253 versus recorded pre-test 1,275.
- The room/date is quarantined and must not be used for additional tests or trusted operational evidence.
- Room `อ.3-4` / `mqn0z13emyrc` was verified as Attendance `null` and Room Stock 350.
- Recovery was deferred by the product owner so development could continue.
- Recovery and incident closure remain mandatory before `main` or production cutover.

### Integration Decision

- Approved for fast-forward merge into `develop`.
- Does not replace `teacher.html`.
- Does not authorize merge or deployment to `main`.
- Does not authorize production cutover while the incident remains open.
- Next Sprint: Offline Queue Operational UI.

## 2026-07-28 — Sprint 4.1 Teacher UI Shell and Read-Only State

### Added

- `modules/teacher/teacherView.js`
- `tests/teacher-ui-shell-check.mjs`
- `docs/SPRINT_4_1_PLAN.md`
- `docs/TEACHER_UI_SHELL_VALIDATION_REPORT.md`

### Changed

- Added separate Admin and Teacher shell containers.
- Added school, room, teacher, current Room Stock, queue count, and online/offline state.
- Added Teacher Logout and restored-session rendering.
- Preserved Admin role routing.
- Kept Firebase, Repository, Local Storage, Session Storage, and stock calculations out of the View.
- Preserved the four-read Teacher core refresh.

### Validation

- All 14 automated tests passed.
- Desktop Teacher core Network passed at four reads and approximately 1.6 KB.
- Offline/Online, Teacher, Admin, Logout, desktop, 820 x 1180, and Console gates passed.
- Working tree clean.
- `index.html` and `teacher.html` unchanged.

### Integration Decision

- Fast-forward merged into `develop`.
- Did not replace `teacher.html`.
- Did not authorize operational Attendance cutover or `main` deployment.

## 2026-07-28 — Sprint 4.0 Cutover Readiness and Compatibility

### Added

- Cutover parity, readiness, decision, Teacher UI integration, production rollback, concurrency, audit-recovery, and documentation artifacts.

### Changed

- Added Firebase ETag reads and `If-Match` writes.
- Added HTTP 412 conflict retry and latest-value Room Stock recalculation.
- Preserved Attendance-first writes.
- Added persistent Room Stock-only and audit-only recovery.
- Preserved Main Stock isolation.

### Validation and Decision

- Automated, desktop, responsive, Console, and clean-tree gates passed.
- Fast-forward merged into `develop`.
- Production traffic switching and `main` remained blocked.
- `index.html` and `teacher.html` remained protected.
- Physical iPad testing remained deferred.

## 2026-07-28 — Sprint 3.9 Performance and Payload Optimization

### Added

- Performance, Firebase request-header, and Teacher core-payload tests.
- Performance audit report.

### Changed

- Added in-flight GET deduplication.
- Removed unnecessary GET preflight headers.
- Added Login context reuse and Teacher room snapshots.
- Reduced normal Teacher refresh to date-scoped core reads.
- Deferred history and secondary collections.

### Measured Result

- Before: approximately 20.5 MB across 5 requests.
- After: approximately 1.6 KB across 4 requests.

## 2026-07-27 — Sprint 3.8 Offline Queue and Sync

### Added

- `QueueStorage`, `SyncService`, `SyncManager`, Sync tests, plan, and gap report.

### Changed

- Preserved `tc_pending_saves_v1`.
- Added legacy `rec` and `diff` compatibility.
- Added corrupt-entry filtering, duplicate replacement with original baseline preservation, sequential replay, bounded backoff, reconnect/startup flush, Room Stock-only replay, and audit-only recovery.

## 2026-07-27 — Sprint 3.7 Attendance Service Foundation

### Added

- Attendance Repository, Service, Manager, tests, plan, and gap report.

### Changed

- Added room-scoped Attendance keys and queries.
- Added create, edit-by-difference, delete rollback, ledger, stockLog, and Main Stock isolation.

## 2026-07-27 — Sprint 3.6 Teacher Service Foundation

### Added

- Teacher Repository, Service, Manager, tests, plan, and gap report.

### Changed

- Added authenticated-room-only reads, scoped Attendance query, session validation, dashboard calculations, and Room Stock-only commands.

## 2026-07-27 — Sprint 3.5 Room

### Added

- Room Service, Manager, tests, plan, and gap report.

### Changed

- Added stable Room IDs, Room Stock preservation, duplicate validation, parsed-sheet import preparation, and deletion safety.

## 2026-07-27 — Sprint 3.4.4 Report

### Added

- Report Manager, tests, plan, and gap report.

### Changed

- Added read-only classroom, grade, and whole-school aggregation, Thai grade normalization, print/Excel models, and cached view switching.

## 2026-07-27 — Sprint 3.4.3 Stock

### Added

- Stock Service, Manager, tests, plan, and gap report.

### Changed

- Added Main Stock receive/distribution, Room Stock consumption/rollback, rebuild, validation, and compatible ledger calculations.

## 2026-07-27 — Sprint 3.4.2 Recovery Foundation

### Added or Restored

- Runtime Firebase configuration.
- Firebase Realtime Database REST service.
- BaseRepository.
- Admin and Teacher login.
- Compatible `milkApp_loginSession` storage.
- V2 bootstrap and Login foundation tests.
