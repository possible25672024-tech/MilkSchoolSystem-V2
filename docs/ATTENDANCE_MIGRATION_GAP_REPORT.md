# Attendance Migration Gap Report

Date: 2026-07-27

Branch: `feature/sprint-3.7-attendance`

## Scope Completed

Sprint 3.7 extracts the attendance data, business-rule, and command boundaries required by V2 while leaving the operational `teacher.html` workflow unchanged.

Implemented modules:

- `modules/repositories/attendanceRepository.js`
- `modules/services/attendanceService.js`
- `modules/attendance/attendanceManager.js`
- `tests/attendance-module-check.mjs`

## Preserved Firebase Schema

Attendance record path:

`milkApp/mcAttendance/{roomId}_{YYYY-MM-DD}`

Room Stock path:

`milkApp/roomStock/{roomId}`

Compatible ledger path:

`milkApp/stockTransactions/{ledgerId}`

Legacy stock-history path:

`milkApp/stockLog/{logId}`

Attendance record fields remain compatible with the legacy teacher application:

- `clsId`
- `roomName`
- `date`
- `year`
- `term`
- `teacher`
- `data`
- `notes`
- `photos`
- `signature`
- `savedAt`

## Business Rules Extracted

### New Attendance

Room Stock change:

`roomStockAfter = roomStockBefore - newPresentCount`

Main Stock change:

`0`

### Attendance Edit

Room Stock change uses only the difference:

`presentDifference = newPresentCount - oldPresentCount`

`roomStockAfter = roomStockBefore - presentDifference`

Examples:

- old 20, new 23: Room Stock decreases by 3
- old 23, new 20: Room Stock increases by 3
- old 20, new 20: Room Stock is unchanged

### Attendance Deletion

Room Stock change:

`roomStockAfter = roomStockBefore + deletedRecordPresentCount`

The deletion writes a compatible `ROLLBACK` ledger entry.

### Negative Room Stock

The modular service does not clamp Room Stock to zero. This preserves the legacy rule that an under-allocated classroom may show a negative balance so the administrator can identify the shortage.

## Room Isolation

- Teacher sessions are validated through `TeacherService`.
- Admin sessions are rejected from attendance operations.
- A teacher command targeting another room is rejected before any repository write.
- Room history reads use the Firebase key-prefix range from `{roomId}_` to `{roomId}_\uf8ff`.

## Atomic Multi-location Boundary

Each online modular attendance mutation is prepared as one Firebase Realtime Database multi-location update under `milkApp`.

A save or edit may update:

- `mcAttendance/{key}`
- `roomStock/{roomId}`
- `stockTransactions/{ledgerId}`
- `stockLog/{logId}`

A deletion may update the same paths while setting `mcAttendance/{key}` to `null`.

No attendance mutation contains the `stock` Main Stock path.

## Important Concurrency Gap

The operational `teacher.html` currently protects Room Stock with an ETag conditional-write loop and queues a stock adjustment when attendance succeeds but the Room Stock write fails.

The V2 modular boundary uses one atomic multi-location PATCH, which keeps its included paths consistent as one Firebase operation, but it does not yet add ETag-based compare-and-retry protection for simultaneous Room Stock writers.

Because replacing the operational workflow before solving this concurrency/offline interaction could change verified behavior, `teacher.html` remains the production attendance writer during this Sprint.

The final operational cutover must choose and test one coordinated strategy for:

- optimistic concurrency
- multi-location consistency
- offline retries
- duplicate prevention
- stale-baseline conflict handling

That integration belongs with Sprint 3.8 Offline Queue and Sync work.

## Deferred to Sprint 3.8

- persistent browser queue
- exponential retry backoff
- reconnect flush
- preserving the original baseline present count across offline edits
- queued attendance replacement for the same room/date
- partial attendance/stock failure recovery
- conflict resolution between queued edits and newer Cloud records

## Still in Legacy UI

The following operational features remain in `teacher.html`:

- attendance form rendering
- student check buttons
- photo capture and compression
- teacher signature canvas
- monthly and historical print views
- confirmation dialogs and toast messages
- offline status banner
- operational ETag Room Stock adjustment

## Safety Result

Sprint 3.7 creates a testable Attendance architecture without replacing the production teacher page and without changing Main Stock, Room IDs, the offline queue, or legacy Firebase paths.
