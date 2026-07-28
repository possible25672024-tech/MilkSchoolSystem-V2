# Sprint 4.3 — Offline Queue Operational UI

Date: 2026-07-28

Branch: `feature/sprint-4.3-offline-queue-ui`

Status: 10% — plan initialized; runtime implementation not started

## Goal

Add an operational Offline Queue interface to the modular Teacher shell without changing the verified QueueStorage, SyncService, SyncManager, Attendance, Room Stock, Main Stock, Firebase, or protected legacy behavior.

Sprint 4.3 implements Teacher-facing queue visibility and retry controls. It does not redesign queue persistence and does not replace `teacher.html`.

## Protected Legacy Files

- `index.html`
- `teacher.html`

Both files remain unchanged, operational, and available as rollback paths.

## Existing Sync Boundary

Sprint 4.3 must consume the existing behavior rather than duplicating it.

### SyncManager

Available state and commands:

- `start()` and `stop()`
- `getStatus()`
- `flushNow(reason)`
- online/offline detection
- overlapping-flush protection
- startup, reconnect, periodic, and retry scheduling
- `lastSyncedAt`
- `lastSummary`

Available events:

- `milkapp:sync-online`
- `milkapp:sync-offline`
- `milkapp:sync-started`
- `milkapp:sync-completed`
- `milkapp:sync-failed`
- `milkapp:sync-queue-count`

### SyncService

Available queue state:

- total count
- queue entries
- maximum attempts
- successful, failed, and deferred replay results
- next retry delay
- `attendance`
- `roomStockAdjust`
- `attendanceAudit`

### Queue Compatibility

Must preserve:

- storage key `tc_pending_saves_v1`
- legacy `rec` normalization
- legacy `diff` normalization
- corrupt-entry filtering
- latest Attendance record with original `baselinePresent`
- original `queuedAt` on repeated edits
- individual success removal
- failed-entry retention
- bounded retry backoff
- sequential replay
- Room Stock-only conversion after Attendance-first partial save
- audit-only conversion without repeating Room Stock

## In Scope

### Offline Banner

Display:

- online
- offline
- syncing
- retry scheduled
- failed
- deferred audit/stock work
- synchronized/no pending work

The banner must react to SyncManager and browser connection events.

### Queue Summary

Display:

- pending item count
- maximum attempt count
- last successful sync time
- last processed, succeeded, failed, deferred, and remaining totals
- next retry delay when available

### Queue Item Summary

Display safe metadata only:

- queue type
- room name or room ID
- Attendance date or reference
- attempts
- queued time
- next retry time
- current status
- safe error code and message

Do not display:

- student names
- full Attendance records
- photos
- signatures
- encoded media
- Firebase credentials
- session secrets
- complete ledger or stockLog payloads

### Manual Retry

Add one Teacher action that delegates to:

```js
SyncManager.flushNow("manual-ui")
```

Requirements:

- disabled while offline
- disabled while a flush is active
- repeated clicks must reuse overlapping-flush protection
- result status must come from SyncManager events/results
- View must not replay entries directly
- View must not remove or edit queue entries directly

### Restart and Reconnect State

Verify:

- queue count survives View recreation
- queue count survives browser refresh through existing persistence
- startup status renders from existing queue state
- offline state does not attempt network replay
- reconnect triggers the existing Manager flow
- successful items disappear individually
- failed/deferred items remain visible

## Planned Runtime File

- `modules/sync/syncView.js`

Do not create new QueueStorage, Service, or Repository modules unless a measured missing boundary is identified.

A small read-only Manager helper may be added only when safe queue summaries cannot be produced through the existing `SyncManager.getStatus()` boundary.

## Architecture Rules

The View may:

- render queue status
- format timestamps and retry durations
- call `SyncManager.getStatus()`
- call `SyncManager.flushNow("manual-ui")`
- subscribe to SyncManager and browser events
- emit UI-only interaction events

The View must not:

- access QueueStorage directly
- access SyncService directly when SyncManager already exposes the needed command/state
- access FirebaseService or any Repository
- call `fetch()`
- access Local Storage or Session Storage
- mutate queue entries
- replay queue items
- calculate Attendance or stock differences
- build ledger or stockLog records
- change Main Stock
- expose sensitive payload data

## Business Protection

- Main Stock remains unchanged by all Sync operations.
- Room Stock-only retries stay Room Stock-only.
- Attendance-first partial saves must not rewrite successful Attendance during retry.
- Audit-only retries must not repeat successful Room Stock mutation.
- Repeated queued edits preserve the original baseline present count.
- Failed and deferred entries remain persistent.
- Successful entries are removed individually.
- Queue item replay remains authenticated-room-only.
- Negative Room Stock remains visible and is not clamped.

