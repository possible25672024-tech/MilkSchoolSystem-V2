# MilkSchoolSystem-V2
# AI Development Context

Version: 2.8
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

Modular V2 service, repository, queue, recovery, performance, and cutover-readiness foundation completed

↓

Operational UI integration beginning with the Teacher shell

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

### Sprint 3.7 — Attendance

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
- desktop Admin/Teacher Login and Logout evidence
- complete 820 x 1180 Teacher Login and Logout evidence
- clean recorded Console
- parity matrix and readiness report
- explicit cutover decision register
- operational Teacher UI integration plan
- production backup and rollback plan
- all automated and documentation tests passed
- clean feature branch gate passed

Integration decision:

- approved for fast-forward merge into `develop`
- not approved for `main` or production cutover

---

Current Sprint

Sprint 4.1 — Teacher UI Shell and Read-Only State

Target branch

`feature/sprint-4.1-teacher-ui-shell`

Goals

- render a modular Teacher session header
- display school, room, and teacher identity
- display current Room Stock
- display connection state
- display pending queue count
- provide Logout
- consume Managers and browser events only
- keep Firebase access out of the view
- pass desktop and 820 x 1180 shell tests
- keep `teacher.html` operational and unchanged

Out of scope

- Attendance write UI
- pending, retroactive, or vacation write UI
- photos and signatures
- printing
- replacement or removal of `teacher.html`

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
- ETag conflicts read the newest Room Stock and recalculate before retry.
- Offline retries preserve the original Attendance baseline.
- Repeated queued edits keep the latest record without replacing the original baseline.
- Audit-only retries never repeat a successful Room Stock mutation.
- Attendance keys remain compatible.
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
- no direct Firebase access

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
10. Run automated, browser, responsive, and clean-tree gates.
11. Update project memory, changelog, module map, status, and active reports.
12. Merge into `develop` only after the Sprint gate passes.
13. Merge or deploy to `main` only with explicit production-cutover approval.
