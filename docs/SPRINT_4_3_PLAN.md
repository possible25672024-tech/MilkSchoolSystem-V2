# Sprint 4.3 — Offline Queue Operational UI

Date: 2026-07-28

Completed: 2026-07-29

Branch: `feature/sprint-4.3-offline-queue-ui`

Status: 100% CODE COMPLETE — approved for fast-forward merge into `develop`

## Goal

Add an operational Offline Queue interface to the modular Teacher shell without changing verified QueueStorage, SyncService, SyncManager, Attendance, Room Stock, Main Stock, Firebase, or protected legacy behavior.

Sprint 4.3 adds Teacher-facing queue visibility and retry controls. It does not redesign queue persistence and does not replace `teacher.html`.

## Protected Legacy Files

- `index.html`
- `teacher.html`

Both remained unchanged, operational, and available as rollback paths.

## Runtime Completed

### Sync View

Added:

- `modules/sync/syncView.js`

Implemented:

- online, offline, syncing, pending, failed, deferred, and synchronized banners
- persistent pending count
- maximum attempt count
- last successful sync time
- processed, succeeded, failed/deferred, and remaining summary
- next retry display
- safe queue-item cards
- manual retry through `SyncManager.flushNow("manual-ui")`
- disabled retry while offline, flushing, or empty
- Login, Logout, online/offline, queue-count, and Sync lifecycle rendering
- Teacher-only Sync lifecycle start/stop
- Admin rejection and Logout cleanup
- responsive desktop, tablet, and narrow-layout styling

The View does not access QueueStorage, SyncService, FirebaseService, repositories, fetch, Local Storage, Session Storage, Attendance calculations, stock calculations, ledger construction, or replay logic directly.

### Safe Manager Boundary

Updated:

- `modules/sync/syncManager.js`

Added:

- safe `queueItems` in `getStatus()`
- queue type, room, date/reference, attempts, queued time, next retry time, replay status, and safe error details
- Attendance date extraction from compatible keys
- active `flushing: true` status in `milkapp:sync-started`
- explicit deferred count in generic summaries

Excluded from View-facing summaries:

- student names and Attendance data
- photos and signatures
- encoded media
- complete ledger and stockLog payloads
- authentication or Firebase secrets

### App Integration

Updated:

- `modules/core/app.js`

Initialization order:

1. LoginManager
2. TeacherView
3. AttendanceView
4. SyncView

SyncView is loaded dynamically after the existing Teacher UI foundation.

## Tests Added

- `tests/sync-ui-check.mjs`
- `tests/sync-restart-reconnect-check.mjs`

### UI Test Coverage

- valid SyncView and SyncManager JavaScript
- dependency and App initialization boundary
- no direct queue persistence, Firebase, Repository, fetch, or browser-storage access from the View
- safe summaries exclude student/media payloads
- compatible date/reference display
- manual retry delegation
- overlapping retry protection
- online/offline, pending, failed, deferred, syncing, and synchronized states
- queue count and item rendering
- restored Teacher session startup
- Logout cleanup
- Admin rejection

### Restart/Reconnect Test Coverage

Uses only in-memory persistent storage and mocked services:

- compatible `tc_pending_saves_v1` key
- QueueStorage recreation persistence
- offline startup performs no replay
- recreated Manager performs no replay before reconnect
- sequential reconnect replay
- successful entry removal individually
- Attendance partial save conversion to `roomStockAdjust`
- failed and deferred entry retention
- attempt and next-retry persistence
- later restart persistence
- later reconnect success removes retained entries individually
- Main Stock remains 999
- no Firebase service, repository, or real classroom data

## Automated Gate

Confirmed locally on Node.js 24.18.0:

```text
Sync UI checks passed.
Sync restart/reconnect isolated checks passed.
ALL 18 REGRESSION CHECKS PASSED
```

All foundation, stock, report, room, Teacher, Attendance, Sync, concurrency, audit, documentation, UI, isolated Attendance, and restart/reconnect tests passed.

Feature branch synchronized with origin and working tree clean.

## Browser Gate

Desktop Chrome passed:

- browser queue empty before Teacher Login
- Queue panel rendered with zero pending entries
- synchronized empty state
- retry disabled for empty queue
- Offline transition
- reconnect syncing transition
- reconnect settled back to synchronized
- GET/fetch read-only Network evidence
- no visible PUT, PATCH, or DELETE
- clean Console
- Teacher Logout hides Queue UI
- Admin Login and Logout unchanged

## Responsive Gate

Chrome Device Toolbar at 820 x 1180 passed:

- Attendance and Queue sections remained contained
- Queue banner and summary cards remained readable
- Save, Delete, Retry, and Logout remained reachable
- no abnormal horizontal overflow
- Console remained clean

Physical iPad remains deferred and must not be represented as PASS.

## Business Protection

- Main Stock remains unchanged by all Sync operations.
- Room Stock-only retries remain Room Stock-only.
- Attendance-first partial saves do not rewrite successful Attendance during retry.
- Audit-only retries do not repeat successful Room Stock mutation.
- Repeated queued edits preserve original `baselinePresent` and `queuedAt`.
- Failed and deferred entries remain persistent.
- Successful entries are removed individually.
- Queue replay remains authenticated-room-only.
- Negative Room Stock remains visible and is not clamped.
- Queue storage key remains `tc_pending_saves_v1`.
- Legacy `rec` and `diff` compatibility remains intact.

## Real-Data Incident Quarantine

Room `อ.3-3` / `mqn0z13eyx5b`, date `2026-07-28` remains quarantined.

Sprint 4.3 created no real classroom queue fixture and performed no real queue replay. Recovery remains mandatory before `main`, production cutover, or official use of the affected room/date.

## Merge Decision

Approved for fast-forward merge into `develop`.

This approval does not authorize:

- merge to `main`
- production traffic switching
- replacement of `teacher.html`
- Firebase schema changes
- queue storage-key migration
- legacy-file removal
- closure of the deferred real-data incident

## Next Sprint

Sprint 4.4 — Pending Milk Operational UI

Planned branch:

`feature/sprint-4.4-pending-milk-ui`

Planned scope:

- absent-student eligibility
- pending milk issue command
- Room Stock-only deduction
- duplicate prevention
- legacy-compatible `absentMilk` records
- transaction and audit references
- authenticated-room-only access
- isolated write validation only

Retroactive Milk and Vacation Milk remain out of scope for Sprint 4.4.
