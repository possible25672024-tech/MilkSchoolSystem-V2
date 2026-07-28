# Sprint 4.2 — Isolated Automated Attendance Write Gate

Date: 2026-07-28

Branch: `feature/sprint-4.2-attendance-daily-ui`

Status: IMPLEMENTED — local execution and full regression confirmation pending

## Purpose

This gate validates Attendance create, edit, delete, audit, and queue behavior without connecting to Firebase classroom data.

The test uses only in-memory state and mocked repository boundaries. It cannot read or write the real Realtime Database.

## Test File

- `tests/attendance-isolated-write-check.mjs`

## Isolated Baseline

- room ID: `isolated-room`
- date: `2026-07-28`
- Room Stock: 50
- Main Stock: 999
- Attendance: absent
- queue: empty
- ledger: empty
- stockLog: empty

These values exist only inside the Node.js test process.

## Covered Sequence

### Create

- create 3 present and 2 absent students
- verify key `isolated-room_2026-07-28`
- verify Room Stock `50 → 47`
- verify ledger quantity `-3`
- verify stockLog type `OUT` and quantity `3`
- verify Main Stock remains `999`
- verify compatible `clsId`, date, photos, and signature fields

### Edit — Fewer to More Present

- change present count from 3 to 5
- verify only the increase of 2 is deducted
- verify Room Stock `47 → 45`
- verify ledger quantity `-2`
- verify stockLog type `OUT`
- verify Main Stock remains unchanged

### Edit — More to Fewer Present

- change present count from 5 to 2
- verify only the decrease of 3 is restored
- verify Room Stock `45 → 48`
- verify ledger quantity `+3`
- verify stockLog type `IN` and quantity `3`
- verify Main Stock remains unchanged

### Delete

- delete the latest 2-present Attendance record
- verify restoration quantity `2`
- verify Room Stock `48 → 50`
- verify the exact Attendance key is removed
- verify ledger type `ROLLBACK` and quantity `2`
- verify stockLog type `IN`
- verify Main Stock remains unchanged

### Audit

- verify create, both edits, and delete each create one ledger entry
- verify create, both edits, and delete each create one stockLog entry
- verify successful CRUD creates no retry queue entries
- verify Manager emits three save events and one delete event

### Deliberate Partial-Save Simulation

A second isolated state deliberately throws a Room Stock conditional-write error after Attendance is saved.

The test verifies:

- Attendance remains saved
- Room Stock remains unchanged before retry
- Main Stock remains unchanged
- exactly one Room Stock retry is queued
- queued difference equals the present count
- queued reference uses the compatible Attendance key
- Manager emits `milkapp:attendance-stock-queued`

## Safety Boundary

The test:

- does not load `firebaseService.js`
- does not instantiate `AttendanceRepository`
- does not call `fetch`
- does not use the production Firebase URL
- does not use room `อ.3-3` / `mqn0z13eyx5b`
- does not use room `อ.3-4` / `mqn0z13emyrc`
- does not change `index.html` or `teacher.html`

## Required Local Validation

Run:

```powershell
node tests/attendance-isolated-write-check.mjs
```

Expected:

```text
Attendance isolated write checks passed.
```

After the isolated test passes, run the complete regression suite. Sprint 4.2 may be considered for merge into `develop` only after both the isolated gate and all regressions pass with a clean working tree.

The deferred real-classroom incident remains separate and still blocks production cutover and merge to `main` until reconciled.
