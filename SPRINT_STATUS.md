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

100% CODE COMPLETE — Runtime, safe Manager summaries, App integration, all 18 automated regression checks, isolated non-empty restart/reconnect validation, empty-queue browser safety, Teacher Queue rendering, Offline/reconnect transitions, settled synchronized state, read-only Network evidence, clean Console, Teacher and Admin Logout regression, and 820 x 1180 responsive layout passed. Approved for fast-forward merge into `develop`.

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

Sprint 4.3 Runtime Completed

✓ Added `modules/sync/syncView.js`

✓ Added online, offline, syncing, pending, failed, deferred, and synchronized states

✓ Added pending count, maximum attempts, last successful sync, latest summary, and next retry display

✓ Added safe item-level summaries without student, photo, signature, ledger, or stockLog payload exposure

✓ Added manual retry through `SyncManager.flushNow("manual-ui")`

✓ Disabled manual retry while offline, flushing, or empty

✓ Added Teacher-only Sync lifecycle start/stop

✓ Added Login, Logout, online/offline, queue-count, and Sync lifecycle rendering

✓ Added responsive Queue panel styles

✓ App initializes SyncView after Login, Teacher, and Attendance Views

✓ View does not access QueueStorage, SyncService, Firebase, Repository, fetch, Local Storage, or Session Storage directly

✓ Main Stock remains unchanged by Sync workflows

✓ `index.html` unchanged

✓ `teacher.html` unchanged

---

Automated Regression Gate — PASS

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

✓ Sync restart/reconnect isolated checks

✓ `ALL 18 REGRESSION CHECKS PASSED`

✓ Feature branch synchronized with origin

✓ Working tree clean

---

Isolated Restart/Reconnect Gate — PASS

In-memory persistent storage and mocked services only:

✓ Queue key remains `tc_pending_saves_v1`

✓ Queue survives QueueStorage recreation

✓ Offline startup performs no replay

✓ Recreated offline Manager performs no replay before reconnect

✓ Reconnect replays entries sequentially

✓ Successful Attendance entry disappears individually

✓ Attendance partial save converts to Room Stock-only deferred work

✓ Failed Room Stock entry remains persistent

✓ Failed/deferred attempts and next-retry times persist

✓ Failed/deferred entries survive a later restart

✓ Later reconnect removes retained entries individually after success

✓ Main Stock remains 999 throughout

✓ No Firebase service, repository, or real classroom data was used

---

Browser and Responsive Gates — PASS

✓ Browser queue was empty before Teacher Login

✓ No existing browser queue was available for startup replay

✓ Queue panel rendered with zero pending items

✓ Empty queue rendered synchronized state

✓ Manual retry remained disabled for an empty queue

✓ Offline banner rendered correctly

✓ Reconnect entered syncing state and settled back to synchronized

✓ Network evidence showed read-only GET/fetch traffic

✓ No visible `PUT`, `PATCH`, or `DELETE` request appeared

✓ Console contained no JavaScript error

✓ Teacher Logout returned to Login and hid Queue UI

✓ Admin Login rendered the existing Admin shell

✓ Admin Logout returned to Login

✓ 820 x 1180 Queue and Attendance layout remained contained

✓ No abnormal horizontal overflow was visible

---

Integration Decision

APPROVED FOR FAST-FORWARD MERGE INTO `develop`

NOT APPROVED FOR:

- merge to `main`
- production traffic switching
- replacement or removal of `teacher.html`
- Firebase schema changes
- queue storage-key migration
- official use of the quarantined room/date
- claiming the Firebase database is fully reconciled

---

Next Sprint

Sprint 4.4 — Pending Milk Operational UI

Planned branch:

`feature/sprint-4.4-pending-milk-ui`

Planned boundary:

- show absent students eligible for pending milk
- issue pending milk through a dedicated Manager/Service path
- deduct Room Stock only
- prevent duplicate issue for the same student/date/reference
- preserve legacy-compatible `absentMilk` records and audit references
- use authenticated-room-only access
- use isolated write validation only
- do not implement Retroactive or Vacation Milk in this Sprint

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

Protected Business Rules

- Main Stock decreases only on classroom distribution.
- Classroom distribution increases Room Stock.
- Teacher, Attendance, Pending, Retroactive, Vacation, and Sync workflows change Room Stock only.
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
