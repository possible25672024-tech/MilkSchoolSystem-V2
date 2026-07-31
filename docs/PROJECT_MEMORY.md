# MilkSchoolSystem V2

## Project Memory

Version: 3.4

Last updated: 2026-07-31

## Current Sprint State

Sprint 5.7.1 Report Ordering Correction is automated PASS at 74/74
with Thai grade/room natural ordering and oldest-to-newest Main Stock deduction
chronology. Browser acceptance remains pending.

Sprint 5.7 Operational Summaries and Period Reports is automated PASS at 73/73
on `feature/sprint-5.7-operational-reports`.

- period reports support day, week, half-month, month, and explicit semester;
- management totals include receipts, distributions, Attendance, Pending,
  Retroactive, and Vacation operations;
- report reads use shallow key discovery, exclude out-of-range detail, and do
  not hydrate media or signatures;
- A4 and UTF-8 BOM CSV outputs are read-only;
- browser validation remains pending.

- Admin Attendance history uses normalized actual room rosters.
- generated `student_*` fallback rows are not merged with real student IDs.
- the system Dashboard is read-only and shows actual Main Stock and Room Stock.
- per-room differences are surfaced but never repaired automatically.
- the Dashboard now exposes the complete stock path and a read-only
  opening-balance candidate.
- the 83-room real-data audit found 26 history-complete rooms, 54 opening
  balance/legacy-history candidates, and three negative rooms.
- Admin receipt increases Main Stock only and records receipt plus ledger.
- Admin distribution calculates actual students × days and transfers exactly
  that quantity from Main Stock to the selected Room Stock.
- an ETag/If-Match lock plus stable operation id prevents the V2 Admin workflow
  from deducting Main Stock twice.
- distribution history discovers shallow keys and excludes media fields.
- Sprint 5.6 controlled-write browser validation remains pending.

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
- `stockOperations/distributionLock`
- `stockOperations/distributionCommands/{operationId}`
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

This Sprint 3.5 gap was resolved at the modular code level in Sprint 5.5 with a
local XLSX/XLS/CSV parser and ETag-bound import confirmation. Browser and real
isolated two-Admin evidence remain pending.

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

- modular `AttendanceView`
- date-scoped authenticated-room Attendance form
- present/absent controls, notes, and totals
- create/edit/delete through AttendanceManager
- Room Stock result, ETag conflict, queue, and audit feedback
- compatible media-field preservation
- complete isolated create/edit-up/edit-down/delete validation
- Main Stock remained unchanged
- all 16 regression checks passed
- desktop and 820 x 1180 browser gates passed
- `index.html` and `teacher.html` unchanged

Merged into `develop` at `cde191b`.

### Sprint 4.3 — Offline Queue Operational UI

Runtime:

- added `modules/sync/syncView.js`
- online, offline, syncing, pending, failed, deferred, and synchronized states
- pending count, maximum attempts, last successful sync, summary, and next retry
- safe item summaries without student/media/audit payload exposure
- manual retry through `SyncManager.flushNow("manual-ui")`
- retry disabled while offline, flushing, or empty
- Teacher-only Sync lifecycle start/stop
- safe queue summaries through SyncManager
- no direct QueueStorage, SyncService, Firebase, Repository, fetch, Local Storage, or Session Storage in the View
- `index.html` and `teacher.html` unchanged

Automated evidence:

- `tests/sync-ui-check.mjs`
- `tests/sync-restart-reconnect-check.mjs`
- QueueStorage recreation persistence passed
- offline startup performed no replay
- reconnect replayed entries sequentially
- successful items disappeared individually
- failed/deferred entries remained persistent
- attempts and next-retry times survived restart
- Attendance partial save converted to Room Stock-only work
- Main Stock remained 999
- all 18 regression checks passed on Node.js 24.18.0
- branch synchronized with origin
- working tree clean

Browser evidence:

- empty queue confirmed before Teacher Login
- Queue panel rendered with zero pending entries
- Offline and reconnect transitions passed
- reconnect settled back to synchronized
- Network showed read-only GET/fetch traffic
- no visible PUT, PATCH, or DELETE
- Console remained clean
- Teacher Logout hid Queue UI
- Admin Login/Logout remained unchanged
- 820 x 1180 responsive layout passed

Integration decision:

- approved for fast-forward merge into `develop`
- does not replace `teacher.html`
- does not authorize `main` or production cutover

### Sprints 4.4–4.7 — Teacher Operational Parity

