# MilkSchoolSystem V2

## Project Memory

Version: 2.8

Last updated: 2026-07-28

## Project Goal

Migrate the school-specific MilkSchoolSystem into a configurable modular platform while preserving verified legacy behavior, Firebase compatibility, and a reversible production path.

## Source of Truth

Timeline A — Migration Execution

Backend:

- Firebase Realtime Database
- REST access through `FirebaseService`

Protected operational legacy files:

- `index.html`
- `teacher.html`

V2 integration shell:

- `index-v2.html`

## Target Architecture

UI / View

→ Manager

→ Service

→ Repository / Storage Adapter

→ FirebaseService or persistent browser storage

Repositories and storage adapters own paths, queries, serialization, and persistence.

Services own validation, calculation, workflow, retry, compatibility, and business rules.

Managers own UI-safe commands, browser lifecycle orchestration, and events.

Views own DOM rendering and interaction and must not access Firebase, persistent storage, or calculate stock rules directly.

## Protected Stock Rules

### Main Stock

Main Stock changes only through:

- RECEIVE: increases Main Stock
- DISTRIBUTE: decreases Main Stock
- rollback of those same Main Stock operations

Teacher, Attendance, Pending, Retroactive, Vacation, and Sync operations must never change Main Stock.

### Room Stock

Classroom distribution increases Room Stock.

Room Stock decreases through:

- ATTENDANCE
- PENDING
- RETRO
- VACATION

Attendance edits adjust Room Stock by the difference between previous and new present totals.

Attendance deletion restores the previously consumed quantity.

ETag conflicts read the newest Room Stock and recalculate before retry.

Negative Room Stock remains visible and is not silently clamped.

### Rebuild

Main Stock expected value:

`receives - classroom distributions`

Room Stock expected value:

`classroom distributions - attendance - pending - retroactive - vacation`

Transaction history remains the source of truth.

## Preserved Firebase Paths

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

Attendance key:

`{roomId}_{YYYY-MM-DD}`

Persistent browser queue key:

`tc_pending_saves_v1`

## Completed Migration Work

### Sprint 3.4.2 — Recovery Foundation

- runtime Firebase configuration
- Firebase REST service
- BaseRepository
- Admin and Teacher login
- compatible session storage
- V2 bootstrap and dependency order

Merged into `develop` at `648fa6d`.

### Sprint 3.4.3 — Stock

- Stock Repository, Service, and Manager
- Main Stock receive and classroom distribution
- Room Stock consumption and rollback
- rebuild, validation, and ledger rules

Merged into `develop` at `f56e430`.

### Sprint 3.4.4 — Report

- read-only report boundary
- classroom, grade, and school aggregation
- Thai grade normalization
- print and Excel models

Known production gap: browser-local pending, retroactive, and vacation adapter.

### Sprint 3.5 — Room

- Room Repository, Service, and Manager
- immutable Room IDs
- Room Stock preservation
- duplicate validation
- parsed-sheet import preparation
- deletion safety

Known production gaps: XLSX binary parsing remains legacy and complete-room multi-admin concurrency remains unresolved.

### Sprint 3.6 — Teacher Service Foundation

- room-scoped Teacher Repository, Service, and Manager
- authenticated-room-only access
- dashboard and Room Stock-only commands

### Sprint 3.7 — Attendance Service Foundation

- Attendance Repository, Service, and Manager
- compatible Attendance keys
- create, edit-by-difference, delete rollback
- ledger and stockLog records
- Main Stock isolation

### Sprint 3.8 — Offline Queue and Sync

- QueueStorage, SyncService, and SyncManager
- legacy `rec` and `diff` compatibility
- corrupt-entry filtering
- original baseline preservation
- sequential replay
- bounded 5, 10, 20, 40, and 60 second backoff
- startup, reconnect, retry, and periodic flush
- Room Stock-only and audit-only recovery

### Sprint 3.9 — Performance and Payload Optimization

- in-flight GET deduplication
- GET preflight removal
- Login context reuse
- Teacher `roomSnapshot`
- default Teacher core refresh reduced to four reads
- today's Attendance `/data` child only
- deferred history loading

Recorded Chrome desktop result on the 83-room dataset:

- before: approximately 20.5 MB across 5 requests
- after: approximately 1.6 KB across 4 requests

### Sprint 4.0 — Cutover Readiness and Compatibility

- Firebase ETag reads through `X-Firebase-ETag: true`
- conditional Room Stock writes through `If-Match`
- HTTP 412 retry and newest-value recalculation
- partial Attendance-save recovery
- persistent Room Stock-only retry
- persistent `attendanceAudit` recovery
- audit-only retry without repeated Room Stock mutation
- deterministic concurrency and audit tests
- parity, decision, Teacher integration, backup, and rollback documentation

