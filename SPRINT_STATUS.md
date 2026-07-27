# MilkSchoolSystem-V2

# Sprint Status

Last Update

2026-07-28

---

Current Branch

feature/sprint-4.0-cutover-readiness

---

Current Version

V2

---

Current Sprint

Sprint 4.0 — Cutover Readiness and Compatibility

Status

55% — ETag conditional request primitives, protected Room Stock retry, attendance-first partial-save recovery, attendance-to-stock queue conversion, deterministic concurrency tests, and parity documentation implemented; local regression, real Firebase conflict validation, device gates, audit recovery, UI parity, backup, and rollback gates remain pending

---

Completed Foundation

✓ Sprint 3.4.2 Recovery merged into `develop`

✓ Sprint 3.4.3 Stock Module merged into `develop`

✓ Sprint 3.4.4 Report Module merged into `develop`

✓ Sprint 3.5 Room Module merged into `develop`

✓ Sprint 3.6 Teacher Module merged into `develop`

✓ Sprint 3.7 Attendance Module merged into `develop`

✓ Sprint 3.8 Offline Queue and Sync Module merged into `develop`

✓ Sprint 3.9 Performance and Payload Optimization merged into `develop`

✓ Desktop Teacher core refresh measured at approximately 1.6 KB across 4 requests on the recorded 83-room dataset

✓ Login, Firebase, Stock, Report, Room, Teacher, Attendance, Sync, and Performance regression gates passed before Sprint 4.0

---

Sprint 4.0 Implemented

✓ Sprint plan created: `docs/SPRINT_4_0_PLAN.md`

✓ Initial parity matrix created and expanded: `docs/CUTOVER_PARITY_MATRIX.md`

✓ Legacy `index.html` and `teacher.html` retained as rollback paths

✓ Production deployment separated from `develop` integration

✓ FirebaseService ETag read primitive added using `X-Firebase-ETag: true`

✓ FirebaseService conditional write primitive added using `If-Match`

✓ HTTP 412 conflicts exposed as retryable results instead of generic failures

✓ AttendanceRepository versioned Room Stock read boundary added

✓ AttendanceRepository conditional Room Stock write boundary added

✓ AttendanceService ETag compare-and-retry implemented with six-attempt default

✓ Conflict retry recalculates against the newest Room Stock value

✓ Negative Room Stock remains visible and is not silently clamped

✓ Attendance save preserves the operational legacy order: attendance first, protected Room Stock second

✓ Room Stock failure after attendance save produces `ROOM_STOCK_ADJUSTMENT_REQUIRED`

✓ AttendanceManager converts partial saves and deletes into persistent Room Stock adjustment queue entries

✓ SyncService converts partially saved attendance queue entries into stock-only retries

✓ Sequential replay and original attendance baseline rules remain protected

✓ Main Stock remains unchanged in every Attendance and Sync result

✓ Attendance audit writes retry without repeating the successful Room Stock change

✓ Existing Attendance module test updated for ETag-protected flow

✓ New deterministic cutover test added: `tests/cutover-concurrency-check.mjs`

✓ Parity matrix now separates concurrency, partial-save recovery, and audit-recovery status

---

Pending Local Validation

□ Pull the latest `feature/sprint-4.0-cutover-readiness`

□ Run all previous regression tests

□ Run `node tests/cutover-concurrency-check.mjs`

□ Confirm Attendance and Sync tests remain compatible

□ Confirm browser Admin and Teacher login

□ Confirm Logout

□ Confirm browser console clean

□ Confirm working tree clean

---

Pending Cutover Work

□ Run a real Firebase multi-writer Room Stock conflict test

□ Decide persistent audit-only recovery after Room Stock succeeds but ledger/log writes fail

□ Inspect every remaining parity-matrix row against legacy and V2 implementations

□ Add representative legacy-produced queue fixtures from actual operational data

□ Run queue normalization and replay compatibility tests with those fixtures

□ Decide and implement or defer Report local-data adapter

□ Decide and implement or defer XLSX parser migration

□ Create operational Teacher UI integration plan

□ Create `docs/CUTOVER_READINESS_REPORT.md`

□ Create `docs/PRODUCTION_ROLLBACK_PLAN.md`

□ Run responsive mobile validation

□ Run physical iPad validation when available

□ Rehearse Firebase backup and isolated restore

□ Merge Sprint 4.0 into `develop` only after its readiness gate passes

□ Deploy or merge to `main` only after explicit production approval

---

Current Blockers to Production Cutover

- physical iPad evidence not yet recorded
- responsive mobile evidence not yet recorded
- persistent audit-only recovery after successful Room Stock update is unresolved
- operational Teacher forms, photos, signatures, printing, queue badge, and offline banner are not integrated
- Report browser-local adapter is unresolved
- XLSX binary parser remains legacy
- complete-room multi-admin concurrency is unresolved
- production backup and rollback rehearsal is not documented

---

Cutover Rule

Legacy removal and production cutover are BLOCKED while any safety-critical parity row remains BLOCKED.

---

Protected Business Rules

- Main Stock decreases only on classroom distribution.
- Classroom distribution increases Room Stock.
- Teacher, Attendance, Pending, Retroactive, Vacation, and Sync operations change Room Stock only.
- Attendance edits change Room Stock by the difference only.
- Attendance deletion restores previously consumed Room Stock.
- ETag conflicts must read the latest Room Stock and recalculate before retry.
- Offline retries preserve the original attendance baseline.
- Reports remain read-only.
- Firebase paths and attendance keys remain compatible unless an approved migration includes rollback.
- Room IDs remain stable.
- Negative Room Stock is not silently clamped.
- Legacy files remain available until explicit cutover approval.
