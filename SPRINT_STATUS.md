# MilkSchoolSystem-V2

# Sprint Status

Last Update

2026-07-28

---

Current Branch

feature/sprint-4.1-teacher-ui-shell

---

Current Version

V2

---

Current Sprint

Sprint 4.1 — Teacher UI Shell and Read-Only State

Status

10% — Sprint plan initialized from the completed Sprint 4.0 cutover-readiness foundation; runtime Teacher View implementation, shell tests, browser validation, and responsive validation have not started

---

Completed Foundation

✓ Sprint 3.4.2 Recovery merged into `develop`

✓ Sprint 3.4.3 Stock Module merged into `develop`

✓ Sprint 3.4.4 Report Module merged into `develop`

✓ Sprint 3.5 Room Module merged into `develop`

✓ Sprint 3.6 Teacher Service Foundation merged into `develop`

✓ Sprint 3.7 Attendance Module merged into `develop`

✓ Sprint 3.8 Offline Queue and Sync Module merged into `develop`

✓ Sprint 3.9 Performance and Payload Optimization merged into `develop`

✓ Sprint 4.0 Cutover Readiness and Compatibility fast-forward merged into `develop`

✓ ETag Room Stock protection and recovery foundations available

✓ Desktop and 820 x 1180 Login/Logout shell evidence recorded

✓ Production decisions, Teacher UI integration plan, and rollback plan documented

✓ Protected `index.html` and `teacher.html` remain operational

---

Sprint 4.1 Goal

Create the first modular Teacher interface in `index-v2.html` as a read-only shell without changing verified Attendance, stock, queue, Firebase, or protected legacy behavior.

---

Sprint 4.1 In Scope

□ Teacher session header

□ School name

□ Room name

□ Teacher name

□ Current Room Stock display

□ Online/offline connection state

□ Pending queue count

□ Logout action

□ Event-driven View boundary

□ Desktop browser validation

□ Chrome Device Toolbar validation at 820 x 1180

---

Sprint 4.1 Architecture Rules

- View owns DOM rendering and interaction only.
- View calls Managers and subscribes to browser events.
- View must not access Firebase directly.
- View must not access Repositories directly.
- View must not calculate Main Stock or Room Stock.
- Room Stock is display-only in this Sprint.
- Negative Room Stock remains visible.
- Queue count comes from the existing persistent Sync/Queue boundary.
- Logout delegates through the existing Auth/Login boundary.
- Teacher data remains limited to the authenticated room.
- Normal Teacher refresh remains date-scoped and does not load full room history.

---

Planned Runtime File

□ `modules/teacher/teacherView.js`

Optional only when justified by the current shell structure:

□ `modules/teacher/teacherShellRenderer.js`

Do not create new Service or Repository modules for display-only concerns.

---

Planned Test

□ `tests/teacher-ui-shell-check.mjs`

Required coverage:

- valid JavaScript
- dependency order
- no direct Firebase access
- no `fetch()` in the View
- no direct Repository access
- no stock calculations in the View
- Teacher identity rendering
- Room Stock zero, positive, and negative rendering
- queue count rendering
- online/offline rendering
- Logout delegation
- Admin session rejection
- shell clearing after Logout

---

Automated Regression Gate

□ `node tests/login-foundation-check.mjs`

□ `node tests/stock-module-check.mjs`

□ `node tests/report-module-check.mjs`

□ `node tests/room-module-check.mjs`

□ `node tests/teacher-module-check.mjs`

□ `node tests/attendance-module-check.mjs`

□ `node tests/sync-module-check.mjs`

□ `node tests/firebase-request-header-check.mjs`

□ `node tests/performance-module-check.mjs`

□ `node tests/teacher-core-payload-check.mjs`

□ `node tests/cutover-concurrency-check.mjs`

□ `node tests/audit-recovery-check.mjs`

□ `node tests/cutover-documentation-check.mjs`

□ `node tests/teacher-ui-shell-check.mjs`

---

Browser Gate

Desktop Chrome:

□ Admin Login remains unchanged

□ Teacher Login renders the modular Teacher shell

□ School, room, teacher, and Room Stock display correctly

□ Queue count displays correctly

□ Online/offline state displays correctly

□ Logout returns to the login form

□ Console clean

□ No failed application Fetch/XHR requests

Chrome Device Toolbar at 820 x 1180:

□ Teacher shell remains contained

□ Room Stock and queue count remain visible

□ Logout remains usable

□ No abnormal horizontal overflow

□ Console clean

Physical iPad remains deferred and must not be represented as PASS.

---

Out of Scope

- Attendance create, edit, or delete UI
- Pending milk write UI
- Retroactive milk write UI
- Vacation milk write UI
- Photos
- Signatures
- Printing
- History screens
- Report UI
- Admin UI
- XLSX parsing
- Firebase schema changes
- Replacement or removal of `teacher.html`
- Production deployment

---

Current Production Blockers

- Operational Admin UI remains in `index.html`.
- Operational Teacher workflows remain in `teacher.html`.
- Report browser-local adapter is not implemented.
- XLSX binary parsing remains in the protected legacy flow.
- Real isolated Firebase multi-writer evidence is not recorded.
- Real sanitized legacy queue evidence is not recorded.
- Backup export and isolated restore rehearsal are not recorded.
- Physical iPad evidence remains deferred.
- Explicit production approval is not granted.

---

Protected Business Rules

- Main Stock decreases only on classroom distribution.
- Classroom distribution increases Room Stock.
- Teacher, Attendance, Pending, Retroactive, Vacation, and Sync operations change Room Stock only.
- Attendance edits change Room Stock by the difference only.
- Attendance deletion restores previously consumed Room Stock.
- ETag conflicts read the latest Room Stock and recalculate before retry.
- Offline retries preserve the original Attendance baseline.
- Audit-only retries never repeat a successful Room Stock mutation.
- Reports remain read-only.
- Firebase paths and Attendance keys remain compatible.
- Room IDs remain stable.
- Negative Room Stock is not silently clamped.
- Legacy files remain available until explicit production-cutover approval.
