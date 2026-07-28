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

100% — modular Teacher View, role routing, restored-session handling, read-only Room Stock, queue and connection display, Logout delegation, all 14 automated tests, clean working tree, desktop and 820 x 1180 browser validation, Teacher Network gate, explicit Offline/Online transition, Teacher and Admin Console gates, Admin regression, and Logout gates all passed; Sprint 4.1 is approved for fast-forward integration into `develop`

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

✓ Sprint 4.0 Cutover Readiness and Compatibility merged into `develop`

✓ ETag Room Stock protection and recovery foundations available

✓ Production decisions, Teacher UI integration plan, and rollback plan documented

✓ Protected `index.html` and `teacher.html` remain operational

✓ Physical iPad remains deferred and must not be represented as PASS

---

Sprint 4.1 Runtime Completed

✓ Added `modules/teacher/teacherView.js`

✓ Added responsive Teacher shell markup to `index-v2.html`

✓ Added separate Admin and Teacher shell containers

✓ Added school, room, and teacher identity display

✓ Added read-only current Room Stock display

✓ Added online/offline connection badge

✓ Added persistent queue-count display through `SyncManager.getStatus()`

✓ Added Teacher Logout delegated to `LoginManager.logout()`

✓ Added restored Teacher session rendering during App startup

✓ Added Login, Logout, Teacher refresh, Sync, and browser connection event handling

✓ Added Admin session rejection from the Teacher View

✓ Preserved zero and negative Room Stock values without clamping

✓ Kept Firebase, Repository, Local Storage, Session Storage, and stock calculations out of the View

✓ Updated LoginManager role routing without changing credential rules

✓ Updated App initialization order

✓ Added `tests/teacher-ui-shell-check.mjs`

✓ Added `docs/TEACHER_UI_SHELL_VALIDATION_REPORT.md`

✓ `index.html` unchanged

✓ `teacher.html` unchanged

---

Automated Gate

✓ Login foundation checks passed

✓ Stock module checks passed

✓ Report module checks passed

✓ Room module checks passed

✓ Teacher module checks passed

✓ Attendance module checks passed

✓ Sync module checks passed

✓ Firebase request-header checks passed

✓ Performance module checks passed

✓ Teacher core payload checks passed

✓ Cutover concurrency checks passed

✓ Audit recovery checks passed

✓ Cutover documentation checks passed

✓ Teacher UI shell checks passed

✓ Feature branch synchronized with origin

✓ Working tree clean

---

Browser and Responsive Gate

✓ Desktop Teacher Login rendered the modular shell

✓ Desktop Teacher identity and Room Stock displayed correctly

✓ Desktop Teacher core made exactly four successful reads

✓ Desktop Teacher core transfer measured approximately 1.6 KB

✓ No failed application request or Firebase write visible

✓ No full rooms, room-history Attendance, deferred Teacher collection, or Main Stock request during Teacher shell rendering

✓ Desktop Teacher Logout returned to login form

✓ Offline mode changed badge to `ออฟไลน์`

✓ Returning online restored badge to `ออนไลน์`

✓ Teacher and post-Logout Console displayed only `MilkSchoolSystem V2 Started`

✓ 820 x 1180 Teacher Login and Logout passed

✓ Responsive shell remained contained without abnormal horizontal overflow

✓ Desktop Admin Login remained unchanged

✓ Admin shell displayed without Teacher-shell overlap

✓ Admin Console displayed only `MilkSchoolSystem V2 Started`

✓ Admin Logout returned to login form

✓ Admin post-Logout Console remained clean

---

Develop Integration Decision

APPROVED

A fast-forward merge into `develop` is authorized because all Sprint 4.1 branch gates passed.

This approval does not authorize:

- replacement or removal of `teacher.html`
- operational Attendance cutover
- merge or deployment to `main`
- production traffic switching
- Firebase schema changes
- legacy-file removal

---

Next Sprint

Sprint 4.2 — Teacher Daily Attendance CRUD UI

Planned branch:

`feature/sprint-4.2-attendance-daily-ui`

Initial scope:

- date-scoped daily Attendance form
- authenticated-room student list
- present and absent controls
- notes
- load one day
- create, edit, and delete through `AttendanceManager`
- display present/absent totals
- display Room Stock result after save/delete
- partial-save and queued Room Stock status
- no direct Firebase or stock calculation in the View
- desktop and 820 x 1180 validation
- isolated test data only for write validation

Out of scope:

- pending milk
- retroactive milk
- vacation milk
- photos and signatures
- printing and history range views
- replacement or removal of `teacher.html`
- production deployment

---

Current Production Blockers

- Operational Admin UI remains in `index.html`.
- Operational Teacher write workflows remain in `teacher.html`.
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
- Attendance edits change Room Stock by the present-count difference only.
- Attendance deletion restores previously consumed Room Stock.
- ETag conflicts read the latest Room Stock and recalculate before retry.
- Offline retries preserve the original Attendance baseline.
- Audit-only retries never repeat a successful Room Stock mutation.
- Reports remain read-only.
- Firebase paths and Attendance keys remain compatible.
- Room IDs remain stable.
- Negative Room Stock is not silently clamped.
- Legacy files remain available until explicit production-cutover approval.
