# MilkSchoolSystem-V2
# AI Development Context

Version: 3.0
Last Updated: 2026-07-28

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

Teacher read-only shell completed

↓

Teacher daily Attendance CRUD UI code completed and approved for `develop`

↓

Offline Queue operational UI is next

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
- totals and responsive layout
- create/edit through `AttendanceManager.save()`
- confirmed delete through `AttendanceManager.remove()`
- Room Stock result, conflict, queue, and audit feedback
- compatible media-field preservation during edits
- no direct Firebase, Repository, storage, stock, ledger, retry, or ETag ownership in the View
- complete in-memory create → edit up → edit down → delete test
- Main Stock unchanged through all isolated operations
- deliberate partial-save queue simulation
- all 16 regression checks accepted as passed
- desktop and 820 x 1180 browser gates passed
- `index.html` and `teacher.html` unchanged

Integration decision:

- approved for fast-forward merge into `develop`
- not approved for `main` or production cutover

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

The product owner deferred recovery so development can continue. This is not incident closure. Recovery, Main Stock review, queue/audit review, and explicit closure remain mandatory before `main`, production cutover, or official use of the affected room/date.

Do not use the quarantined room/date for further writes or trusted report evidence.

---

Next Sprint

Sprint 4.3 — Offline Queue Operational UI

Planned branch:

`feature/sprint-4.3-offline-queue-ui`

Goals:

- operational offline banner
- persistent queue badge and item count
- last successful sync time
- retrying, failed, and deferred states
- manual retry action
- item-level safe error summary
- restart and reconnect validation
- preserve `tc_pending_saves_v1`
- preserve legacy `rec` and `diff` compatibility
- preserve repeated-edit original baseline
- no direct queue-storage mutation from the View
- no additional real-classroom write tests

Out of scope:

- pending, retroactive, or vacation milk forms
- photos and signatures
- printing
- replacement or removal of `teacher.html`
- production deployment

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
- Reports remain read-only.
- Firebase schema and paths remain compatible unless an approved migration includes rollback.
- Room IDs remain stable.
- Teacher normal refresh remains room-scoped and date-scoped by default.
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
10. Run automated, isolated-write, browser, responsive, and clean-tree gates.
11. Update project memory, changelog, module map, status, and active reports.
12. Merge into `develop` only after the Sprint gate passes.
13. Merge or deploy to `main` only with explicit production-cutover approval.
