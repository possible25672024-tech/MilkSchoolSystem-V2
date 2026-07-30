# MilkSchoolSystem-V2
# AI Development Context

Version: 3.3
Last Updated: 2026-07-30

---

Repository

possible25672024-tech/MilkSchoolSystem-V2

Default integration branch

develop

Backend

Firebase Realtime Database

---

Project Status

Protected operational legacy system

↓

Modular V2 Firebase, repository, stock, report, room, Teacher, Attendance, queue, recovery, performance, and cutover-readiness foundations completed

↓

Teacher shell and operational Attendance, Queue, Pending, Retroactive, Vacation, and Media/Signature UIs completed and approved for `develop`

↓

Sprint 4.8 merged into `develop`; Sprint 4.9 Teacher parity passed; Sprint 5.0 Admin room operations passed automated gates; Sprint 5.1 large Attendance payload resilience is active

Production cutover remains blocked.

---

Completed Sprints

### Sprint 3.4.2 — Recovery Foundation

- runtime Firebase configuration
- Firebase REST service
- BaseRepository
- Admin and Teacher login
- compatible sessions
- V2 bootstrap and dependency order

### Sprint 3.4.3 — Stock

- Main Stock and Room Stock separation
- receive, distribute, rollback, rebuild, validation, and ledger rules

### Sprint 3.4.4 — Report

- read-only classroom, grade, and school aggregation
- Thai grade normalization
- print and Excel models

Production gap: browser-local adapter remains deferred.

### Sprint 3.5 — Room

- immutable Room IDs
- Room Stock preservation
- duplicate validation
- parsed-sheet import boundary
- deletion safety

Production gaps: XLSX binary parsing remains legacy; complete-room multi-admin concurrency remains unresolved.

### Sprint 3.6 — Teacher Service Foundation

- authenticated-room-only boundary
- Teacher session and cross-room protection
- dashboard and Room Stock-only command preparation

### Sprint 3.7 — Attendance Service Foundation

- compatible key `{roomId}_{YYYY-MM-DD}`
- create, edit-by-difference, delete rollback
- ledger and stockLog rules
- Main Stock isolation

### Sprint 3.8 — Offline Queue and Sync

- compatible `tc_pending_saves_v1`
- legacy `rec` and `diff` normalization
- baseline preservation
- sequential retry and bounded backoff
- Room Stock-only replay
- audit-only recovery

### Sprint 3.9 — Performance

- identical in-flight GET deduplication
- GET preflight removal
- Login context reuse
- Teacher `roomSnapshot`
- default four-request Teacher core refresh
- today's Attendance `/data` child only
- deferred history loading

Recorded desktop result on the 83-room dataset:

- before: approximately 20.5 MB across 5 requests
- after: approximately 1.6 KB across 4 requests

### Sprint 4.0 — Cutover Readiness and Compatibility

- Firebase ETag reads
- `If-Match` conditional Room Stock writes
- HTTP 412 retry and latest-value recalculation
- partial Attendance-save recovery
- persistent Room Stock-only retry
- persistent audit-only recovery
- deterministic concurrency and audit tests
- parity, decisions, Teacher UI integration, backup, and rollback documentation

Integration decision:

- merged into `develop`
- not approved for `main` or production cutover

### Sprint 4.1 — Teacher UI Shell and Read-Only State

- modular `TeacherView`
- separate Admin and Teacher shell containers
- school, room, teacher, Room Stock, queue count, and connection state
- Logout and restored-session rendering
- no direct Firebase, Repository, storage, or stock calculations in the View
- Admin, Teacher, Network, desktop, responsive, Offline/Online, Console, and 14-test gates passed

Integration decision:

- merged into `develop`
- does not replace `teacher.html`

### Sprint 4.2 — Teacher Daily Attendance CRUD UI

- modular `AttendanceView`
- exact one-date Attendance loading
- authenticated-room student list
- present/absent and notes controls
- create/edit/delete through AttendanceManager
- Room Stock result, conflict, queue, and audit feedback
- complete isolated create/edit/delete validation
- Main Stock unchanged
- all 16 regression checks passed
- desktop and 820 x 1180 browser gates passed

Integration decision:

- merged into `develop`
- not approved for `main` or production cutover

### Sprint 4.3 — Offline Queue Operational UI

- modular `SyncView`
- online, offline, syncing, pending, failed, deferred, and synchronized states
- persistent queue count, attempts, last-sync time, summary, and next retry
- safe item summaries without student/media/audit payload exposure
- manual retry through `SyncManager.flushNow("manual-ui")`
- retry disabled while offline, flushing, or empty
- Teacher-only Sync lifecycle start/stop
- safe queue summaries exposed through SyncManager
- no direct QueueStorage, SyncService, Firebase, Repository, fetch, or browser-storage access from the View
- complete in-memory restart/reconnect persistence and replay validation
- successful item removal and failed/deferred retention verified
- Main Stock remained 999
- all 18 regression checks passed
- empty-queue desktop browser gate passed
- Offline/reconnect and settled synchronized state passed
- clean Console and read-only Network evidence passed
- Teacher/Admin Logout regression passed
- 820 x 1180 responsive gate passed
- `index.html` and `teacher.html` unchanged

Integration decision:

- approved for fast-forward merge into `develop`
- not approved for `main` or production cutover

### Sprints 4.4–4.7 — Teacher Operational Parity

- Pending Milk operational UI
- Retroactive Milk operational UI
- Vacation Milk operational UI
- shared photo and signature workflow
- typed Queue recovery and duplicate prevention
- isolated issue/delete/rollback gates
- responsive Teacher integration
- protected legacy files unchanged

