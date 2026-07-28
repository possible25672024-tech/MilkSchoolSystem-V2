# MilkSchoolSystem-V2

# Module Migration Map

Last updated: 2026-07-28

## Protected Legacy Files

- `index.html`
- `teacher.html`

These files remain operational and deployable until explicit production-cutover approval. Do not delete, rename, replace, or silently redirect them during modular UI integration.

## Target Architecture

UI

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
- desktop and 820 x 1180 shell login/logout evidence

### Firebase Foundation — Completed

Modules:

- `modules/services/firebaseService.js`
- `modules/repositories/baseRepository.js`
- `modules/config/configManager.js`

Completed boundary:

- Realtime Database REST access
- query parameters
- identical in-flight GET deduplication
- no persistent stale response cache
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

- read-only report model
- classroom, grade, and whole-school aggregation
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
- default today's attendance `/data` read
- explicit room-history and deferred-data refresh
- Teacher dashboard and Room Stock-only command preparation
- measured desktop payload optimization

Operational UI status:

- dedicated integration begins in Sprint 4.1
- `teacher.html` remains operational and protected

### Attendance — Completed with ETag Protection

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

### Sync and Offline Queue — Completed with Recovery Paths

Modules:

- `modules/storage/queueStorage.js`
- `modules/services/syncService.js`
- `modules/sync/syncManager.js`

Completed boundary:

- compatible `tc_pending_saves_v1` persistence
- legacy `rec` and `diff` alias normalization
- corrupt-entry filtering
- latest queued attendance with original baseline preservation
- sequential replay
- bounded backoff
- startup, reconnect, retry, and periodic flush
- successful-entry removal and failed-entry retention
- authenticated-room-only replay
- overlapping-flush prevention
- Room Stock-only retry conversion
- persistent `attendanceAudit` recovery
- no repeated Room Stock mutation during audit-only retry
- no Main Stock change

Deferred production gaps:

- real sanitized operational queue sample under D-07
- queue badge and offline banner operational UI under D-04

### Performance — Completed

Completed boundary:

- in-flight GET deduplication
- GET preflight removal
- Login context reuse
- session-backed Teacher room data
- default four-request Teacher core refresh
- today's attendance `/data` child only
- deferred history loading
- QueueStorage serialization reduction
- deterministic performance tests
- actual desktop Network measurement

Measured result on the recorded 83-room dataset:

- before final optimization: approximately 20.5 MB across 5 requests
- after final optimization: approximately 1.6 KB across 4 requests

### Cutover Readiness — Sprint 4.0 Completed

Completed artifacts:

- `docs/SPRINT_4_0_PLAN.md`
- `docs/CUTOVER_PARITY_MATRIX.md`
- `docs/CUTOVER_READINESS_REPORT.md`
- `docs/CUTOVER_DECISIONS.md`
- `docs/TEACHER_UI_INTEGRATION_PLAN.md`
- `docs/PRODUCTION_ROLLBACK_PLAN.md`
- `tests/cutover-concurrency-check.mjs`
- `tests/audit-recovery-check.mjs`
- `tests/cutover-documentation-check.mjs`

Completed gates:

- all automated tests
- desktop Admin/Teacher Login and Logout
- clean recorded Console
- 820 x 1180 Teacher Login and Logout
- explicit production decisions
- backup and rollback plan
- clean working tree

Integration meaning:

- approved for fast-forward merge into `develop`
- production cutover remains blocked
- no `main` merge or legacy removal authorized

### Teacher UI Shell and Read-Only State — Current Sprint 4.1

Target branch:

`feature/sprint-4.1-teacher-ui-shell`

Target boundary:

- Teacher session header
- school, room, and teacher identity
- current Room Stock display
- connection state
- pending queue count
- Logout
- Manager/event-driven rendering
- no direct Firebase access from the view
- desktop and 820 x 1180 validation

Out of scope:

- Attendance write UI
- pending, retroactive, or vacation write UI
- photos and signatures
- printing
- replacing or removing `teacher.html`

### Legacy Removal — Blocked

Legacy removal becomes eligible only after operational Admin and Teacher parity, data compatibility, backup/restore rehearsal, device risk decision, and explicit production approval.

## Business Rules

Main Stock

→ decreases only on classroom distribution

Classroom distribution

→ increases Room Stock

Teacher, Attendance, Pending, Retroactive, Vacation, and Sync operations

→ change Room Stock only

Attendance edit

→ adjusts Room Stock by the difference between previous and new present totals

Offline attendance edit

→ keeps the latest queued record while preserving the original baseline present count

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
- Sprint 3.7 — Attendance — Completed
- Sprint 3.8 — Offline Queue — Completed
- Sprint 3.9 — Performance — Completed
- Sprint 4.0 — Cutover Readiness — Completed
- Sprint 4.1 — Teacher UI Shell and Read-Only State — Current
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

Preserve verified business logic, storage compatibility, and legacy rollback capability throughout UI integration.
