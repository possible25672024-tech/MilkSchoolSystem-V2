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

92% — modular Teacher View, role routing, restored-session handling, read-only Room Stock, queue and connection display, Logout delegation, all 14 automated tests, clean working tree, complete 820 x 1180 Teacher Login/Logout evidence, desktop Teacher Login/Logout, and Teacher Fetch/XHR gate passed; desktop Admin regression, explicit Offline/Online transition, and desktop Console evidence remain pending

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

✓ Desktop and 820 x 1180 Login/Logout cutover evidence recorded

✓ Production decisions, Teacher UI integration plan, and rollback plan documented

✓ Protected `index.html` and `teacher.html` remain operational

✓ Physical iPad remains deferred and must not be represented as PASS

---

Sprint 4.1 Implemented

✓ Added `modules/teacher/teacherView.js`

✓ Added responsive Teacher shell markup to `index-v2.html`

✓ Added separate Admin and Teacher shell containers

✓ Added school, room, and teacher identity display

✓ Added read-only current Room Stock display

✓ Added online/offline connection badge

✓ Added persistent queue-count display through `SyncManager.getStatus()`

✓ Added Teacher Logout action delegated to `LoginManager.logout()`

✓ Added restored Teacher session rendering during App startup

✓ Added `milkapp:login-success` activation

✓ Added `milkapp:logout` cleanup

✓ Added Teacher refresh event rendering

✓ Added Sync and browser network event rendering

✓ Added Admin session rejection from the Teacher View

✓ Preserved zero and negative Room Stock values without clamping

✓ Kept Firebase, Repository, Local Storage, Session Storage, and stock calculations out of the View

✓ Updated LoginManager role routing without changing credential rules

✓ Updated App to initialize TeacherView after LoginManager

✓ Added `tests/teacher-ui-shell-check.mjs`

✓ Added `docs/TEACHER_UI_SHELL_VALIDATION_REPORT.md`

✓ Updated Cutover documentation regression checks for the active Sprint

✓ Preserved completed Sprint 4.0 marker required by the existing performance regression

✓ `index.html` unchanged

✓ `teacher.html` unchanged

---

Sprint 4.1 Architecture Rules

- View owns DOM rendering and browser interaction only.
- View calls Managers and subscribes to events.
- View does not access Firebase directly.
- View does not access Repositories directly.
- View does not call `fetch()`.
- View does not own Local Storage or Session Storage.
- View does not calculate Main Stock or Room Stock deltas.
- Room Stock is display-only.
- Negative Room Stock remains visible.
- Queue count comes from the existing persistent queue boundary.
- Logout delegates through the existing Login/Auth boundary.
- Teacher data remains limited to the authenticated room.
- Normal Teacher refresh remains date-scoped and excludes full history and deferred collections.

---

Automated Gate

✓ `node tests/login-foundation-check.mjs`

✓ `node tests/stock-module-check.mjs`

✓ `node tests/report-module-check.mjs`

✓ `node tests/room-module-check.mjs`

✓ `node tests/teacher-module-check.mjs`

✓ `node tests/attendance-module-check.mjs`

✓ `node tests/sync-module-check.mjs`

✓ `node tests/firebase-request-header-check.mjs`

✓ `node tests/performance-module-check.mjs`

✓ `node tests/teacher-core-payload-check.mjs`

✓ `node tests/cutover-concurrency-check.mjs`

✓ `node tests/audit-recovery-check.mjs`

✓ `node tests/cutover-documentation-check.mjs`

✓ `node tests/teacher-ui-shell-check.mjs`

✓ Feature branch synchronized with origin

✓ Working tree clean

---

Responsive Browser Gate — 820 x 1180

✓ Teacher Login rendered the modular Teacher shell

✓ School name displayed correctly

✓ Room displayed as `อ.3-2`

✓ Teacher identity displayed correctly

✓ Current Room Stock displayed as `1,073 กล่อง`

✓ Pending queue count displayed as `0 รายการ`

✓ Online badge displayed correctly

✓ Teacher shell remained contained

✓ Header, identity cards, and metrics remained readable

✓ Logout remained visible and usable

✓ Logout returned to the login form

✓ Room/role selector reset after Logout

✓ Password field returned empty

✓ No abnormal horizontal overflow visible

✓ Console displayed only `MilkSchoolSystem V2 Started`

✓ No visible application error or warning

---

Desktop Teacher and Network Gate

✓ Desktop Teacher Login rendered the modular shell

✓ School name displayed correctly

✓ Room displayed as `อ.3-1`

✓ Teacher identity displayed correctly

✓ Current Room Stock displayed as `962 กล่อง`

✓ Pending queue count displayed as `0 รายการ`

✓ Online badge displayed correctly

✓ Teacher shell made exactly four visible read requests

✓ Today's Attendance `data.json` returned HTTP 200

✓ `settings.json` returned HTTP 200

✓ Authenticated Room Stock returned HTTP 200

✓ `updatedAt.json` returned HTTP 200

✓ Teacher core transfer measured approximately 1.6 KB

✓ No failed application request visible

✓ No Firebase write request visible

✓ No full `rooms.json` request during Teacher shell rendering

✓ No room-history Attendance request

✓ No deferred Teacher collection request

✓ No Main Stock request

✓ Desktop Logout returned to the login form

✓ Post-Logout `settings.json` and `rooms.json` loaded successfully to rebuild the login selector

✓ Post-Logout room loading is documented as expected and separate from Teacher core refresh

---

Pending Final Desktop Gate

□ Admin Login remains unchanged after Sprint 4.1 role routing

□ Admin Logout returns to the login form

□ DevTools Offline mode changes the badge to `ออฟไลน์`

□ Returning Online restores the badge to `ออนไลน์`

□ Desktop Console clean for Admin Login

□ Desktop Console clean for Teacher Login

□ Desktop Console clean after Logout

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
