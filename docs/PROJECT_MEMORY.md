# MilkSchoolSystem V2

## Project Memory

Version: 2.5

Last updated: 2026-07-28

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

Merged into `develop` at `f56e430`.

### Sprint 3.4.4 Report Module

- read-only report repository boundary
- classroom, grade-level, and whole-school aggregation
- Thai grade normalization and natural sorting
- distribution and Room Stock consumption totals
- print and Excel export models
- cached view switching
- report architecture and aggregation tests

Known gap:

The operational legacy report also uses browser-local pending, retroactive, and vacation collections. An adapter is still required before V2 replaces the operational report.

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
- authenticated-room-only Teacher data
- Admin-session and cross-room rejection
- room and student normalization
- Teacher dashboard totals
- Room Stock-only command preparation
- Teacher architecture and workflow tests

### Sprint 3.7 Attendance Module

- Attendance Repository, Service, and Manager boundaries
- legacy-compatible attendance key `{roomId}_{YYYY-MM-DD}`
- present and absent validation
- attendance create and edit workflows
- Room Stock adjustment by present-count difference
- attendance deletion and Room Stock rollback
- compatible ledger and stockLog records
- Firebase multi-location mutation boundary
- Attendance architecture and business-rule tests

### Sprint 3.8 Offline Queue and Sync Module

- QueueStorage, SyncService, and SyncManager
- persistent `tc_pending_saves_v1` compatibility
- legacy `rec` and `diff` alias normalization
- corrupt-entry filtering
- duplicate attendance replacement with original baseline preservation
- Room Stock adjustment replay without rewriting attendance
- authenticated-room-only sequential replay
- successful-entry removal and failed-entry retention
- bounded 5s, 10s, 20s, 40s, and 60s backoff
- startup, reconnect, retry, and periodic flush orchestration
- overlapping flush prevention
- sync lifecycle events

Known gaps:

- Operational queue badge, offline banner, media, signatures, and print UI remain in `teacher.html`.
- Modular Attendance and Sync still lack legacy ETag compare-and-retry protection for simultaneous Room Stock writers.

### Sprint 3.9 Performance and Payload Optimization

- identical in-flight Firebase GET deduplication
- GET preflight removal by omitting JSON Content-Type on body-less reads
- five-minute cloned Login context cache
- immediate Login reuse of settings and rooms
- Teacher session `roomSnapshot`
- Teacher core refresh reuse of authenticated room data
- default Teacher attendance read reduced to `mcAttendance/{roomId}_{today}/data`
- deferred Teacher collections excluded from normal refresh
- explicit `refreshFull()` retained for history and deferred data
- QueueStorage upsert read reduction
- legacy and V2 queue compatibility fixtures
- Firebase header, performance, and Teacher core payload tests

Desktop browser measurement on the actual 83-room dataset:

- before final core optimization: approximately 20.5 MB across 5 requests
- after final core optimization: approximately 1.6 KB across 4 requests
- no rooms request
- no room-history attendance request
- no GET preflight
- no HTTP error

All regression, performance, browser, Login, Logout, console, and clean-tree gates passed.

Device note:

Responsive mobile and physical iPad validation were not demonstrated during Sprint 3.9 and remain required before production cutover.

## Current Phase

Sprint 4.0 — Cutover Readiness and Compatibility

Planned boundaries:

- legacy-to-V2 parity matrix
- physical iPad and responsive mobile validation
- queue compatibility against legacy-produced data
- ETag Room Stock concurrency design and implementation gate
- Report browser-local adapter readiness
- XLSX import parser migration decision
- operational Teacher UI integration plan
- rollback, backup, deployment, and production cutover checklist

Protected requirements:

- Main Stock and Room Stock rules remain unchanged
- Firebase paths remain compatible
- Admin and Teacher Login remain operational
- queue entries and original baselines remain persistent
- attendance keys remain compatible
- legacy files remain available until explicit cutover approval

## Development Rules

- Never commit directly to `main`.
- Use `develop` for integration.
- Use `feature/*` branches for Sprint work.
- Do not remove or rewrite legacy files before parity, rollback, device, and data-compatibility gates pass.
- Do not change verified business logic while integrating the modular system.
- Run all available regression, module, browser, device, data-compatibility, and clean-tree checks before production cutover.
