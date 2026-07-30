# MilkSchoolSystem-V2

# Module Migration Map

Last updated: 2026-07-30

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

### Report and Admin Operations — Sprint 5.1 Scalability Gate Active

Modules:

- `modules/report/browserLocalReportAdapter.js`
- `modules/report/adminReportView.js`
- `modules/admin/adminRoomService.js`
- `modules/admin/adminRoomManager.js`
- `modules/admin/adminRoomView.js`

Current boundary:

- read-only classroom, grade, and whole-school Admin reports;
- browser-local Pending, Retroactive, and Vacation report normalization;
- Admin room selector and selected-room operational Dashboard;
- Attendance, Pending, Retroactive, and Vacation history management;
- explicit Admin-to-room delegated context with return to the parent Admin
  session;
- safe note-only operation edits that do not alter quantities;
- deletes through accepted Services with Room Stock, audit, and Queue recovery;
- shallow Attendance key discovery followed by selected-room `/data` reads;
- room-scoped Pending, Retroactive, and Vacation Admin history reads;
- no automatic historical photo or signature hydration;
- protected `index.html` and `teacher.html` unchanged.

Pending gates:

- complete Sprint 5.1 regression;
- product-owner Live Server retry of the room that previously returned HTTP
  413;
- desktop and Responsive validation.

Existing foundation modules:

- `modules/report/reportManager.js`
- `modules/services/reportService.js`
- `modules/repositories/reportRepository.js`

Completed boundary:

- read-only classroom, grade, and whole-school aggregation
- Thai grade normalization
- print and Excel export models
- injected `extraSources` boundary

Resolved Sprint 5.0 gap:

- browser-local Pending, Retroactive, and Vacation report adapter under cutover
  decision D-02 is implemented; local browser acceptance remains pending.

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
- explicit no-Attendance core mode for Admin summary orchestration
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
- shallow room-history key discovery with bounded `/data` hydration
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
- `docs/SPRINT_4_3_PLAN.md`
- `docs/SYNC_UI_IMPLEMENTATION_REPORT.md`
- `docs/SYNC_UI_BROWSER_VALIDATION_REPORT.md`

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
- persistent `attendanceAudit` recovery
- no repeated Room Stock mutation during audit-only retry
- no Main Stock change
- operational online/offline/syncing banner
- persistent queue count, attempts, last-sync time, summary, and next-retry display
- safe item summaries without student/media/audit payload exposure
- manual retry through SyncManager only
- no direct QueueStorage, SyncService, Firebase, Repository, fetch, or browser storage in the View
- complete in-memory restart/reconnect persistence and replay validation
- desktop, Network, Console, Admin/Teacher Logout, and 820 x 1180 gates passed
- all 18 regression checks passed

Integration meaning:

- approved for fast-forward merge into `develop`
- does not replace `teacher.html`
- does not authorize `main` or production cutover

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

Artifacts:

- `docs/SPRINT_4_0_PLAN.md`
- `docs/CUTOVER_PARITY_MATRIX.md`
- `docs/CUTOVER_READINESS_REPORT.md`
- `docs/CUTOVER_DECISIONS.md`
- `docs/TEACHER_UI_INTEGRATION_PLAN.md`
- `docs/PRODUCTION_ROLLBACK_PLAN.md`
- `tests/cutover-concurrency-check.mjs`
- `tests/audit-recovery-check.mjs`
- `tests/cutover-documentation-check.mjs`

Integration meaning:

- merged into `develop`
- production cutover remains blocked
- no `main` merge or legacy removal authorized

### Teacher UI Shell and Read-Only State — Sprint 4.1 Completed

Modules and artifacts:

- `modules/teacher/teacherView.js`
- `tests/teacher-ui-shell-check.mjs`
- `docs/SPRINT_4_1_PLAN.md`
- `docs/TEACHER_UI_SHELL_VALIDATION_REPORT.md`

