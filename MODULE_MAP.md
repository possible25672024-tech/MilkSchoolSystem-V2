# MilkSchoolSystem-V2

# Module Migration Map

Last updated: 2026-07-29

## Protected Legacy Files

- `index.html`
- `teacher.html`

These files remain operational and deployable until explicit production-cutover approval. Do not delete, rename, replace, or silently redirect them during modular UI integration.

## Target Architecture

UI / View

→ Manager

→ Service

→ Repository / Storage Adapter

→ FirebaseService or persistent browser storage

## Module Status

### Authentication — Completed

Modules:

- `modules/login/loginManager.js`
- `modules/login/authService.js`
- `modules/services/loginService.js`
- `modules/repositories/loginRepository.js`

Completed boundary:

- Admin and Teacher login
- compatible session storage
- cached settings and rooms context
- authenticated Teacher room snapshot
- Admin and Teacher role routing

### Firebase Foundation — Completed

Modules:

- `modules/services/firebaseService.js`
- `modules/repositories/baseRepository.js`
- `modules/config/configManager.js`

Completed boundary:

- Realtime Database REST access
- query parameters
- identical in-flight GET deduplication
- no automatic JSON Content-Type on body-less GET
- ETag reads through `X-Firebase-ETag: true`
- conditional writes through `If-Match`
- HTTP 412 conflict exposure

### Stock — Completed

Modules:

- `modules/stock/stockManager.js`
- `modules/services/stockService.js`
- `modules/repositories/stockRepository.js`

Completed boundary:

- Main Stock receive and classroom distribution
- Room Stock consumption and rollback
- rebuild and validation
- compatible ledger calculations
- Main Stock and Room Stock separation

### Report — Foundation Completed, Operational Adapter Deferred

Modules:

- `modules/report/reportManager.js`
- `modules/services/reportService.js`
- `modules/repositories/reportRepository.js`

Completed boundary:

- read-only classroom, grade, and whole-school aggregation
- Thai grade normalization
- print and Excel export models
- injected `extraSources` boundary

Deferred production gap:

- browser-local pending, retroactive, and vacation adapter under cutover decision D-02

### Room — Foundation Completed, Operational Import/UI Deferred

Modules:

- `modules/room/roomManager.js`
- `modules/services/roomService.js`
- `modules/repositories/roomRepository.js`

Completed boundary:

- Room ID stability
- Room Stock preservation
- duplicate validation
- parsed-sheet import preparation
- deletion safety

Deferred production gaps:

- XLSX binary parser remains in protected legacy Admin flow under D-03
- complete-room multi-admin optimistic concurrency remains unresolved
- operational Admin room UI remains in `index.html`

### Teacher Service Foundation — Completed

Modules:

- `modules/teacher/teacherManager.js`
- `modules/services/teacherService.js`
- `modules/repositories/teacherRepository.js`

Completed boundary:

- authenticated-room-only access
- Teacher session room snapshot reuse
- default today's Attendance `/data` read
- explicit room-history and deferred-data refresh
- Teacher dashboard and Room Stock-only command preparation
- measured desktop payload optimization

### Attendance Service Foundation — Completed with ETag Protection

Modules:

- `modules/attendance/attendanceManager.js`
- `modules/services/attendanceService.js`
- `modules/repositories/attendanceRepository.js`

Completed boundary:

- key format `{roomId}_{YYYY-MM-DD}`
- authenticated-room-only read and write
- present/absent validation
- Room Stock difference adjustment on edits
- deletion rollback
- compatible ledger and stockLog writes
- no Main Stock change
- versioned Room Stock reads
- conditional Room Stock writes
- latest-value recalculation after conflicts
- bounded ETag retry
- partial-save conversion to Room Stock-only retry

Production-confidence gap:

- real multi-writer validation must run in an isolated Firebase environment under D-06

### Sync and Offline Queue — Service and Operational UI Completed

Modules and artifacts:

