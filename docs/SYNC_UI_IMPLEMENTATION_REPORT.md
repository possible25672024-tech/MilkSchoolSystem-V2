# Sprint 4.3 — Offline Queue UI Implementation Report

Date: 2026-07-28

Branch: `feature/sprint-4.3-offline-queue-ui`

Status: IMPLEMENTED / LOCAL VALIDATION PENDING

## Runtime Added

### Sync View

File:

- `modules/sync/syncView.js`

Responsibilities:

- activate only for an authenticated Teacher session
- create the operational Queue panel inside the modular Teacher shell
- display online, offline, syncing, pending, failed, deferred, and synchronized states
- display pending count, maximum attempts, last successful sync time, last summary, and next retry delay
- display safe item-level queue summaries
- delegate manual retry to `SyncManager.flushNow("manual-ui")`
- disable manual retry while offline, already syncing, or when the queue is empty
- react to Login, Logout, browser connection, and SyncManager lifecycle events
- start and stop the existing SyncManager browser lifecycle for Teacher sessions
- clear and hide the Queue UI after Logout
- reject Admin sessions

The View does not access queue persistence, Firebase, repositories, fetch, Local Storage, Session Storage, Attendance calculations, stock calculations, ledger construction, or replay logic.

### Safe Manager Summaries

Updated:

- `modules/sync/syncManager.js`

Added:

- `queueItems` in `SyncManager.getStatus()`
- safe queue-entry summarization
- queue type, room, date/reference, attempts, queue time, next retry time, replay status, and safe error details
- Attendance date extraction from a compatible queue key
- active `flushing: true` state in the `milkapp:sync-started` event
- explicit `deferred: 0` in generic offline/failure summaries

The Manager deliberately excludes:

- per-student Attendance data
- student names contained inside records
- photos
- signatures
- encoded media
- complete ledger payloads
- complete stockLog payloads
- authentication or Firebase secrets

### App Startup

Updated:

- `modules/core/app.js`

The App loads `modules/sync/syncView.js` through a dynamic module import after the existing Login, Teacher, and Attendance Views are initialized, then initializes the Sync View.

This avoids changing the protected legacy files and keeps the existing V2 dependency chain intact.

## UI Structure

The Queue panel includes:

- operational state banner
- pending item count
- maximum attempt count
- latest succeeded count
- latest failed/deferred count
- last successful sync time
- latest processing summary
- next retry delay
- safe queue-item cards
- safe error code/message display
- manual retry button

Responsive rules are injected with the View and cover desktop, tablet, and narrow layouts.

## Test Added

File:

- `tests/sync-ui-check.mjs`

Coverage:

- valid SyncView and SyncManager JavaScript
- SyncManager loaded before App
- dynamic SyncView loading and initialization
- no direct persistence, Firebase, Repository, fetch, or browser-storage access from the View
- manual retry delegation
- safe queue summaries exclude student/media payloads
- compatible date/reference visibility
- failed queue status visibility
- one in-flight operation for overlapping retries
- `sync-started` exposes active flushing state
- restored Teacher session starts the existing Sync lifecycle
- queue count and item rendering
- offline state and disabled retry
- online pending state and enabled retry
- successful manual retry state
- syncing state and disabled retry
- Logout cleanup
- Admin session rejection

## Cutover Documentation Compatibility

Updated:

- `tests/cutover-documentation-check.mjs`

The documentation test now identifies Sprint 4.3 as active while preserving Sprint 4.2, Sprint 4.1, and Sprint 4.0 as completed integration foundations.

## Safety Boundary

No production Firebase write or real classroom queue fixture was used to implement this change.

The new test uses in-memory raw entries that deliberately contain fake student/media payloads and verifies that the Manager and View never expose those fields.

The quarantined real classroom record remains unchanged:

- room `อ.3-3`
- room ID `mqn0z13eyx5b`
- date `2026-07-28`

Do not open the new Queue UI against the connected classroom database until automated validation passes and the current browser queue count is confirmed safe. Starting a Teacher Queue session can invoke the existing startup replay when pending entries exist.

## Validation Required

Run the new test first:

```powershell
node tests/sync-ui-check.mjs
```

Then run the complete 17-test regression gate.

Do not perform Browser Save, Delete, Queue replay, reconnect replay, or manual retry against real classroom data during this validation stage.

## Current Decision

Runtime implementation is ready for local automated validation.

Browser and responsive gates remain pending and must use an empty queue or a fully isolated browser/Firebase target before any replay action is permitted.