Completed boundary:

- separate Admin and Teacher shell containers
- Teacher session header
- school, room, teacher, Room Stock, queue count, and online/offline display
- Logout delegation and restored-session rendering
- no direct Firebase, Repository, Local Storage, Session Storage, or stock calculation in the View
- Admin, desktop Network, Offline/Online, responsive, and Console gates passed

Integration meaning:

- merged into `develop`
- does not replace `teacher.html`

### Teacher Daily Attendance CRUD UI — Sprint 4.2 Completed

Modules and artifacts:

- `modules/attendance/attendanceView.js`
- `tests/attendance-ui-check.mjs`
- `tests/attendance-isolated-write-check.mjs`
- `docs/SPRINT_4_2_PLAN.md`
- `docs/ATTENDANCE_UI_IMPLEMENTATION_REPORT.md`
- `docs/ATTENDANCE_ISOLATED_WRITE_GATE.md`
- `docs/ATTENDANCE_REAL_DATA_TEST_INCIDENT.md`

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

Integration meaning:

- merged into `develop`
- does not replace `teacher.html`
- does not authorize `main` or production cutover

Deferred incident:

- room `อ.3-3` / `mqn0z13eyx5b`, date `2026-07-28` remains quarantined with Attendance 22 present / 3 absent and Room Stock discrepancy -22
- recovery is mandatory before production acceptance

### Teacher Operational Parity — Sprints 4.4–4.7 Completed

Completed boundary:

- Pending Milk eligibility, issue, duplicate protection, history, delete, and rollback
- Retroactive Milk calculation, issue, history, delete, and rollback
- Vacation Milk calculation, issue, history, delete, and rollback
- Room Stock-only mutations and Main Stock isolation
- typed Queue recovery
- shared photo and signature workflow
- lazy media persistence and Queue redaction
- authenticated-room-only access
- desktop and responsive automated/browser gates recorded by each Sprint

Integration meaning:

- merged into `develop`
- does not replace `teacher.html`
- does not authorize `main` or production cutover

### Attendance History, Summary and A4 Print — Sprint 4.8 Complete

Modules and artifacts:

- `modules/reports/attendanceHistoryService.js`
- `modules/reports/attendanceHistoryManager.js`
- `modules/reports/attendanceReportBuilder.js`
- `modules/reports/attendancePrintModel.js`
- `modules/reports/attendancePrintView.js`
- `modules/reports/milkOperationPrintView.js`
- `tests/attendance-history-query-check.mjs`
- `tests/attendance-report-builder-check.mjs`
- `tests/attendance-print-model-check.mjs`
- `tests/attendance-report-print-ui-check.mjs`
- `tests/run-sprint-4.8-regression.mjs`
- `docs/ATTENDANCE_REPORT_PRINT_UI_GATE.md`
- `docs/SPRINT_4_8_BROWSER_VALIDATION_REPORT.md`

Completed automated boundary:

- authenticated-room and explicit selected-range history
- no full-school Attendance read
- no automatic historical media hydration
- pure daily, range, and per-student report model
- deterministic A4 portrait print model and View
- metadata-only report and print events
- no report write, stock, Queue, ledger, or stockLog ownership
- all 48 discovered regression checks passed
- local desktop and `820 x 1180` browser evidence passed
- Console remained clean and visible report Network methods were GET-only
- one-sheet A4 preview contained all 16 student rows

### Teacher Student Report, Stock, Settings and Navigation — Sprint 4.9 Active

Modules and artifacts:

