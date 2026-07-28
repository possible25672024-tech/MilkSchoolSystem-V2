# MilkSchoolSystem-V2

# Sprint Status

Last Update

2026-07-28

---

Current Branch

feature/sprint-4.3-offline-queue-ui

---

Current Version

V2

---

Current Sprint

Sprint 4.3 — Offline Queue Operational UI

Status

70% — Sync View, safe Manager summaries, dynamic App integration, operational UI tests, implementation report, and Cutover documentation compatibility are implemented. Local 17-test regression, isolated restart/reconnect fixtures, desktop browser validation, and 820 x 1180 responsive validation remain pending.

---

Completed Foundation

✓ Sprint 3.4.2 Recovery merged into `develop`

✓ Sprint 3.4.3 Stock Module merged into `develop`

✓ Sprint 3.4.4 Report Module merged into `develop`

✓ Sprint 3.5 Room Module merged into `develop`

✓ Sprint 3.6 Teacher Service Foundation merged into `develop`

✓ Sprint 3.7 Attendance Service Foundation merged into `develop`

✓ Sprint 3.8 Offline Queue and Sync Module merged into `develop`

✓ Sprint 3.9 Performance and Payload Optimization merged into `develop`

✓ Sprint 4.0 Cutover Readiness and Compatibility merged into `develop`

✓ Sprint 4.1 Teacher UI Shell and Read-Only State merged into `develop`

✓ Sprint 4.2 Teacher Daily Attendance CRUD UI fast-forward merged into `develop`

✓ Protected `index.html` and `teacher.html` remain operational

✓ Physical iPad remains deferred and must not be represented as PASS

---

Sprint 4.3 Runtime Implemented

✓ Added `modules/sync/syncView.js`

✓ Added operational online/offline/syncing banner

✓ Added persistent queue count and maximum-attempt display

✓ Added last successful sync time

✓ Added processed, succeeded, failed/deferred, and remaining summary

✓ Added next retry delay display

✓ Added safe item-level queue summaries

✓ Added manual retry through `SyncManager.flushNow("manual-ui")`

✓ Disabled manual retry while offline

✓ Disabled manual retry while flushing

✓ Disabled manual retry when no queue item remains

✓ Added Login, Logout, connection, and Sync lifecycle event rendering

✓ Added Teacher-only Sync lifecycle start/stop

✓ Added Logout cleanup and Admin rejection

✓ Added responsive Queue panel styles

---

SyncManager Boundary Updated

✓ `getStatus()` now exposes safe `queueItems`

✓ Safe summaries include queue type, room, date/reference, attempts, queued time, next retry time, status, and safe error details

✓ Per-student Attendance data is not exposed

✓ Photos and signatures are not exposed

✓ Complete ledger and stockLog payloads are not exposed

✓ `milkapp:sync-started` now reports `flushing: true`

✓ Overlapping flushes continue to share one in-flight operation

✓ Main Stock behavior remains unchanged

---

App Integration Implemented

✓ App dynamically loads `modules/sync/syncView.js`

✓ LoginManager initializes first

✓ TeacherView initializes second

✓ AttendanceView initializes third

✓ SyncView initializes after the existing Teacher UI foundation

✓ Protected legacy files remain unchanged

---

Automated Test Added

✓ Added `tests/sync-ui-check.mjs`

Coverage implemented:

✓ valid SyncView and SyncManager JavaScript

✓ App loading and initialization boundary

✓ no direct queue persistence access from the View

✓ no direct Firebase, Repository, fetch, Local Storage, or Session Storage access

✓ safe summaries exclude fake student/media payloads

✓ manual retry delegation

✓ overlapping retry protection

✓ flushing state visibility

✓ restored Teacher-session activation

✓ online/offline rendering

✓ queue count and queue-item rendering

✓ successful manual retry rendering

✓ Logout cleanup

✓ Admin session rejection

---

Cutover Documentation Compatibility

✓ Active Sprint assertion updated to Sprint 4.3

✓ Sprint 4.2 Attendance UI foundation remains recorded

✓ Sprint 4.1 Teacher shell foundation remains recorded

✓ Sprint 4.0 Cutover foundation remains recorded

✓ Production readiness remains blocked

---

Local Automated Gate — Pending

Run the new test first:

```powershell
node tests/sync-ui-check.mjs
```

Then run the complete regression gate:

□ Login foundation checks

□ Stock module checks

□ Report module checks

□ Room module checks

□ Teacher module checks

□ Attendance module checks

□ Sync module checks

□ Firebase request-header checks

□ Performance module checks

□ Teacher core-payload checks

□ Cutover concurrency checks

□ Audit recovery checks

□ Cutover documentation checks

□ Teacher UI shell checks

□ Attendance UI checks

□ Attendance isolated write checks

□ Sync UI checks

Expected total: 17 tests.

---

Browser Safety Gate — Not Started

Do not open the new Teacher Queue UI against the connected classroom database yet.

Activating a Teacher Sync session can invoke the existing startup replay when a pending browser queue exists.

Before Browser validation:

□ Automated 17-test gate passes

□ Browser queue count is verified

□ Use an empty queue or fully isolated browser/Firebase target

□ Do not press Save, Delete, manual retry, or trigger reconnect replay against real classroom data

---

Browser Gate — Pending

Desktop Chrome:

□ Admin Login remains unchanged

□ Teacher Login renders Queue UI

□ Online/offline banner is accurate

□ Queue count agrees with SyncManager

□ Manual retry disabled offline and while flushing

□ Manual retry delegates safely in an isolated target

□ Success/failure/deferred summaries render

□ Logout clears Queue UI

□ Console clean

□ No unexpected Firebase write occurs from rendering

Chrome Device Toolbar at 820 x 1180:

□ Banner, count, last sync, retry, and item summaries remain readable

□ No sensitive payload is exposed

□ No abnormal horizontal overflow

□ Logout remains reachable

□ Console clean

---

Deferred Real-Classroom Incident — OPEN

Quarantined:

- room `อ.3-3`
- room ID `mqn0z13eyx5b`
- date `2026-07-28`
- Attendance 22 present / 3 absent
- Room Stock 1,253 versus recorded pre-test 1,275
- known discrepancy -22

Rules:

- do not use the quarantined room/date for Queue or write tests
- do not use its values as trusted operational evidence
- do not manually edit Attendance, Room Stock, Main Stock, queue, ledger, stockLog, or transaction history
- recovery remains mandatory before `main` or production cutover

---

Out of Scope

- Pending Milk operational form
- Retroactive Milk operational form
- Vacation Milk operational form
- photos and signatures
- Attendance history and printing
- Report UI
- Admin operational UI
- Firebase schema changes
- queue storage-key migration
- replacement or removal of `teacher.html`
- production deployment
- real-classroom write tests

---

Protected Business Rules

- Main Stock decreases only on classroom distribution.
- Classroom distribution increases Room Stock.
- Teacher, Attendance, and Sync operations change Room Stock only.
- Attendance edits change Room Stock by the present-count difference only.
- Attendance deletion restores previously consumed Room Stock.
- ETag conflicts read the latest Room Stock and recalculate before retry.
- Offline retries preserve the original Attendance baseline.
- Repeated queued edits preserve the original baseline and queued time.
- Successful queue items are removed individually.
- Failed and deferred queue items remain persistent.
- Audit-only retries never repeat a successful Room Stock mutation.
- Queue storage key remains `tc_pending_saves_v1`.
- Legacy `rec` and `diff` compatibility remains intact.
- Negative Room Stock is not silently clamped.
- Legacy files remain available until explicit production-cutover approval.
