# Sprint 3.8 — Offline Queue and Sync Migration Plan

Date: 2026-07-27

Branch: `feature/sprint-3.8-offline-sync`

## Goal

Extract the verified persistent offline attendance queue, retry, reconnect flush, baseline preservation, Room Stock adjustment replay, and sync-status orchestration from the legacy teacher application into modular V2 components without changing stock rules, Firebase paths, or the operational `teacher.html` file.

## Protected Legacy Files

Do not modify:

- `index.html`
- `teacher.html`

## Target Files

- `modules/storage/queueStorage.js`
- `modules/services/syncService.js`
- `modules/sync/syncManager.js`
- `tests/sync-module-check.mjs`
- `docs/SYNC_MIGRATION_GAP_REPORT.md`

## Queue Entry Types

### Attendance

Required fields:

- `type: "attendance"`
- `key: {roomId}_{YYYY-MM-DD}`
- `record`
- `baselinePresent`
- `queuedAt`
- `attempts`

### Room Stock Adjustment

Required fields:

- `type: "roomStockAdjust"`
- unique queue key derived from the attendance reference
- `roomId`
- `difference`
- `referenceId`
- `roomName`
- `queuedAt`
- `attempts`

## Layer Responsibilities

### QueueStorage

- serialize queue data to persistent browser storage
- survive page refresh and browser restart
- return an empty queue when storage is missing
- filter invalid entries individually when queue data is corrupt
- replace an existing attendance entry with the latest record for the same key
- preserve the original `baselinePresent` when replacing a queued attendance edit
- remove one successful entry without deleting unrelated entries
- expose queue count and snapshot reads
- no Firebase or business calculations

### SyncService

- validate the active Teacher session
- reject cross-room queue entries
- replay attendance entries through AttendanceService
- replay Room Stock adjustment entries without rewriting attendance records
- process entries sequentially
- remove only successful entries
- retain failed entries and increment attempts
- calculate bounded exponential backoff: 5s → 10s → 20s → 40s → 60s
- return sync summaries and the next retry delay
- never access DOM, localStorage, sessionStorage, or Firebase directly

### SyncManager

- register and remove browser online/offline listeners
- flush on reconnect
- flush during periodic online checks
- prevent overlapping flushes
- schedule retry timers from SyncService results
- emit queue-count, sync-started, sync-completed, sync-failed, online, and offline events
- expose queue status for UI badges
- never call Firebase directly

## Compatibility Rules

- Queue storage key remains compatible with the legacy queue where practical.
- Attendance keys remain `{roomId}_{YYYY-MM-DD}`.
- Repeated queued edits keep the newest attendance record but preserve the first unsynced baseline.
- Attendance replay uses the same Room Stock difference rules as live AttendanceService saves.
- Room Stock adjustment retry does not write attendance a second time.
- Entries are replayed only for the authenticated room.
- Main Stock is never changed.
- Failed entries remain queued.
- Successful entries are removed individually.
- Retry frequency is bounded and never faster than the configured backoff.
- Queue corruption never causes the complete queue to be discarded when valid entries remain.

## Conflict and Concurrency Boundary

Sprint 3.8 must preserve the modular AttendanceService rules and explicitly document the remaining gap between multi-location PATCH and the legacy ETag compare-and-retry Room Stock protection. Do not silently claim strict cross-device transaction safety unless it is implemented and tested.

## Test Gate

- JavaScript syntax validation
- V2 dependency order
- QueueStorage contains no Firebase or DOM logic
- SyncService contains no DOM, localStorage, sessionStorage, or direct fetch
- SyncManager contains no Firebase or direct fetch
- empty and corrupt queue recovery tests
- attendance entry persistence tests
- duplicate attendance replacement tests
- original baseline preservation tests
- Room Stock adjustment persistence tests
- individual removal tests
- sequential replay tests
- cross-room replay rejection tests
- success removal and failure retention tests
- exponential backoff tests
- overlapping flush prevention tests
- reconnect flush tests
- periodic flush tests
- Main Stock isolation tests
- Login regression test
- Stock regression test
- Report regression test
- Room regression test
- Teacher regression test
- Attendance regression test
- Browser smoke test
- working tree clean

## Merge Gate

Merge into `develop` only after all automated and browser checks pass. Legacy files must remain unchanged.
