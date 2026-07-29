# MilkSchoolSystem-V2

# Sprint Status

Last Update

2026-07-29

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

92% — Runtime, safe Manager summaries, App integration, Queue UI test, all 17 automated regression checks, empty-queue browser safety, Teacher Queue rendering, Offline/reconnect transition, read-only Network evidence, and 820 x 1180 responsive layout passed. Final Console, Admin regression, Teacher Logout cleanup, settled reconnect state, and isolated non-empty restart/reconnect fixtures remain pending.

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

✓ `getStatus()` exposes safe `queueItems`

✓ Safe summaries include queue type, room, date/reference, attempts, queued time, next retry time, status, and safe error details

✓ Per-student Attendance data is not exposed

✓ Photos and signatures are not exposed

✓ Complete ledger and stockLog payloads are not exposed

✓ `milkapp:sync-started` reports `flushing: true`

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

Automated Regression Gate — PASS

The first Sync UI run failed because the static test searched only for literal HTML `id="sync-panel"`, while the Runtime correctly creates the panel programmatically with `panel.id = "sync-panel"`. The test was corrected without changing Runtime behavior.

Confirmed locally on Node.js 24.18.0:

✓ Login foundation checks

✓ Stock module checks

✓ Report module checks

✓ Room module checks

✓ Teacher module checks

✓ Attendance module checks

✓ Sync module checks

✓ Firebase request-header checks

✓ Performance module checks

✓ Teacher core-payload checks

✓ Cutover concurrency checks

✓ Audit recovery checks

✓ Cutover documentation checks

✓ Teacher UI shell checks

✓ Attendance UI checks

✓ Attendance isolated write checks

✓ Sync UI checks

✓ `ALL 17 REGRESSION CHECKS PASSED`

✓ Feature branch synchronized with origin

✓ Working tree clean

---

Browser Safety Gate — PASS

✓ Application Local Storage filtered by `tc_pending_saves_v1`

✓ No matching key or stored queue value was present before Teacher Login

✓ No existing local queue was available for startup replay

✓ Teacher Queue validation proceeded with an empty browser queue

---

Desktop Teacher Queue Browser Evidence — PARTIAL PASS

✓ Queue panel rendered inside the Teacher shell

✓ Pending count displayed 0

✓ Maximum attempts displayed 0

✓ Latest succeeded displayed 0

✓ Failed/deferred displayed 0

✓ Empty queue rendered synchronized state

✓ Empty queue displayed no item details

✓ Manual retry was disabled for the empty queue

✓ Offline transition displayed `ออฟไลน์ · ยังไม่มีรายการค้าง`

✓ Manual retry remained disabled offline

✓ Returning online entered the expected transient syncing state

✓ Visible Network rows were GET/fetch reads only

✓ No visible `PUT`, `PATCH`, or `DELETE` request appeared

Pending:

□ Wait for reconnect to settle back to synchronized

□ Open Console and confirm no JavaScript error

□ Confirm Teacher Logout hides Queue UI

□ Complete Admin Login/Logout regression

---

Responsive Gate at 820 x 1180 — PASS FOR PROVIDED EVIDENCE

✓ Attendance rows remained contained

✓ Save, Delete, and Logout remained reachable

✓ Queue panel remained visible below Attendance

✓ Queue banner and four summary cards remained readable

✓ Last-sync, latest-result, retry-time, empty-detail, and retry-action areas remained contained

✓ No abnormal horizontal overflow was visible

Pending:

□ Console evidence at responsive size

□ Logout action result at responsive size

---

Isolated Restart/Reconnect Gate — Pending

Use only mocked, in-memory, or separate browser-local fixtures:

□ Queue count survives View recreation

□ Queue count survives browser refresh through existing persistence

□ Offline state performs no replay

□ Reconnect starts the existing Manager flow

□ Successful items disappear individually

□ Failed and deferred items remain visible

□ Attempt count and next retry state update

□ Main Stock remains unchanged

No real Firebase queue entry may be created for this gate.

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
