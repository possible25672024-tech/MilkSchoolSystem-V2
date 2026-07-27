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

10% — cutover plan, initial parity matrix, protected legacy rollback rule, device gates, data compatibility gates, concurrency gate, and production approval boundaries initialized

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

✓ Login, Firebase, Stock, Report, Room, Teacher, Attendance, Sync, and Performance regression gates passed

---

Sprint 4.0 Initialized

✓ Branch created from latest `develop`

✓ Sprint plan created: `docs/SPRINT_4_0_PLAN.md`

✓ Initial parity matrix created: `docs/CUTOVER_PARITY_MATRIX.md`

✓ Legacy `index.html` and `teacher.html` retained as rollback paths

✓ Production deployment separated from `develop` integration

✓ Physical iPad and responsive mobile validation gates recorded

✓ Legacy/V2 queue compatibility gate recorded

✓ ETag Room Stock concurrency gate recorded

✓ Report local-data adapter decision recorded

✓ XLSX parser migration decision recorded

✓ Operational Teacher UI parity areas recorded

✓ Backup and rollback planning required before cutover

---

Current Blockers to Production Cutover

- physical iPad evidence not yet recorded
- responsive mobile evidence not yet recorded
- V2 ETag compare-and-retry Room Stock protection unresolved
- operational Teacher forms, photos, signatures, printing, queue badge, and offline banner not integrated
- Report browser-local adapter unresolved
- XLSX binary parser remains legacy
- complete-room multi-admin concurrency unresolved
- production backup and rollback rehearsal not documented

---

Pending Sprint 4.0 Work

□ Inspect every parity-matrix row against legacy and V2 implementations

□ Add legacy-produced queue fixtures from representative data

□ Run queue normalization and replay compatibility tests

□ Design and test ETag Room Stock concurrency behavior or retain explicit production block

□ Decide and implement or defer Report local-data adapter

□ Decide and implement or defer XLSX parser migration

□ Create operational Teacher UI integration plan

□ Create `docs/CUTOVER_READINESS_REPORT.md`

□ Create `docs/PRODUCTION_ROLLBACK_PLAN.md`

□ Run responsive mobile validation

□ Run physical iPad validation when available

□ Run full automated regression suite after every runtime change

□ Confirm browser console clean

□ Confirm working tree clean

□ Merge Sprint 4.0 into `develop` only after its readiness gate passes

□ Deploy or merge to `main` only after explicit production approval

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
- Offline retries preserve the original baseline.
- Reports remain read-only.
- Firebase paths and attendance keys remain compatible unless an approved migration includes rollback.
- Room IDs remain stable.
- Negative Room Stock is not silently clamped.
- Legacy files remain available until explicit cutover approval.