- `modules/storage/queueStorage.js`
- `modules/services/syncService.js`
- `modules/sync/syncManager.js`
- `modules/sync/syncView.js`
- `tests/sync-module-check.mjs`
- `tests/sync-ui-check.mjs`
- `tests/sync-restart-reconnect-check.mjs`

Completed boundary:

- compatible `tc_pending_saves_v1` persistence
- legacy `rec` and `diff` normalization
- corrupt-entry filtering
- latest queued Attendance with original baseline preservation
- sequential replay and bounded backoff
- startup, reconnect, retry, and periodic flush
- successful-entry removal and failed/deferred retention
- authenticated-room-only replay
- overlapping-flush prevention
- Room Stock-only retry conversion
- persistent audit-only recovery
- no repeated Room Stock mutation during audit-only retry
- no Main Stock change
- operational Queue UI and safe item summaries
- desktop, Network, Console, Admin/Teacher Logout, and 820 x 1180 gates passed
- all 18 Sprint 4.3 regression checks passed

### Performance — Completed

Completed boundary:

- in-flight GET deduplication
- GET preflight removal
- Login context reuse
- session-backed Teacher room data
- default four-request Teacher core refresh
- today's Attendance `/data` child only
- deferred history loading
- QueueStorage serialization reduction
- deterministic performance tests
- actual desktop Network measurement

Measured result on the recorded 83-room dataset:

- before final optimization: approximately 20.5 MB across 5 requests
- after final optimization: approximately 1.6 KB across 4 requests

### Cutover Readiness — Sprint 4.0 Completed

Completed boundary:

- parity matrix and decisions
- ETag concurrency protection
- partial-save and audit-only recovery
- production rollback plan
- deterministic concurrency and audit tests

Integration meaning:

- merged into `develop`
- production cutover remains blocked
- no `main` merge or legacy removal authorized

### Teacher UI Shell and Read-Only State — Sprint 4.1 Completed

Modules:

- `modules/teacher/teacherView.js`
- `tests/teacher-ui-shell-check.mjs`

Completed boundary:

- separate Admin and Teacher shell containers
- Teacher session header
- school, room, teacher, Room Stock, queue count, and online/offline display
- Logout delegation and restored-session rendering
- no direct Firebase, Repository, Local Storage, Session Storage, or stock calculation in the View
- Admin, desktop Network, Offline/Online, responsive, and Console gates passed

### Teacher Daily Attendance CRUD UI — Sprint 4.2 Completed

Modules:

- `modules/attendance/attendanceView.js`
- `tests/attendance-ui-check.mjs`
- `tests/attendance-isolated-write-check.mjs`

Completed boundary:

- date-scoped daily Attendance form
- authenticated-room student list
- present/absent controls and notes
- totals and responsive layout
- Manager-only create/edit/delete delegation
- Room Stock result, conflict, partial-save, queue, and audit feedback
- compatible media-field preservation
- complete isolated create/edit/delete validation
- Main Stock unchanged
- desktop and 820 x 1180 validation passed

Deferred incident:

- room `อ.3-3` / `mqn0z13eyx5b`, date `2026-07-28` remains quarantined with Attendance 22 present / 3 absent and Room Stock discrepancy -22
- recovery is mandatory before production acceptance

### Pending Milk Operational UI — Sprint 4.4 Completed

Modules and artifacts:

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

Completed boundary:

- exact Monday–Friday Attendance reads
- authenticated-room `absentMilk` query
- absent-only eligibility
- already-issued exclusion
- Service-level duplicate recheck
- compatible Firebase push records
- Room Stock-only issue and rollback
- `PENDING` / `ROLLBACK` ledger routing
- `OUT` / `IN` stockLog routing
- typed Queue recovery
- audit-only retry without repeated stock mutation
- Main Stock unchanged
- Firebase `.indexOn: ["roomId"]` at `/milkApp/absentMilk`
- all four Sprint-specific tests and all 22 regression checks passed
- desktop read-only, indexed Network, clean Console, and completed-data 820 x 1180 gates passed

Integration meaning:

