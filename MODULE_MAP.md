# MilkSchoolSystem-V2

# Module Migration Map

Last updated: 2026-07-28

## Protected Legacy Files

- `index.html`
- `teacher.html`

These files remain operational and deployable until explicit cutover approval. Do not delete, rename, or replace them during readiness work.

## Target Architecture

UI

→ Manager

→ Service

→ Repository / Storage Adapter

→ FirebaseService or persistent browser storage

## Module Status

### Authentication — Completed

V2 modules:

- `modules/login/loginManager.js`
- `modules/login/authService.js`
- `modules/services/loginService.js`
- `modules/repositories/loginRepository.js`

Completed boundary:

- Admin and Teacher login
- session compatibility
- cached settings and rooms context
- authenticated Teacher room snapshot

### Firebase Foundation — Completed

V2 modules:

- `modules/services/firebaseService.js`
- `modules/repositories/baseRepository.js`
- `modules/config/configManager.js`

Completed boundary:

- Realtime Database REST access
- query parameters
- identical in-flight GET deduplication
- no persistent stale response cache
- no automatic JSON Content-Type on body-less GET

### Stock — Completed

V2 modules:

- `modules/stock/stockManager.js`
- `modules/services/stockService.js`
- `modules/repositories/stockRepository.js`

### Report — Completed, Adapter Gap Recorded

V2 modules:

- `modules/report/reportManager.js`
- `modules/services/reportService.js`
- `modules/repositories/reportRepository.js`

Remaining gap:

- browser-local pending, retroactive, and vacation adapter

### Room — Completed, Parser and Concurrency Gaps Recorded

V2 modules:

- `modules/room/roomManager.js`
- `modules/services/roomService.js`
- `modules/repositories/roomRepository.js`

Remaining gaps:

- XLSX binary parser
- multi-admin optimistic concurrency for complete room collection writes

### Teacher — Completed, Operational UI Gaps Recorded

V2 modules:

- `modules/teacher/teacherManager.js`
- `modules/services/teacherService.js`
- `modules/repositories/teacherRepository.js`

Completed boundary:

- authenticated-room-only access
- Teacher session room snapshot reuse
- default today's attendance `/data` read
- explicit room-history and deferred-data refresh
- Teacher dashboard and Room Stock-only command preparation
- desktop payload optimization

Remaining gaps:

- forms, media, signatures, print views, queue badge, and offline banner remain in `teacher.html`
- responsive mobile and physical iPad validation remain cutover gates

### Attendance — Completed, ETag Gap Recorded

V2 modules:

- `modules/attendance/attendanceManager.js`
- `modules/services/attendanceService.js`
- `modules/repositories/attendanceRepository.js`

Completed boundary:

- key format `{roomId}_{YYYY-MM-DD}`
- authenticated-room-only read and write
- present/absent validation
- Room Stock difference adjustment on edits
- compatible ledger and stockLog writes
- safe deletion rollback
- no Main Stock change
- Firebase multi-location mutation boundary
- Room Stock-only adjustment replay entry point

Remaining gap:

- legacy ETag compare-and-retry Room Stock protection

### Sync and Offline Queue — Completed, Cutover Gap Recorded

V2 modules:

- `modules/storage/queueStorage.js`
- `modules/services/syncService.js`
- `modules/sync/syncManager.js`

Completed boundary:

- compatible `tc_pending_saves_v1` persistence
- legacy `rec` and `diff` alias normalization
- corrupt-entry filtering
- duplicate queued attendance replacement
- original baseline and queue timestamp preservation
- separate Room Stock adjustment replay
- sequential replay
- bounded exponential backoff
- startup, reconnect, retry, and periodic flush
- successful-entry individual removal
- failed-entry retention
- authenticated-room-only replay
- overlapping flush prevention
- queue and sync lifecycle events
- no Main Stock change

Remaining gaps:

- production compatibility validation for queues created by legacy `teacher.html`
- operational queue badge and offline banner remain in `teacher.html`
- ETag compare-and-retry Room Stock protection remains legacy-only

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

Measured desktop result on the actual 83-room dataset:

- before final optimization: approximately 20.5 MB across 5 requests
- after final optimization: approximately 1.6 KB across 4 requests

Remaining gate:

- responsive mobile and physical iPad validation before production cutover

### Cutover Readiness — Current Sprint 4.0

Targets:

- legacy-to-V2 parity matrix
- mobile and physical iPad validation
- legacy/V2 queue compatibility
- ETag Room Stock concurrency resolution or formal deployment block
- Report local-data adapter decision
- XLSX parser migration decision
- operational Teacher UI integration plan
- backup, rollback, deployment, and cutover checklists
- no legacy removal until every gate passes

### Legacy Removal — Blocked

Legacy removal is not authorized during Sprint 4.0. It becomes eligible only after parity, device, concurrency, data compatibility, rollback, and explicit production approval gates pass.

## Business Rules

Main Stock

→ decreases only on classroom distribution

Classroom distribution

→ increases Room Stock

Teacher, Attendance, and queued retry operations

→ reduce Room Stock only

Attendance edit

→ adjusts Room Stock by the difference between previous and new present totals

Offline attendance edit

→ keeps the latest queued record while preserving the original baseline present count

Rollback

→ restores the stock layer changed by the original operation

Reports

→ read-only

Rebuild

→ transaction history is the source of truth

## Migration Order

- Sprint 3.4.2 — Firebase, Login, Repository Foundation — Completed
- Sprint 3.4.3 — Stock — Completed
- Sprint 3.4.4 — Report — Completed
- Sprint 3.5 — Room — Completed
- Sprint 3.6 — Teacher — Completed
- Sprint 3.7 — Attendance — Completed
- Sprint 3.8 — Offline Queue — Completed
- Sprint 3.9 — Performance — Completed
- Sprint 4.0 — Cutover Readiness — Current
- Legacy Removal — Blocked pending cutover approval

## AI Instructions

Always read:

- `AGENTS.md`
- `CODEX_CONTEXT.md`
- `REPOSITORY_RULES.md`
- `SPRINT_STATUS.md`
- `MODULE_MAP.md`

before editing source code.

Preserve verified business logic and legacy rollback capability during cutover readiness.
