# MilkSchoolSystem-V2
# AI Development Context

Version: 3.2
Last Updated: 2026-07-29

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

Teacher shell, Attendance CRUD UI, Offline Queue UI, and Pending Milk UI completed and approved for `develop`

↓

Sprint 4.5 Retroactive Milk Operational UI is active

Production cutover remains blocked.

---

Completed Operational Sprints

### Sprint 4.1 — Teacher UI Shell and Read-Only State

- modular Teacher shell
- authenticated-room snapshot
- Room Stock, queue, and connection state
- Admin and Teacher role routing
- desktop, responsive, Network, and Console gates passed
- merged into `develop`

### Sprint 4.2 — Teacher Daily Attendance CRUD UI

- exact one-date Attendance loading
- present/absent controls and notes
- create/edit/delete through AttendanceManager
- Room Stock difference adjustment and rollback
- ETag conflict protection
- isolated write validation
- Main Stock unchanged
- all 16 regression checks passed
- desktop and 820 x 1180 gates passed
- merged into `develop`

### Sprint 4.3 — Offline Queue Operational UI

- online/offline/syncing Queue states
- persistent count, attempts, last-sync time, summary, and next retry
- safe item summaries
- manual retry through SyncManager
- restart/reconnect persistence and replay validation
- successful-item removal and failed/deferred retention
- Main Stock remained 999
- all 18 regression checks passed
- desktop, Network, Console, Logout, and 820 x 1180 gates passed
- merged into `develop`

### Sprint 4.4 — Pending Milk Operational UI

- `PendingMilkRepository`, `PendingMilkService`, `PendingMilkManager`, and `PendingMilkView`
- exact five-day Attendance reads
- authenticated-room `absentMilk` query
- absent-only eligibility and already-issued exclusion
- Service-level duplicate prevention
- compatible Firebase push records
- Room Stock-only issue and rollback
- `PENDING` / `ROLLBACK` ledger routing
- `OUT` / `IN` stockLog routing
- typed partial-save Queue recovery
- audit-only retry without repeated Room Stock mutation
- Firebase `.indexOn: ["roomId"]` at `/milkApp/absentMilk`
- all four Sprint-specific tests and all 22 regression checks passed
- desktop read-only, indexed Network, clean Console, and completed-data 820 x 1180 gates passed
- Main Stock remained 999 in isolated validation
- `index.html` and `teacher.html` unchanged
- approved for fast-forward merge into `develop`

---

Active Sprint

Sprint 4.5 — Retroactive Milk Operational UI

Branch:

`feature/sprint-4.5-retroactive-milk-ui`

Verified protected legacy behavior:

- page label `จ่ายนมย้อนหลัง`
- Firebase path `milkApp/retroMilk`
- Firebase push-ID record creation
- academic year and semester
- issue date
- retroactive start/end dates
- Monday–Friday calculation only
- quantity equals weekday count multiplied by authenticated-room student count
- `debtBoxes` starts equal to `totalBoxes`
- status starts as `debt`
- note, per-student signatures, photos, and `savedAt` preserved
- record saved before Room Stock deduction
- ledger type `RETRO` on issue
- record deleted before Room Stock restoration
- ledger type `ROLLBACK` on delete
- duplicate delete/rollback guard
- Main Stock unchanged

Target architecture:

- `modules/repositories/retroactiveMilkRepository.js`
- `modules/services/retroactiveMilkService.js`
- `modules/retroactive/retroactiveMilkManager.js`
- `modules/retroactive/retroactiveMilkView.js`

Target behavior:

- authenticated-room-only history
- valid date-range and weekday calculation
- stable authenticated-room student snapshot
- exact quantity calculation
- compatible debt record creation
- Room Stock-only issue and rollback
- typed `RETRO` and `ROLLBACK` Queue recovery
- audit-only retry without repeated Room Stock mutation
- Manager in-flight delete guard
- View contains no Firebase, Repository, browser-storage, stock, ledger, or retry ownership
- in-memory isolated issue/delete/partial-save validation only
- desktop read-only, Network, Console, and 820 x 1180 gates

Out of scope:

- Vacation Milk
- debt settlement by local authority
- photos/signatures capture expansion
- printing changes
- production deployment
- real-classroom write tests
- replacement or removal of `teacher.html`

---

Deferred Real-Data Incident

Room `อ.3-3` / `mqn0z13eyx5b`, date `2026-07-28` remains quarantined:

- test-created Attendance record: 22 present, 3 absent
- Room Stock: 1,253
- recorded pre-test Room Stock: 1,275
- known difference: -22

Room `อ.3-4` / `mqn0z13emyrc` remains reconciled at Attendance and Room Stock level:

- Attendance: `null`
- Room Stock: 350

This is not incident closure. Recovery, Main Stock review, queue/audit review, and explicit closure remain mandatory before `main`, production cutover, or official use of the affected room/date.

Do not use the quarantined room/date for further writes or trusted report evidence.

---

Production Blockers

- Firebase root-level public `.read` and `.write` remain enabled.
- Deferred real-data incident remains open.
- Physical iPad validation remains deferred.
- Backup and restore rehearsal remains pending.
- Real multi-writer validation requires an isolated Firebase environment.
- Operational Admin parity is incomplete.
- Vacation Milk UI is incomplete.

---

Protected Legacy Files

- `index.html`
- `teacher.html`

Do not delete, rename, replace, modify, or silently redirect these files without explicit production-cutover approval.

---

Never Break

- Main Stock decreases only on classroom distribution.
- Classroom distribution increases Room Stock.
- Teacher, Attendance, Pending, Retroactive, Vacation, and Sync workflows change Room Stock only.
- Attendance edits change Room Stock by the present-count difference only.
- Attendance deletion restores previously consumed Room Stock.
- Attendance keys remain `{roomId}_{YYYY-MM-DD}`.
- Retroactive quantity equals weekday count multiplied by authenticated-room student count.
- Retroactive issue creates the compatible record before stock deduction.
- Retroactive deletion removes the record before stock restoration.
- ETag conflicts read the newest Room Stock and recalculate before retry.
- Offline retries preserve original workflow metadata.
- Audit-only retries never repeat a successful Room Stock mutation.
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
