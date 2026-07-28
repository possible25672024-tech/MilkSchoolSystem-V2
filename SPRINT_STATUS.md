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

78% — automated regression, ETag concurrency, partial-save recovery, audit-only recovery, desktop Admin login, desktop Teacher login, current Sprint 4.0 shell text, clean Teacher-session Console evidence, browser Network evidence, parity documentation, and initial readiness reporting completed; direct Logout evidence, Admin/Logout Console evidence, responsive and physical iPad gates, real Firebase conflict validation, UI parity, backup, and rollback gates remain pending

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

✓ Parity matrix created and expanded: `docs/CUTOVER_PARITY_MATRIX.md`

✓ Initial readiness report created: `docs/CUTOVER_READINESS_REPORT.md`

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

✓ QueueStorage supports persistent `attendanceAudit` recovery entries

✓ AttendanceManager queues stable ledger and stockLog IDs when audit writes fail after Room Stock succeeds

✓ SyncService replays audit-only entries without repeating Attendance or Room Stock changes

✓ Room Stock adjustment replay converts to audit-only recovery if stock succeeds but audit fails

✓ Sequential replay and original attendance baseline rules remain protected

✓ Main Stock remains unchanged in every Attendance and Sync result

✓ Existing Attendance module test updated for ETag-protected flow

✓ Deterministic ETag test added: `tests/cutover-concurrency-check.mjs`

✓ Persistent audit recovery test added: `tests/audit-recovery-check.mjs`

✓ All 12 current automated tests passed locally on 2026-07-28

✓ Working tree confirmed clean after automated validation

✓ Desktop Chrome Admin login evidence recorded

✓ Desktop Chrome Teacher login evidence recorded

✓ Firebase `settings.json` and `rooms.json` returned HTTP 200 in the supplied browser captures

✓ No failed Fetch/XHR request visible in the supplied browser captures

✓ Successful-login panel confirmed to display Sprint 4.0 text

✓ Teacher-session Console captured with only `MilkSchoolSystem V2 Started` and no visible error

✓ V2 shell stale Sprint 3.9 text corrected to Sprint 4.0

✓ Performance static test updated to protect the current Sprint 4.0 shell text

✓ Parity matrix separates concurrency, partial-save recovery, audit-only recovery, and browser evidence status

---

Pending Immediate Browser Validation

□ Capture the Login screen directly after pressing Logout

□ Capture or explicitly confirm a clean Console after Admin login and Logout

□ Confirm Logout clears the active session and returns to the login form

□ Confirm working tree clean after the latest documentation update

---

Pending Cutover Work

□ Run a real Firebase multi-writer Room Stock conflict test

□ Inspect every remaining parity-matrix row against legacy and V2 implementations

□ Add representative legacy-produced queue fixtures from actual operational data

□ Run queue normalization and replay compatibility tests with those fixtures

□ Decide and implement or defer Report local-data adapter

□ Decide and implement or defer XLSX parser migration

□ Create operational Teacher UI integration plan

□ Create `docs/PRODUCTION_ROLLBACK_PLAN.md`

□ Run responsive mobile validation

□ Run iPad-class viewport validation at approximately 820 x 1180 CSS pixels

□ Run physical iPad validation when available

□ Rehearse Firebase backup and isolated restore

□ Merge Sprint 4.0 into `develop` only after its readiness gate passes

□ Deploy or merge to `main` only after explicit production approval

---

Current Blockers to Production Cutover

- direct Logout evidence is not yet recorded for the current Sprint 4.0 shell
- clean Admin-login and Logout Console evidence is not yet separately recorded
- physical iPad evidence not yet recorded
- responsive mobile and iPad-class viewport evidence not yet recorded
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
- Audit-only retries must never repeat a successful Room Stock change.
- Reports remain read-only.
- Firebase paths and attendance keys remain compatible unless an approved migration includes rollback.
- Room IDs remain stable.
- Negative Room Stock is not silently clamped.
- Legacy files remain available until explicit cutover approval.
