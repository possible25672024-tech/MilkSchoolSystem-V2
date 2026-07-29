# Sprint 4.3 — Offline Queue UI Implementation Report

Date: 2026-07-28

Branch: `feature/sprint-4.3-offline-queue-ui`

Status: IMPLEMENTED / AUTOMATED GATE PASSED / BROWSER VALIDATION PENDING

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

## Test Harness Correction

The first Sync UI run failed on a static assertion that searched only for literal HTML:

```text
id="sync-panel"
```

The Runtime correctly creates the panel programmatically:

```js
panel.id = "sync-panel";
```

The test was corrected to accept both valid creation forms. Runtime, queue persistence, Sync behavior, stock behavior, and Firebase behavior were not changed.

Correction commit:

```text
4e76613 test(sync): accept programmatic Queue panel creation
```

## Automated Validation

Confirmed locally on Node.js 24.18.0:

- Login foundation checks passed
- Stock module checks passed
- Report module checks passed
- Room module checks passed
- Teacher module checks passed
- Attendance module checks passed
- Sync module checks passed
- Firebase request-header checks passed
- Performance module checks passed
- Teacher core-payload checks passed
- Cutover concurrency checks passed
- Audit recovery checks passed
- Cutover documentation checks passed
- Teacher UI shell checks passed
- Attendance UI checks passed
- Attendance isolated write checks passed
- Sync UI checks passed
- `ALL 17 REGRESSION CHECKS PASSED`
- feature branch synchronized with origin
- working tree clean

## Cutover Documentation Compatibility

Updated:

- `tests/cutover-documentation-check.mjs`

The documentation test identifies Sprint 4.3 as active while preserving Sprint 4.2, Sprint 4.1, and Sprint 4.0 as completed integration foundations.

## Safety Boundary

No production Firebase write or real classroom queue fixture was used to implement or validate the automated gate.

The Sync UI test uses in-memory raw entries that deliberately contain fake student/media payloads and verifies that the Manager and View never expose those fields.

The quarantined real classroom record remains unchanged:

- room `อ.3-3`
- room ID `mqn0z13eyx5b`
- date `2026-07-28`

Starting a Teacher Queue session can invoke the existing startup replay when pending entries exist. Browser validation must therefore use an empty queue or a separate isolated browser profile/site-data context.

## Browser Validation Required

Before Teacher Login:

- inspect `tc_pending_saves_v1`
- confirm it is empty, or use a separate browser profile with empty site data
- do not use the quarantined room/date
- do not test Attendance Save or Delete
- do not trigger manual retry or reconnect replay against real pending entries

Desktop checks:

- Admin Login regression
- Teacher Queue panel rendering
- empty queue count and synchronized state
- manual retry disabled for empty queue
- Online/Offline banner transition
- Logout cleanup
- clean Console
- no unexpected Firebase write caused by rendering

Responsive checks at 820 x 1180:

- banner, count, timestamps, summaries, and retry action remain readable
- no sensitive payload exposure
- no abnormal horizontal overflow
- Logout reachable
- clean Console

## Isolated Restart/Reconnect Validation Required

Use only mocked, in-memory, or separate browser-local fixtures:

- queue state survives View recreation
- queue state survives refresh through existing persistence
- offline state performs no replay
- reconnect uses the existing Manager flow
- successful items disappear individually
- failed/deferred entries remain
- attempts and next retry update
- Main Stock remains unchanged

## Current Decision

Sprint 4.3 automated code gate passed.

The branch is not yet eligible for merge into `develop` because browser, responsive, and isolated restart/reconnect gates remain pending.

No authorization is given for:

- real-classroom queue replay
- `main` merge
- production cutover
- replacement of `teacher.html`
- closure of the deferred real-data incident
