# MilkSchoolSystem-V2
# AI Development Context

Version: 2.7
Last Updated: 2026-07-28

---

Repository

possible25672024-tech/MilkSchoolSystem-V2

Default integration branch

develop

---

Project Status

Legacy operational system

↓

Modular V2 migration completed through performance optimization

↓

Cutover readiness and compatibility phase

Backend

Firebase Realtime Database

---

Completed Sprints

Sprint 3.4.2 — Recovery Foundation

✓ Runtime Firebase configuration

✓ Firebase Realtime Database REST service

✓ BaseRepository

✓ Admin and Teacher login

✓ Session compatibility

✓ Bootstrap and index-v2 dependency order

✓ Static and browser validation

Sprint 3.4.3 — Stock Module Migration

✓ StockRepository, StockService, and StockManager

✓ Main Stock and Room Stock separation

✓ Receive, distribute, rollback, rebuild, validation, and ledger rules

Sprint 3.4.4 — Report Module Migration

✓ Read-only report boundary

✓ Classroom, grade-level, and school aggregation

✓ Thai grade normalization

✓ Print and Excel models

Known gap: browser-local pending, retroactive, and vacation collections still require an adapter before operational replacement.

Sprint 3.5 — Room Module Migration

✓ RoomRepository, RoomService, and RoomManager

✓ Immutable Room IDs

✓ Room Stock preservation

✓ Duplicate validation, import preparation, and deletion safety

Known gaps: XLSX parsing remains legacy, and complete room writes lack multi-admin optimistic concurrency.

Sprint 3.6 — Teacher Module Migration

✓ Authenticated-room-only Teacher boundary

✓ Teacher session and cross-room protection

✓ Dashboard and Room Stock-only command preparation

Sprint 3.7 — Attendance Module Migration

✓ Attendance Repository, Service, and Manager

✓ Key format `{roomId}_{YYYY-MM-DD}`

✓ Create, edit-by-difference, delete rollback, ledger, and stockLog rules

✓ Main Stock isolation

Sprint 3.8 — Offline Queue and Sync Migration

✓ Compatible `tc_pending_saves_v1` persistence

✓ Legacy `rec` and `diff` alias normalization

✓ Corrupt-entry filtering

✓ Original baseline preservation

✓ Attendance and Room Stock adjustment replay

✓ Sequential retry with bounded backoff

✓ Startup, reconnect, retry, and periodic flush

Sprint 3.9 — Performance and Payload Optimization

✓ Identical in-flight Firebase GET deduplication

✓ GET preflight removal

✓ Login context cache and immediate credential reuse

✓ Authenticated Teacher `roomSnapshot`

✓ Default Teacher core refresh reduced to four Firebase reads

✓ Today's attendance `/data` child only in normal refresh

✓ Deferred collections behind explicit `refreshFull()`

✓ Queue upsert serialization reduction

✓ Legacy and V2 queue compatibility fixtures

✓ Full automated regression suite

✓ Desktop Network measurement on actual 83-room data

Observed desktop result:

- before final Teacher core optimization: approximately 20.5 MB across 5 requests
- after final Teacher core optimization: approximately 1.6 KB across 4 requests
- no rooms request, room-history attendance request, GET preflight, or HTTP error

Deferred gate:

- responsive mobile and physical iPad validation remain required before production cutover

---

Current Sprint

Sprint 4.0 — Cutover Readiness and Compatibility

Goals

- create a legacy-to-V2 functional parity matrix
- verify desktop, responsive mobile, and physical iPad behavior
- validate queues written by legacy `teacher.html` against V2 normalization and replay
- resolve or formally gate ETag Room Stock concurrency
- decide the Report browser-local adapter implementation
- decide and plan XLSX parser migration
- map operational forms, media, signatures, print, queue badge, and offline banner into V2
- define backup, rollback, deployment, and production cutover checklists
- do not remove legacy files until every cutover gate passes

Target documentation

- `docs/SPRINT_4_0_PLAN.md`
- `docs/CUTOVER_PARITY_MATRIX.md`
- `docs/CUTOVER_READINESS_REPORT.md`
- `docs/PRODUCTION_ROLLBACK_PLAN.md`

Runtime code changes are allowed only when they close a measured compatibility or safety gap and include regression tests.

---

Protected Legacy Files

- `index.html`
- `teacher.html`

These files remain available and unchanged until explicit cutover approval. Do not delete, rename, or replace them during readiness work.

---

Never Break

- Main Stock decreases only when distributing to classrooms.
- Teacher, Attendance, and Sync operations change only Room Stock.
- Attendance edits change Room Stock by the difference only.
- Offline retries preserve the original attendance baseline.
- Repeated queued edits keep the latest record without replacing the original baseline.
- Attendance keys remain compatible.
- Reports remain read-only.
- Firebase schema and paths remain compatible unless a separately approved migration includes rollback.
- Room IDs remain stable after creation.
- Admin and Teacher login remain operational.
- Teacher normal refresh uses only the authenticated room and today's attendance summary.
- Queue entries survive refresh and browser restart.
- Rebuild calculations use transaction history.
- Legacy files remain deployable until cutover is complete.

---

Repository and Storage Responsibilities

Database paths, queries, serialization, and persistent storage only.

No business calculations.

No UI.

---

Service Responsibilities

Validation.

Normalization.

Calculation.

Workflow.

Retry and compatibility policy.

Business rules.

No UI.

---

Manager Responsibilities

Browser events.

Retry timing.

Queue and status events.

Periodic orchestration.

Never access Firebase directly.

---

Required Workflow

1. Read `AGENTS.md`.
2. Read `CODEX_CONTEXT.md`.
3. Read `REPOSITORY_RULES.md`.
4. Read `SPRINT_STATUS.md`.
5. Read `MODULE_MAP.md`.
6. Read the current cutover plan and parity matrix.
7. Compare legacy and V2 behavior before editing.
8. Implement only on a feature branch.
9. Add regression and compatibility tests for every runtime change.
10. Run browser, responsive, physical-device, data-compatibility, and clean-tree gates.
11. Update project memory, changelog, module map, status, parity matrix, and rollback plan.
12. Merge into `develop` only after the Sprint gate passes.
13. Merge or deploy to `main` only with explicit production-cutover approval.

---

End of CODEX_CONTEXT.md