Merged into `develop` at `c4b429d`.

### Sprint 4.1 — Teacher UI Shell and Read-Only State

Runtime and evidence:

- modular `TeacherView`
- separate Admin and Teacher shell containers
- school, room, teacher, Room Stock, queue count, and online/offline display
- Logout delegation and restored-session rendering
- no direct Firebase, Repository, Local Storage, Session Storage, or stock calculations in the View
- all 14 tests passed
- desktop Teacher core Network passed at four reads and approximately 1.6 KB
- Offline/Online, Admin, Teacher, Logout, responsive, and Console gates passed
- `index.html` and `teacher.html` unchanged

Merged into `develop` at `3a777db`.

### Sprint 4.2 — Teacher Daily Attendance CRUD UI

Runtime:

- added `modules/attendance/attendanceView.js`
- date-scoped daily Attendance form
- authenticated-room student list
- present/absent controls and notes
- checked/present/absent/unchecked totals
- one-day loading through `AttendanceManager.loadDay()`
- create/edit through `AttendanceManager.save()`
- confirmed delete through `AttendanceManager.remove()`
- Room Stock before/after, conflict, queue, and audit feedback
- compatible `photos`, `signature`, `year`, `term`, and `savedAt` preservation
- no direct Firebase, Repository, storage, stock calculation, ledger, retry, or ETag ownership in the View
- `index.html` and `teacher.html` unchanged

Automated evidence:

- original 15 regression tests passed
- complete in-memory isolated write test added
- create 3 present changed Room Stock `50 → 47`
- edit 3 to 5 present deducted only 2: `47 → 45`
- edit 5 to 2 present restored only 3: `45 → 48`
- delete restored 2: `48 → 50`
- Main Stock remained 999
- compatible Attendance key and fields preserved
- ledger and stockLog created for successful operations
- deliberate partial-save simulation queued exactly one Room Stock retry
- all 16 regression checks accepted as passed after correcting one exact documentation-wording assertion
- branch synchronized with origin
- working tree clean

Browser evidence:

- Admin regression passed
- desktop date-scoped read and exact-key Network gate passed
- no full-history, cross-room, Main Stock, or write request during read-only validation
- complete 820 x 1180 Attendance interaction, Save/Delete reachability, Logout, and Console gates passed

Integration decision:

- code approved for fast-forward merge into `develop`
- does not replace `teacher.html`
- does not authorize `main` or production cutover

## Deferred Real-Classroom Incident

The product owner deferred recovery so development could continue.

Quarantined record:

- room `อ.3-3`
- room ID `mqn0z13eyx5b`
- date `2026-07-28`
- test-created Attendance: 22 present, 3 absent
- Room Stock: 1,253
- recorded pre-test Room Stock: 1,275
- known discrepancy: -22

Reconciled record:

- room `อ.3-4`
- room ID `mqn0z13emyrc`
- Attendance: `null`
- Room Stock: 350

The incident is open. Do not use the quarantined room/date for further writes or trusted report evidence. Do not manually rewrite stock, ledger, stockLog, or transaction history.

Recovery, Main Stock review, queue and audit review, and explicit incident closure remain mandatory before `main`, production cutover, or official operational acceptance.

## Next Phase

Sprint 4.3 — Offline Queue Operational UI

Planned branch:

`feature/sprint-4.3-offline-queue-ui`

Planned boundary:

- operational offline banner
- persistent queue count and status
- last successful sync time
- retrying, failed, and deferred states
- manual retry action
- safe item-level error summary
- restart and reconnect tests
- preserve `tc_pending_saves_v1`
- preserve legacy `rec` and `diff` normalization
- preserve original baseline during repeated edits
- View consumes SyncManager and events only
- no direct QueueStorage mutation from the View
- no additional real-classroom write tests

## Deferred Production Decisions

- Physical iPad testing is deferred and is not PASS.
- Report browser-local adapter moves to an operational Admin/report sprint.
- XLSX binary parsing remains in the protected legacy flow.
- Real Firebase concurrency validation must use an isolated environment.
- Real operational queue evidence must not be fabricated.
- Backup and restore rehearsal is required before production.
- The quarantined real-data incident must be closed before production.
- `main` merge and production cutover require explicit approval.

## Development Rules

- Never commit directly to `main`.
- Use `develop` for integration.
- Use `feature/*` branches for Sprint work.
- Do not remove or rewrite protected legacy files before explicit production approval.
- Do not change verified stock calculations while integrating UI.
- Add tests for every runtime change.
- Use isolated data for write validation.
- Run automated, browser, responsive, Network, Console, and clean-tree gates before integration.
