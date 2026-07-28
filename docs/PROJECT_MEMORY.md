# MilkSchoolSystem V2

## Project Memory

Version: 2.6

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

Views own DOM rendering and interaction and must not access Firebase or calculate stock rules directly.

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

ETag conflicts must read the newest Room Stock and recalculate before retry.

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

### Sprint 3.7 — Attendance

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

Runtime and recovery work:

- Firebase ETag reads through `X-Firebase-ETag: true`
- conditional Room Stock writes through `If-Match`
- HTTP 412 retry and newest-value recalculation
- partial Attendance-save recovery
- persistent Room Stock-only retry
- persistent `attendanceAudit` recovery
- audit-only retry without repeated Room Stock mutation
- no Main Stock mutation from Attendance or Sync

Evidence:

- all runtime, compatibility, concurrency, audit, and documentation tests passed
- desktop Admin Login passed
- desktop Teacher Login passed
- direct Logout passed
- Console clean in recorded Teacher and post-Logout flows
- 820 x 1180 Teacher Login and Logout passed
- feature branch synchronized with origin
- working tree clean

Documentation and decisions:

- `docs/SPRINT_4_0_PLAN.md`
- `docs/CUTOVER_PARITY_MATRIX.md`
- `docs/CUTOVER_READINESS_REPORT.md`
- `docs/CUTOVER_DECISIONS.md`
- `docs/TEACHER_UI_INTEGRATION_PLAN.md`
- `docs/PRODUCTION_ROLLBACK_PLAN.md`

Integration decision:

- approved for fast-forward merge into `develop`
- not approved for `main` or production traffic
- protected legacy files remain operational

Production remains blocked by operational Admin/Teacher UI parity, Report local adapter, V2 XLSX parser, isolated real Firebase concurrency evidence, real legacy queue sample, backup/restore rehearsal, physical-device evidence or risk acceptance, and explicit production approval.

## Current Phase

Sprint 4.1 — Teacher UI Shell and Read-Only State

Planned branch:

`feature/sprint-4.1-teacher-ui-shell`

Initial boundary:

- Teacher session header
- school, room, and teacher identity
- current Room Stock display
- connection state
- pending queue count
- Logout
- event-driven rendering through Managers
- desktop and 820 x 1180 validation

Out of scope:

- Attendance write UI
- pending, retroactive, or vacation write UI
- photos and signatures
- printing
- replacement or removal of `teacher.html`

## Deferred Production Decisions

- Physical iPad testing is deferred and is not PASS.
- Report browser-local adapter moves to an operational Admin/report sprint.
- XLSX binary parsing remains in the protected legacy flow.
- Real Firebase concurrency validation must use an isolated environment.
- Real operational queue evidence must not be fabricated.
- Backup and restore rehearsal is required before production.
- `main` merge and production cutover require explicit approval.

## Development Rules

- Never commit directly to `main`.
- Use `develop` for integration.
- Use `feature/*` branches for Sprint work.
- Do not remove or rewrite protected legacy files before explicit production approval.
- Do not change verified stock calculations while integrating UI.
- Add tests for every runtime change.
- Run automated, browser, responsive, and clean-tree gates before integration.
