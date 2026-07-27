# Sprint 3.8 — Offline Queue and Sync Migration Gap Report

Date: 2026-07-27

Branch: `feature/sprint-3.8-offline-sync`

## Summary

Sprint 3.8 extracts the verified persistent teacher offline queue into modular V2 boundaries while leaving the operational `teacher.html` implementation unchanged.

Implemented modules:

- `modules/storage/queueStorage.js`
- `modules/services/syncService.js`
- `modules/sync/syncManager.js`

The modular queue uses the compatible storage key `tc_pending_saves_v1` and supports both the legacy field aliases (`rec`, `diff`) and the canonical V2 fields (`record`, `difference`).

## Completed Boundaries

### QueueStorage

- persistent browser storage
- empty queue recovery
- individual invalid-entry filtering
- attendance and Room Stock adjustment entry normalization
- duplicate attendance replacement by queue key
- preservation of the original unsynced `baselinePresent`
- preservation of the first queue timestamp
- retry-attempt reset after a newer edit
- individual successful-entry removal
- queue count and snapshot reads

### SyncService

- Teacher session validation through `TeacherService`
- authenticated-room-only queue creation and replay
- attendance replay through `AttendanceService.saveAttendance`
- Room Stock-only adjustment replay through `AttendanceService.adjustRoomStock`
- sequential replay
- individual success removal
- failed-entry retention
- attempt increments and next-retry timestamps
- bounded backoff: 5, 10, 20, 40, then 60 seconds
- sync summaries with `mainStockDelta: 0`

### SyncManager

- online and offline listener registration
- reconnect flush
- startup flush when queued data exists
- periodic online flush every 60 seconds
- overlapping-flush prevention
- retry timer scheduling
- queue-count and sync lifecycle events
- UI-safe queue status boundary

## Business Rules Preserved

- Attendance keys remain `{roomId}_{YYYY-MM-DD}`.
- Queue replay is restricted to the room in the authenticated Teacher session.
- Repeated offline edits preserve the first unsynced baseline.
- Attendance replay uses the same present-count difference rule as an online save.
- A Room Stock adjustment retry does not rewrite the attendance record.
- Main Stock is never included in Sync updates.
- Negative Room Stock remains visible and is not clamped.
- Failed entries remain queued.
- Successful entries are removed individually.
- Valid entries survive beside invalid entries in the stored queue.

## Remaining Gap: Cross-device Room Stock Concurrency

The legacy `teacher.html` Room Stock path uses Firebase REST ETag reads and conditional `if-match` writes with retry on HTTP 412. The modular Attendance and Sync services currently use one multi-location PATCH for the included Attendance, Room Stock, ledger, and stock-log paths.

The PATCH is atomic for the paths in that request, but it does not compare the Room Stock value against an ETag before writing. Therefore Sprint 3.8 does not claim strict optimistic-concurrency protection when multiple devices update the same Room Stock simultaneously.

This must be resolved before the modular V2 flow replaces the operational teacher attendance workflow. Candidate approaches:

1. Add an ETag-aware repository method and preserve eventual reconciliation for the other paths.
2. Move the stock mutation to a trusted server transaction boundary.
3. Add conflict detection and a repair queue backed by the stock ledger.

No approach should be selected without explicit tests for simultaneous writes, duplicate retries, and partial network failure.

## Remaining Gap: Operational UI Integration

The current operational form, media compression, signatures, print views, toast messages, queue badge, and user-facing offline banner remain in `teacher.html`.

The V2 `SyncManager` exposes events and status, but the complete teacher UI is not yet replaced by modular V2 screens.

## Remaining Gap: Queue Migration Across Deployments

The compatible storage key and legacy field aliases allow the modular code to read existing queue records. Before production cutover, a browser migration test must confirm:

- a queue created by the current `teacher.html` is readable by V2
- a V2-normalized queue does not break the legacy teacher page during phased rollout
- queued photos and signatures remain within browser storage limits
- corrupt large entries do not prevent smaller valid entries from syncing

## Other Earlier Gaps Still Open

- Smart Excel binary parsing remains in the legacy Admin file.
- Complete Room collection writes do not yet have multi-admin optimistic concurrency.
- Report browser-local pending, retroactive, and vacation adapters remain unconnected.
- Full performance and mobile validation remains scheduled for Sprint 3.9.

## Validation Required Before Merge

Run:

```text
node tests/login-foundation-check.mjs
node tests/stock-module-check.mjs
node tests/report-module-check.mjs
node tests/room-module-check.mjs
node tests/teacher-module-check.mjs
node tests/attendance-module-check.mjs
node tests/sync-module-check.mjs
```

Then validate Admin Login, Teacher Login, Logout, queue module loading, Browser Console, and a clean working tree.