- approved for fast-forward merge into `develop`
- does not replace `teacher.html`
- does not authorize `main` or production cutover

### Retroactive Milk Operational UI — Sprint 4.5 Active

Planned branch:

`feature/sprint-4.5-retroactive-milk-ui`

Verified legacy boundary:

- Firebase path `milkApp/retroMilk`
- Firebase push-ID records
- academic year and semester
- issue date
- retroactive start/end dates
- Monday–Friday calculation only
- quantity equals weekday count multiplied by authenticated-room student count
- debt boxes equal total boxes at issue time
- status starts as `debt`
- note, per-student signatures, photos, and saved time preserved
- create record before Room Stock deduction
- ledger type `RETRO` on issue
- delete record before Room Stock restoration
- ledger type `ROLLBACK` on delete
- duplicate delete/rollback execution guard
- Main Stock unchanged

Target modules:

- `modules/repositories/retroactiveMilkRepository.js`
- `modules/services/retroactiveMilkService.js`
- `modules/retroactive/retroactiveMilkManager.js`
- `modules/retroactive/retroactiveMilkView.js`

Target validation:

- authenticated-room history only
- date-range and weekday validation
- stable student-count snapshot
- exact quantity calculation
- compatible debt record fields
- Room Stock-only issue and rollback
- typed `RETRO` / `ROLLBACK` Queue recovery
- audit-only retry without repeated stock mutation
- duplicate delete guard
- in-memory isolated issue/delete/partial-save tests
- desktop read-only, Network, Console, and 820 x 1180 gates
- no real-classroom writes

### Vacation Milk Operational UI — Later

Vacation Milk remains deferred until Retroactive Milk completes.

### Legacy Removal — Blocked

Legacy removal becomes eligible only after operational Admin and Teacher parity, data compatibility, backup/restore rehearsal, device risk decision, incident closure, Firebase security hardening, and explicit production approval.

## Business Rules

Main Stock

→ decreases only on classroom distribution

Classroom distribution

→ increases Room Stock

Teacher, Attendance, Pending, Retroactive, Vacation, and Sync operations

→ change Room Stock only

Attendance edit

→ adjusts Room Stock by the difference between previous and new present totals

Attendance deletion

→ restores the previously consumed present total

Retroactive Milk issue

→ creates compatible debt record, then deducts Room Stock once

Retroactive Milk deletion

→ deletes the record, then restores Room Stock once

ETag conflict

→ reads the latest Room Stock and recalculates before retry

Audit-only retry

→ never repeats a successful Room Stock mutation

Reports

→ read-only

Rebuild

→ transaction history is the source of truth

## Migration Order

- Sprint 3.4.2 — Firebase, Login, Repository Foundation — Completed
- Sprint 3.4.3 — Stock — Completed
- Sprint 3.4.4 — Report — Completed
- Sprint 3.5 — Room — Completed
- Sprint 3.6 — Teacher Service Foundation — Completed
- Sprint 3.7 — Attendance Service Foundation — Completed
- Sprint 3.8 — Offline Queue — Completed
- Sprint 3.9 — Performance — Completed
- Sprint 4.0 — Cutover Readiness — Completed
- Sprint 4.1 — Teacher UI Shell and Read-Only State — Completed
- Sprint 4.2 — Teacher Daily Attendance CRUD UI — Completed
- Sprint 4.3 — Offline Queue Operational UI — Completed
- Sprint 4.4 — Pending Milk Operational UI — Completed
- Sprint 4.5 — Retroactive Milk Operational UI — Active
- Vacation Milk UI — Later
- Legacy Removal — Blocked pending production-cutover approval

## AI Instructions

Always read:

- `AGENTS.md`
- `CODEX_CONTEXT.md`
- `REPOSITORY_RULES.md`
- `SPRINT_STATUS.md`
- `MODULE_MAP.md`
- the active Sprint plan

before editing source code.

Preserve verified business logic, storage compatibility, incident quarantine, Firebase security blockers, and legacy rollback capability throughout UI integration.
