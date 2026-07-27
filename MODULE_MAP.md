# MilkSchoolSystem-V2

# Module Migration Map

Last updated: 2026-07-27

## Protected Legacy Files

- `index.html`
- `teacher.html`

These files remain operational during Sprint 3.x extraction and are not modified unless explicitly approved.

## Target Architecture

UI

→ Manager

→ Service

→ Repository

→ FirebaseService

→ Firebase Realtime Database

## Module Status

### Authentication — Completed

Legacy source:

- `index.html`

V2 modules:

- `modules/login/loginManager.js`
- `modules/login/authService.js`
- `modules/services/loginService.js`
- `modules/repositories/loginRepository.js`

### Firebase Foundation — Completed

Legacy sources:

- `index.html`
- `teacher.html`

V2 modules:

- `modules/services/firebaseService.js`
- `modules/repositories/baseRepository.js`
- `modules/config/configManager.js`

### Stock — Completed

Legacy sources:

- `index.html`
- teacher stock workflows in `teacher.html`

V2 modules:

- `modules/stock/stockManager.js`
- `modules/services/stockService.js`
- `modules/repositories/stockRepository.js`

### Report — Completed, Adapter Gap Recorded

Legacy source:

- `index.html`

V2 modules:

- `modules/report/reportManager.js`
- `modules/services/reportService.js`
- `modules/repositories/reportRepository.js`

Remaining gap:

- browser-local pending, retroactive, and vacation adapter

### Room — Completed, Parser and Concurrency Gaps Recorded

Legacy source:

- `index.html`

V2 modules:

- `modules/room/roomManager.js`
- `modules/services/roomService.js`
- `modules/repositories/roomRepository.js`

Remaining gaps:

- XLSX binary parser
- multi-admin optimistic concurrency for complete room collection writes

### Teacher — Completed, Operational UI Gaps Recorded

Legacy source:

- `teacher.html`

V2 modules:

- `modules/teacher/teacherManager.js`
- `modules/services/teacherService.js`
- `modules/repositories/teacherRepository.js`

Completed boundary:

- authenticated-room-only reads
- room-scoped attendance query
- Teacher dashboard and Room Stock-only command preparation

Remaining gaps:

- forms, media, signatures, and print views
- offline queue moves to Sprint 3.8

### Attendance — Completed, ETag and Offline Gaps Recorded

Legacy source:

- `teacher.html`

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

Remaining gaps:

- legacy ETag compare-and-retry Room Stock protection
- persistent offline queue and retry orchestration
- attendance form, media, signatures, and print UI remain in `teacher.html`

### Sync and Offline Queue — Current Sprint 3.8

Legacy source:

- `teacher.html`

Target modules:

- `modules/storage/queueStorage.js`
- `modules/services/syncService.js`
- `modules/sync/syncManager.js`

Required boundary:

- persistent queue survives refresh and restart
- corrupt entries are filtered individually
- duplicate attendance keys replace the queued record with the latest data
- original `baselinePresent` remains stable across repeated offline edits
- attendance and Room Stock adjustment entries remain separate
- sequential replay avoids overlapping Room Stock mutations
- bounded exponential backoff
- reconnect and periodic flush
- successful entries removed individually
- failed entries retained for retry
- authenticated-room-only replay
- no Main Stock change

### Performance — Planned Sprint 3.9

Targets:

- scoped reads
- payload reduction
- query and caching audit
- browser and mobile performance validation

### Legacy Removal — Planned Sprint 4

Only after all modular workflows replace the operational legacy behavior and migration gates pass.

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
- Sprint 3.8 — Offline Queue — Current
- Sprint 3.9 — Performance — Planned
- Sprint 4 — Legacy Removal — Planned

## AI Instructions

Always read:

- `AGENTS.md`
- `CODEX_CONTEXT.md`
- `REPOSITORY_RULES.md`
- `SPRINT_STATUS.md`
- `MODULE_MAP.md`

before editing source code.

Preserve verified business logic during migration.