## Real-Data Incident Quarantine

Room `อ.3-3` / `mqn0z13eyx5b`, date `2026-07-28` remains quarantined.

Sprint 4.3 must not:

- create or replay real writes for the quarantined room/date
- use the quarantined values as trusted queue or report evidence
- manually edit its Room Stock, Attendance, ledger, stockLog, or queue

All Sprint 4.3 mutation validation must use mocked or in-memory queue data.

## Planned Test File

- `tests/sync-ui-check.mjs`

Required coverage:

- valid JavaScript
- dependency order in `index-v2.html`
- no direct QueueStorage access
- no direct Firebase or Repository access
- no `fetch()`
- no Local Storage or Session Storage access
- no direct queue mutation or replay
- online/offline rendering
- queue count rendering
- last-sync rendering
- retrying, failed, deferred, and synchronized states
- safe item summaries without media/student payload exposure
- manual retry delegation
- manual retry disabled offline
- manual retry disabled while flushing
- overlapping calls remain protected by SyncManager
- Admin session rejection
- shell cleanup after Logout

## Isolated Queue Fixtures

Use only in-memory fixtures:

- one legacy Attendance entry using `rec`
- one legacy Room Stock entry using `diff`
- repeated Attendance edits with original `baselinePresent`
- one corrupt entry mixed with valid entries
- one successful entry
- one failed entry with attempts and next retry time
- one Attendance-first partial save converted to `roomStockAdjust`
- one successful Room Stock update converted to `attendanceAudit`
- queue state before and after View recreation

No production Firebase or real classroom queue writes are allowed.

## Automated Regression Gate

Existing 16 tests remain mandatory:

```powershell
node tests/login-foundation-check.mjs
node tests/stock-module-check.mjs
node tests/report-module-check.mjs
node tests/room-module-check.mjs
node tests/teacher-module-check.mjs
node tests/attendance-module-check.mjs
node tests/sync-module-check.mjs
node tests/firebase-request-header-check.mjs
node tests/performance-module-check.mjs
node tests/teacher-core-payload-check.mjs
node tests/cutover-concurrency-check.mjs
node tests/audit-recovery-check.mjs
node tests/cutover-documentation-check.mjs
node tests/teacher-ui-shell-check.mjs
node tests/attendance-ui-check.mjs
node tests/attendance-isolated-write-check.mjs
```

New Sprint test:

```powershell
node tests/sync-ui-check.mjs
```

## Browser Gate

Desktop Chrome:

- Admin Login remains unchanged
- Teacher Login renders Queue UI
- online/offline banner is correct
- queue count agrees with SyncManager status
- manual retry is disabled offline
- manual retry is disabled while syncing
- manual retry delegates through SyncManager
- success/failure/deferred summaries render
- Logout clears Queue UI
- Console clean
- no unexpected Firebase write caused by rendering

Chrome Device Toolbar at 820 x 1180:

- banner remains readable
- queue count and last-sync time remain visible
- manual retry remains reachable
- item summaries remain contained
- no sensitive payload is exposed
- no abnormal horizontal overflow
- Logout remains reachable
- Console clean

Physical iPad remains deferred and must not be represented as PASS.

## Restart and Reconnect Gate

Using in-memory/mock or approved browser-local fixtures only:

- render pending queue
- recreate/reload the View
- confirm persisted count/status returns
- switch offline and confirm no replay
- return online and confirm existing reconnect flow starts
- successful items disappear individually
- failed/deferred entries remain
- attempt and next retry state update
- Main Stock remains unchanged

## Out of Scope

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

## Merge Gate

Sprint 4.3 may merge into `develop` when:

- Sync View uses Manager/events only
- no direct QueueStorage, Firebase, Repository, or storage access exists in the View
- online/offline, pending, syncing, failed, deferred, and completed states render correctly
- manual retry delegates safely
- safe item summaries expose no sensitive payloads
- restart and reconnect fixtures pass
- all 17 automated tests pass
- desktop browser gate passes
- 820 x 1180 responsive gate passes
- Console is clean
- working tree is clean
- `index.html` and `teacher.html` remain unchanged

## Production Meaning

A Sprint 4.3 merge into `develop` does not authorize:

- replacement of `teacher.html`
- pending, retroactive, vacation, media, or printing cutover
- merge to `main`
- production traffic switching
- Firebase schema changes
- queue storage-key migration
- legacy-file removal
- closure of the deferred real-data incident