- `modules/services/teacherParityService.js`
- `modules/storage/teacherPreferenceStore.js`
- `modules/teacher/teacherParityManager.js`
- `modules/teacher/teacherParityView.js`
- `tests/teacher-parity-service-check.mjs`
- `tests/teacher-preference-store-check.mjs`
- `tests/teacher-parity-manager-check.mjs`
- `tests/teacher-parity-ui-check.mjs`
- `tests/sprint-4.9-plan-check.mjs`
- `tests/run-sprint-4.9-regression.mjs`
- `docs/SPRINT_4_9_PLAN.md`
- `docs/TEACHER_PARITY_CUTOVER_GATE.md`
- `docs/SPRINT_4_9_CUTOVER_REHEARSAL.md`
- `docs/SPRINT_4_9_BROWSER_ACCEPTANCE_CHECKLIST.md`
- `docs/ATTENDANCE_REPORT_EVIDENCE_HISTORY_ACTION_GATE.md`

Implemented boundary:

- selected-student authenticated-room Attendance report
- read-only selected-range timeline, notes, totals, and A4 print
- read-only monthly paper-roster form for the whole authenticated room, with Monday-Friday columns and manual ✓/✕ marking
- explicit Print-time hydration of available daily photos and homeroom Teacher signatures for Room A4 and Student A4
- media-free ordinary History/report loading with metadata-only evidence events
- History Edit/Delete actions with exact-date Daily Attendance routing
- History Delete delegation to the accepted Attendance stock-difference, ETag, audit, and Queue recovery path
- one landscape Room A4 status matrix containing the whole selected range with ✓/✕/—, row totals, and drinking percentages
- following Room A4 evidence pages grouped at up to five dates per page, with one photo row and homeroom Teacher signature per date
- inline Student Attendance photo evidence with no forced per-date evidence sheet
- shared A4 print actions for Pending, Retroactive, and Vacation records
- one-row, five-photo evidence limit plus receiver signatures and Teacher approval line
- actual read-only Room Stock and compatible last-updated display
- allowlisted room-isolated UI preferences only
- complete 12-item Teacher navigation
- fixed blue Teacher header plus dark-blue Teacher navigation on the left below the header at desktop widths
- grouped menu sections, active marker, room/Teacher identity, and identity footer
- authenticated-room homeroom Teacher-name editing through `TeacherManager -> TeacherService -> RoomRepository`
- teacher-leaf-only Firebase update; no room-record, student, stock, Attendance, Queue, ledger, or stockLog replacement
- milk-consumption display wording without changing the compatible Attendance status keys
- reuse of accepted Attendance, report, Queue, Pending, Retroactive, and Vacation panels
- no Firebase schema, operational stock, Queue, ledger, stockLog, or media ownership

Remaining gate:

- local desktop and `820 x 1180` browser evidence
- clean Console and read-only Network evidence

Automated result:

- all 54 discovered regression checks passed

### Legacy Removal — Blocked

Legacy removal becomes eligible only after operational Admin and Teacher parity, data compatibility, backup/restore rehearsal, device risk decision, incident closure, and explicit production approval.

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

Offline Attendance edit

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
- Sprint 3.7 — Attendance Service Foundation — Completed
- Sprint 3.8 — Offline Queue — Completed
- Sprint 3.9 — Performance — Completed
- Sprint 4.0 — Cutover Readiness — Completed
- Sprint 4.1 — Teacher UI Shell and Read-Only State — Completed
- Sprint 4.2 — Teacher Daily Attendance CRUD UI — Completed
- Sprint 4.3 — Offline Queue Operational UI — Completed
- Sprint 4.4 — Pending Milk Operational UI — Completed
- Sprint 4.5 — Retroactive Milk Operational UI — Completed
- Sprint 4.6 — Vacation Milk Operational UI — Completed
- Sprint 4.7 — Shared Media and Signature Workflow — Completed
- Sprint 4.8 — Attendance History, Summary and A4 Print UI — Completed, accepted for `develop`
- Sprint 4.9 — Student report, Room Stock, settings, navigation parity, and cutover rehearsal — Browser PASS
- Sprint 5.0 — Browser-local Report adapter and operational Admin report UI — Active
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

Preserve verified business logic, storage compatibility, incident quarantine, and legacy rollback capability throughout UI integration.
