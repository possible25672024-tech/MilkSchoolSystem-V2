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

10% — Sprint plan initialized from the completed Sprint 4.2 Attendance UI foundation; Sync View implementation, UI tests, restart/reconnect fixtures, browser validation, and responsive validation have not started

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

Sprint 4.2 Completed Evidence

✓ Modular Attendance View

✓ Date-scoped authenticated-room loading

✓ Present/absent and notes controls

✓ Create/edit/delete Manager delegation

✓ Room Stock result, ETag conflict, queue, and audit feedback

✓ Complete in-memory create/edit-up/edit-down/delete validation

✓ Main Stock unchanged in isolated validation

✓ Partial-save queue simulation

✓ All 16 regression checks accepted as passed

✓ Desktop exact-date Network gate passed

✓ Complete 820 x 1180 Attendance interaction passed

✓ Feature branch synchronized and working tree clean

✓ `index.html` and `teacher.html` unchanged

---

Sprint 4.3 Goal

Add an operational Offline Queue interface to the modular Teacher shell without changing QueueStorage persistence, Sync replay, Attendance, Room Stock, Main Stock, Firebase, or protected legacy behavior.

---

Sprint 4.3 In Scope

□ Operational online/offline/syncing banner

□ Persistent queue item count

□ Maximum attempt count

□ Last successful sync time

□ Last processed, succeeded, failed, deferred, and remaining totals

□ Next retry delay

□ Safe item-level queue summaries

□ Manual retry delegated to `SyncManager.flushNow("manual-ui")`

□ Manual retry disabled while offline

□ Manual retry disabled while already flushing

□ Restart and View-recreation state restoration

□ Reconnect validation

□ Success removal and failed/deferred retention display

□ Desktop browser validation

□ Chrome Device Toolbar validation at 820 x 1180

---

Existing Sync Boundary

SyncManager already owns:

- startup and reconnect flow
- periodic and retry scheduling
- online/offline detection
- overlapping-flush protection
- last summary and last successful sync time
- queue-count and sync lifecycle events

SyncService already owns:

- `attendance`, `roomStockAdjust`, and `attendanceAudit` queue types
- sequential replay
- failure retention
- deferred conversion
- bounded backoff
- queue entries, count, and maximum attempts

Sprint 4.3 must consume these existing boundaries rather than duplicate them.

---

Sprint 4.3 Architecture Rules

- View owns DOM rendering and browser interaction only.
- View calls SyncManager and subscribes to events.
- View does not access QueueStorage directly.
- View does not access Firebase or Repositories directly.
- View does not call `fetch()`.
- View does not access Local Storage or Session Storage.
- View does not mutate, remove, convert, or replay queue entries.
- View does not calculate Attendance or stock differences.
- View does not build ledger or stockLog records.
- Main Stock remains unchanged.
- Sensitive Attendance/media payloads must not be displayed.

---

Planned Runtime File

□ `modules/sync/syncView.js`

Do not create new QueueStorage, Service, or Repository modules unless a measured missing boundary is identified.

---

Planned Test

□ `tests/sync-ui-check.mjs`

Required coverage:

- valid JavaScript
- dependency order
- no direct QueueStorage/Firebase/Repository/storage access
- no direct replay or mutation
- online/offline rendering
- queue count and last-sync rendering
- syncing, success, failed, and deferred states
- safe item summaries
- manual retry delegation and disabled states
- overlapping-flush protection
- Admin session rejection
- cleanup after Logout

---

Isolated Queue Fixtures

□ Legacy Attendance entry using `rec`

□ Legacy Room Stock entry using `diff`

□ Repeated Attendance edits preserving original `baselinePresent`

□ Mixed valid and corrupt entries

□ Successful entry

□ Failed entry with attempts and next retry

□ Attendance partial save converted to `roomStockAdjust`

□ Successful Room Stock update converted to `attendanceAudit`

□ Queue state before and after View recreation

No production Firebase or real-classroom queue writes are allowed.

---

Automated Regression Gate

Existing 16 tests remain mandatory, plus:

□ `node tests/sync-ui-check.mjs`

Total expected Sprint gate: 17 tests.

---

Browser Gate

Desktop Chrome:

□ Admin Login remains unchanged

□ Teacher Login renders Queue UI

□ Online/offline banner is accurate

□ Queue count agrees with SyncManager

□ Manual retry disabled offline and while flushing

□ Manual retry delegates through SyncManager

□ Success/failure/deferred summaries render

□ Logout clears Queue UI

□ Console clean

□ No unexpected Firebase write caused by rendering

Chrome Device Toolbar at 820 x 1180:

□ Banner, count, last sync, and retry action remain readable

□ Item summaries remain contained

□ No sensitive payload is exposed

□ No abnormal horizontal overflow

□ Logout remains reachable

□ Console clean

Physical iPad remains deferred and must not be represented as PASS.

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
- do not manually edit its Attendance, Room Stock, Main Stock, queue, ledger, stockLog, or history
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