- Pending Milk operational UI
- Retroactive Milk operational UI
- Vacation Milk operational UI
- Room Stock-only issue/delete/rollback
- typed Queue recovery
- shared photo and signature workflow
- lazy evidence persistence and duplicate prevention
- responsive modular Teacher integration
- protected `index.html` and `teacher.html` unchanged

Merged into `develop`.

### Sprint 4.8 — Attendance History, Summary and A4 Print UI

Merged foundation:

- authenticated-room and selected-range Attendance history
- evidence-free historical child reads
- pure daily, range, and per-student summary builder
- deterministic A4 portrait print model

Current follow-up:

- branch `feature/sprint-4.8.1-report-print-ui-integration`
- Teacher history, summary, student detail, and A4 print UI connected
- metadata-only report/print events
- no report Firebase, Queue, stock, ledger, stockLog, or media-payload ownership
- isolated UI check passed
- all 48 discovered regression checks passed
- local desktop and `820 x 1180` browser evidence passed
- visible report Network methods were GET-only and Console remained clean
- A4 preview fit all 16 student rows on one portrait sheet

Merged into `develop` at:

```text
5436f255f57a1f925d02b28f906da7f85cb9e3d7
```

### Sprint 4.9 — Student Report, Room Stock, Settings and Navigation Parity

Active branch:

`feature/sprint-4.9-teacher-parity-cutover`

Implemented:

- authenticated-room one-student selected-range report;
- per-date present/absent/unchecked state and notes;
- deterministic A4 student-report pages;
- whole-room monthly paper roster with Monday-Friday blank cells for manual ✓/✕ marking and a Teacher signature line;
- explicit Print-time photos and homeroom Teacher signatures in Room A4 and Student A4;
- one landscape Room A4 status matrix containing all selected date columns;
- following Room A4 evidence pages grouped at up to five dates per page, each with photos and homeroom Teacher signature;
- inline Student A4 evidence after the report timeline with no forced per-date evidence page;
- a one-row, five-photo maximum for every report evidence group;
- shared A4 print reports for Pending, Retroactive, and Vacation history records;
- operational reports include student/quantity detail, photos, receiver signatures, and a Teacher approval line;
- media-free ordinary History/report loading;
- per-date History Edit/Delete actions;
- exact-date routing from History Edit to Daily Attendance;
- History Delete delegation to the existing Attendance stock/ETag/audit/Queue path;
- actual read-only Room Stock and compatible last-updated state;
- safe room-isolated device preferences under `milkapp_teacher_preferences_v1`;
- complete 12-item Teacher navigation;
- metadata-only events;
- no direct Firebase, Queue, stock, ledger, stockLog, or historical media ownership;
- isolated Service, Store, Manager, and UI gates passed;
- all 54 discovered regression checks passed.

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

The incident is open. Do not use the quarantined room/date for further writes or trusted report evidence. Do not manually rewrite stock, ledger, stockLog, queue, or transaction history.

Recovery, Main Stock review, queue and audit review, and explicit incident closure remain mandatory before `main`, production cutover, or official operational acceptance.

## Next Phase

Sprint 4.9 passed product-owner Live Server browser acceptance on 2026-07-30.

Sprint 5.0 operational Admin/report integration is active:

- Browser-local Report adapter automated gate passed;
- Pending, Retroactive, and Vacation sources are normalized and deduplicated;
- Admin room, grade, and whole-school report UI is implemented;
- A4 landscape print and UTF-8 CSV export are implemented;
- all 57 regression checks pass;
- local Live Server browser evidence remains pending.

## Deferred Production Decisions

- Physical iPad testing is deferred and is not PASS.
- Report browser-local adapter moves to an operational Admin/report sprint.
- Sprint 5.5 vendors the XLSX browser reader locally and moves `.xlsx`, `.xls`,
  and `.csv` roster parsing into the modular Admin V2 path.
- Student import requires a complete preview and binds confirmation to the
  `milkApp/rooms` ETag; a 412 conflict writes nothing and requires a fresh
  preview.
- Repeated imports preserve `roomId` and Room Stock, reject duplicate students
  within and across rooms, and never persist generated `student_*` fallback
  rows.
- Admin V2 now includes room management plus real-student room/gender/roster
  reporting with A4 and UTF-8 CSV.
- Sprint 5.5 passes all 67 automated regression checks; Live Server and
  isolated real two-Admin ETag evidence remain pending.
- Real Firebase concurrency validation must use an isolated environment.
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
