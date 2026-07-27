# MilkSchoolSystem V2

## Project Memory

Version: 2.4

Last updated: 2026-07-27

## Project Goal

Migrate the existing school-specific MilkSchoolSystem into a configurable platform while preserving verified legacy behavior.

## Source of Truth

Timeline A — Migration Execution

Current backend:

- Firebase Realtime Database
- REST access through `FirebaseService`

Protected operational legacy files:

- `index.html`
- `teacher.html`

V2 integration shell:

- `index-v2.html`

## Target Architecture

UI

→ Manager

→ Service

→ Repository / Storage Adapter

→ FirebaseService or persistent browser storage

Repositories and storage adapters contain persistence paths and serialization only.

Services contain validation, calculation, workflow, retry, and business rules.

Managers contain UI-safe commands, browser lifecycle orchestration, and events only.

## Stock Business Rules

### Main Stock

Main Stock changes only through:

- RECEIVE: increases Main Stock
- DISTRIBUTE: decreases Main Stock
- rollback of those same Main Stock operations

Main Stock must not be reduced by teacher, attendance, or sync operations.

### Room Stock

Classroom distribution increases the destination Room Stock.

The following operations reduce Room Stock only:

- ATTENDANCE
- PENDING
- RETRO
- VACATION

Attendance edits adjust Room Stock by the difference between the previous and new present totals.

Attendance deletion restores the previously consumed Room Stock.

Rollback restores the same stock layer changed by the original operation.

### Rebuild and Validation

Main Stock expected value:

`receives - classroom distributions`

Room Stock expected value:

`classroom distributions - attendance - pending - retroactive - vacation`

Transaction history is the source of truth for rebuild calculations.

## Firebase Paths Preserved

Under `milkApp`:

- `settings`
- `rooms`
- `stock`
- `roomStock`
- `receives`
- `distributes`
- `mcAttendance`
- `absentMilk`
- `retroMilk`
- `vacationMilk`
- `stockTransactions`
- `stockLog`
- `updatedAt`

## Completed Migration Work

### Sprint 3.4.2 Recovery

- Runtime Firebase configuration
- Realtime Database REST service
- BaseRepository
- Admin and Teacher login
- Session compatibility through `milkApp_loginSession`
- Bootstrap and V2 dependency order
- Browser and static validation

Merged into `develop` at `648fa6d`.

### Sprint 3.4.3 Stock Module

- Stock Repository, Service, and Manager boundaries
- receive and classroom distribution workflows
- Room Stock consumption and rollback workflows
- rebuild and validation calculations
- compatible ledger records
- stock static and business-rule tests

Merged into `develop` at `f56e430` after all validation gates passed.

### Sprint 3.4.4 Report Module

- read-only report repository boundary
- classroom, grade-level, and whole-school aggregation
- Thai grade normalization and natural sorting
- distribution and Room Stock consumption totals
- print and Excel export models
- cached view switching
- report architecture and aggregation tests

Known gap:

The operational legacy report also uses browser-local pending, retroactive, and vacation collections. A Storage/Sync adapter is still required before V2 replaces the operational report.

### Sprint 3.5 Room Module

- room repository, service, and manager boundaries
- array and object room normalization
- manual room creation and metadata editing
- immutable Room IDs during edits
- Room Stock preservation during edits and repeated imports
- duplicate room and student validation
- student import preparation
- deletion dependency reports and safety blocking
- room architecture and workflow tests

Known gaps:

- XLSX binary parsing remains in the legacy file.
- Complete `milkApp/rooms` writes do not yet include multi-admin optimistic concurrency control.

### Sprint 3.6 Teacher Module

- room-scoped Teacher Repository, Service, and Manager boundaries
- Firebase query-parameter support
- `mcAttendance` key-prefix query for one room only
- authenticated-room-only teacher data
- Admin-session and cross-room rejection
- room and student normalization
- teacher dashboard totals
- Room Stock-only command preparation
- Teacher architecture and workflow tests

### Sprint 3.7 Attendance Module

- `modules/repositories/attendanceRepository.js`
- `modules/services/attendanceService.js`
- `modules/attendance/attendanceManager.js`
- room-scoped attendance reads using `{roomId}_` key-prefix queries
- legacy-compatible attendance key `{roomId}_{YYYY-MM-DD}`
- present and absent status validation
- attendance create and edit workflows
- Room Stock adjustment by present-count difference
- attendance deletion and Room Stock rollback
- compatible `ATTENDANCE` and `ROLLBACK` ledger records
- compatible `stockLog` records
- Firebase multi-location mutation boundary
- Attendance architecture and business-rule tests

### Sprint 3.8 Offline Queue and Sync Module

- `modules/storage/queueStorage.js`
- `modules/services/syncService.js`
- `modules/sync/syncManager.js`
- persistent `tc_pending_saves_v1` queue compatibility
- legacy `rec` and `diff` alias normalization
- individual corrupt-entry filtering
- duplicate attendance replacement with original baseline preservation
- original queue timestamp preservation
- failed-entry retry metadata
- Room Stock adjustment replay without rewriting attendance
- authenticated-room-only replay
- sequential replay
- successful-entry individual removal
- failed-entry retention and attempt increment
- bounded 5s, 10s, 20s, 40s, and 60s backoff
- startup, reconnect, retry, and periodic flush orchestration
- overlapping flush prevention
- sync lifecycle and queue-count events
- Sync architecture and workflow tests

Validation completed:

- Login foundation tests passed
- Stock tests passed
- Report tests passed
- Room tests passed
- Teacher tests passed
- Attendance tests passed
- Sync tests passed
- Admin browser smoke test passed
- Teacher browser smoke test passed
- Logout passed
- Browser console clean
- Working tree clean
- Legacy files unchanged

Known gaps:

- Operational queue badge, offline banner, media, signatures, and print UI remain in `teacher.html`.
- Production cutover still requires compatibility validation between legacy-written queues and V2 normalization.
- Modular Attendance and Sync still lack legacy ETag compare-and-retry protection for simultaneous Room Stock writers.

## Next Sprint

Sprint 3.9 — Performance and Payload Optimization

Planned boundaries:

- measure and document login request count and payload size
- verify all attendance reads are scoped to one room
- audit lazy loading and cache invalidation
- reduce unnecessary Firebase reads without changing schema
- validate desktop, mobile, and iPad behavior
- add repeatable performance checks without inventing unsupported timings
- validate legacy and V2 queue compatibility using representative fixtures

Protected requirements:

- Main Stock and Room Stock rules remain unchanged
- Firebase paths remain compatible
- Admin and Teacher login remain operational
- queue entries and original baselines remain persistent
- legacy `index.html` and `teacher.html` remain read-only during Sprint 3.x extraction

## Development Rules

- Never commit directly to `main`.
- Use `develop` for integration.
- Use `feature/*` branches for Sprint work.
- Do not modify `index.html` or `teacher.html` during Sprint 3.x migration unless explicitly approved.
- Do not change verified business logic while extracting modules.
- Run all available regression, module, browser, and clean-tree checks before merging.