Integration decision:

- merged into `develop`
- not approved for `main` or production cutover

### Sprint 4.8 — Attendance History, Summary and A4 Print UI

Merged foundation:

- authenticated-room, selected-range history query
- evidence-free historical reads
- pure daily, range, and per-student summary builder
- deterministic A4 print model

Current follow-up branch:

`feature/sprint-4.8.1-report-print-ui-integration`

Current result:

- Teacher report and print UI wired into the modular App
- isolated UI gate passed
- all 48 discovered regression checks passed
- local desktop and `820 x 1180` browser evidence passed
- visible report traffic was GET-only and Console remained clean
- one-sheet A4 preview contained all 16 student rows
- no approval for `main` or production cutover

### Sprint 4.9 — Student Report, Room Stock, Settings and Navigation Parity

Active branch:

`feature/sprint-4.9-teacher-parity-cutover`

Implemented boundary:

- authenticated-room one-student selected-range report
- per-date status and notes with deterministic A4 pages
- actual read-only authenticated-room Room Stock
- safe device-local display preferences under `milkapp_teacher_preferences_v1`
- complete 12-item Teacher navigation reusing accepted Sprint 4.1–4.8 panels
- reference-style dark-blue left desktop sidebar with grouped menus, active highlight, Teacher footer, and compact narrow-screen fallback
- fixed blue Teacher header above the content and a dark-blue sidebar that begins below it
- editable authenticated-room homeroom Teacher name with a teacher-leaf-only Repository write
- `ดื่มนม` / `ไม่ดื่มนม` display wording while persisted `present` / `absent` values stay unchanged
- metadata-only events and no direct Firebase, Queue, stock, or media ownership
- Teacher profile events contain room ID only; report, stock, Queue, and media boundaries remain unchanged
- isolated Service, Store, Manager, and UI gates passed
- all 53 discovered regression checks passed
- local browser evidence pending

---

Deferred Real-Data Incident

Room `อ.3-3` / `mqn0z13eyx5b`, date `2026-07-28` remains quarantined:

- test-created Attendance record: 22 present, 3 absent
- Room Stock: 1,253
- recorded pre-test Room Stock: 1,275
- known difference: -22

Room `อ.3-4` / `mqn0z13emyrc` is reconciled at Attendance and Room Stock level:

- Attendance: `null`
- Room Stock: 350

This is not incident closure. Recovery, Main Stock review, queue/audit review, and explicit closure remain mandatory before `main`, production cutover, or official use of the affected room/date.

Do not use the quarantined room/date for further writes or trusted report evidence.

---

Active Gate

Sprint 4.9 — full regression and local browser acceptance.

Required local evidence:

- all 12 Teacher menu items;
- Student Report load and A4 preview;
- Room Stock equals the Teacher header;
- safe settings persist on the same device;
- Teacher name save updates the authenticated room only and survives refresh;
- desktop and Chrome Responsive `820 x 1180`;
- clean Console and no report/stock write method.

---

Protected Legacy Files

- `index.html`
- `teacher.html`

Do not delete, rename, replace, or silently redirect these files without explicit production-cutover approval.

---

Never Break

- Main Stock decreases only on classroom distribution.
- Classroom distribution increases Room Stock.
- Teacher, Attendance, Pending, Retroactive, Vacation, and Sync workflows change Room Stock only.
- Attendance edits change Room Stock by the present-count difference only.
- Attendance deletion restores previously consumed Room Stock.
- Attendance keys remain `{roomId}_{YYYY-MM-DD}`.
- ETag conflicts read the newest Room Stock and recalculate before retry.
- Offline retries preserve the original Attendance baseline.
- Repeated queued edits keep the latest record without replacing the original baseline.
- Audit-only retries never repeat a successful Room Stock mutation.
- Partial Attendance saves surface queued Room Stock status without rewriting Attendance.
- Queue storage key remains `tc_pending_saves_v1`.
- Legacy `rec` and `diff` compatibility remains intact.
- Reports remain read-only.
- Firebase schema and paths remain compatible unless an approved migration includes rollback.
- Room IDs remain stable.
- Teacher access remains limited to the authenticated room.
- Queue entries survive refresh and browser restart.
- Negative Room Stock is not silently clamped.
- Legacy files remain deployable until production cutover is complete.

---

Layer Responsibilities

Repository / Storage Adapter

- paths, queries, serialization, and persistence only
- no business calculations
- no UI

Service

- validation, normalization, calculation, workflow, retry, compatibility, and business rules
- no UI

Manager

- commands, browser lifecycle orchestration, and events
- no direct Firebase access

View

- DOM rendering and user interaction
- consumes Managers and events
- no business calculations
- no direct Firebase or storage access

---

Required Workflow

1. Read `AGENTS.md`.
2. Read `CODEX_CONTEXT.md`.
3. Read `REPOSITORY_RULES.md`.
4. Read `SPRINT_STATUS.md`.
5. Read `MODULE_MAP.md`.
6. Read the active Sprint plan.
7. Compare protected legacy behavior with the intended V2 boundary before editing.
8. Work only on a `feature/*` branch.
9. Add tests for every runtime change.
10. Run automated, isolated-write, browser, responsive, Network, Console, and clean-tree gates.
11. Update project memory, changelog, module map, status, and active reports.
12. Merge into `develop` only after the Sprint gate passes.
13. Merge or deploy to `main` only with explicit production-cutover approval.
