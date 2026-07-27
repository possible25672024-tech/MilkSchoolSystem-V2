# Sprint 3.7 — Attendance Module Migration Plan

Date: 2026-07-27

Branch: `feature/sprint-3.7-attendance`

## Goal

Extract attendance read, validation, save, edit-difference, deletion rollback, Room Stock adjustment, and ledger workflow boundaries from the legacy teacher application without changing Firebase paths, two-layer stock rules, offline behavior, or the operational `teacher.html` file.

## Protected Legacy Files

Do not modify:

- `index.html`
- `teacher.html`

## Target Files

- `modules/repositories/attendanceRepository.js`
- `modules/services/attendanceService.js`
- `modules/attendance/attendanceManager.js`
- `tests/attendance-module-check.mjs`
- `docs/ATTENDANCE_MIGRATION_GAP_REPORT.md`

## Firebase Paths

Under `milkApp`:

- `mcAttendance/{roomId}_{YYYY-MM-DD}`
- `roomStock/{roomId}`
- `stockTransactions`
- `updatedAt`

Read-only supporting paths:

- `rooms`
- `settings`

## Layer Responsibilities

### AttendanceRepository

- load one attendance record by compatible key
- load room-scoped attendance by key prefix
- load current Room Stock for the authenticated room
- save attendance, Room Stock delta, ledger, and update marker through a safe multi-location boundary
- delete attendance and restore Room Stock through a safe multi-location boundary
- no business calculations
- no DOM, sessions, or browser storage

### AttendanceService

- validate authenticated Teacher session and room
- validate attendance date and key
- normalize student attendance values
- allow only `present` and `absent`
- calculate present and absent totals
- compare previous and next attendance totals
- calculate Room Stock delta by difference only
- reject insufficient Room Stock before new consumption
- prepare compatible attendance and ledger records
- prepare safe deletion rollback
- keep `mainStockDelta` equal to zero
- no DOM, localStorage, sessionStorage, or direct Firebase calls

### AttendanceManager

- resolve session through AuthService
- load one day or room history
- submit create/edit attendance commands
- submit deletion rollback commands
- expose status and event boundaries
- never access Firebase directly

## Critical Business Rules

- Attendance key format remains `{roomId}_{YYYY-MM-DD}`.
- Only the authenticated room may be read or written.
- New attendance reduces Room Stock by the number of `present` students.
- Editing an existing attendance record changes Room Stock only by `newPresent - previousPresent`.
- If present count decreases, Room Stock is restored by the difference.
- Deleting an attendance record restores the previously consumed Room Stock.
- Main Stock must never change.
- Ledger records remain compatible with `ATTENDANCE` and `ROLLBACK` history.
- Duplicate save and duplicate rollback protections must be represented at the workflow boundary.
- Existing offline queue behavior must not be changed before Sprint 3.8.

## Atomicity Boundary

Attendance data, Room Stock, ledger, and update marker should be committed through one multi-location Firebase update where the existing REST foundation permits it. The Service calculates values; the Repository owns paths and writes.

## Test Gate

- JavaScript syntax validation
- V2 dependency order
- repository path and atomic-boundary checks
- repository contains no business calculations
- service contains no DOM, browser storage, or direct fetch
- manager contains no Firebase or direct fetch
- attendance key tests
- authenticated-room-only tests
- invalid status rejection tests
- create attendance Room Stock delta tests
- edit increase and edit decrease difference tests
- insufficient Room Stock tests
- deletion rollback tests
- Main Stock isolation tests
- ledger compatibility tests
- duplicate operation guard tests
- Login regression test
- Stock regression test
- Report regression test
- Room regression test
- Teacher regression test
- Browser smoke test
- working tree clean

## Deferred to Sprint 3.8

- persistent offline queue
- retry scheduling
- reconnect flush
- conflict resolution for queued attendance edits

## Merge Gate

Merge into `develop` only after all automated and browser checks pass and legacy files remain unchanged.
