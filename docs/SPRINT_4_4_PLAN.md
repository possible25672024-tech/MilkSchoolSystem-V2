# Sprint 4.4 — Pending Milk Operational UI

Date: 2026-07-29

Branch: `feature/sprint-4.4-pending-milk-ui`

Status: 10% — Sprint plan initialized; legacy-compatible schema audit and runtime implementation not started

## Goal

Add the modular Pending Milk workflow to the V2 Teacher shell while preserving verified Room Stock, Main Stock, Firebase path, Attendance, Offline Queue, audit, and protected legacy behavior.

Pending Milk means issuing milk later to students who were absent on a selected Attendance date. The workflow must deduct Room Stock only and must not affect Main Stock.

Sprint 4.4 does not replace `teacher.html` and does not implement Retroactive Milk or Vacation Milk.

## Protected Legacy Files

- `index.html`
- `teacher.html`

Both remain unchanged, operational, and available as rollback paths.

Legacy behavior may be inspected read-only to confirm compatible fields and duplicate rules. No legacy file edit is allowed.

## Existing Foundation

### Teacher Boundary

Available:

- authenticated-room-only session validation
- normalized room and student snapshot
- date-scoped Attendance loading
- deferred `absentMilk` collection loading
- Room Stock command preparation for `PENDING`
- Main Stock delta fixed at zero for Teacher operations

### Attendance Boundary

Available:

- exact Attendance key `{roomId}_{YYYY-MM-DD}`
- present/absent student status
- Room Stock ETag and conditional-write protection
- compatible ledger and stockLog patterns
- partial-save queue and audit recovery foundations

### Sync Boundary

Available:

- persistent `tc_pending_saves_v1`
- safe operational Queue UI
- sequential replay and bounded backoff
- Room Stock-only and audit-only recovery

Pending Milk must not be added to the Attendance queue format without an explicit reviewed compatibility design.

## Required Legacy-Compatible Audit

Before Runtime implementation, inspect the protected legacy Pending Milk workflow read-only and document:

- `absentMilk` record key format
- room ID fields (`roomId`, `classId`, `clsId`)
- student identity fields
- source Attendance date
- issue date
- quantity fields (`boxes`, `totalBoxes`, `total`, or `quantity`)
- teacher and room-name fields
- transaction/reference ID fields
- saved/created timestamp fields
- duplicate prevention behavior
- ledger and stockLog types and references
- deletion or rollback behavior, when present

No schema change is allowed without an approved migration and rollback plan.

## Planned Modules

Expected dedicated boundary:

- `modules/repositories/pendingMilkRepository.js`
- `modules/services/pendingMilkService.js`
- `modules/pending/pendingMilkManager.js`
- `modules/pending/pendingMilkView.js`

Reuse existing modules where their responsibilities already fit. Do not place Pending Milk calculations or Firebase paths in the View.

## In Scope

### Eligibility

- select one valid Attendance date
- load only the authenticated room
- show students marked absent on that date
- exclude students already issued pending milk for the same source date/reference
- display eligible, already-issued, and selected totals

### Issue Pending Milk

- select one or more eligible absent students
- default quantity of one box per selected student unless legacy evidence requires another compatible rule
- create legacy-compatible `absentMilk` record(s)
- deduct Room Stock only
- return Room Stock before/after and transaction reference
- create compatible ledger and stockLog audit records
- preserve Main Stock delta zero

### Duplicate Prevention

Reject duplicate issue for the same:

- room
- student
- source Attendance date
- compatible reference/key

Duplicate detection must run in the Service and must not rely only on disabled UI controls.

### Rollback or Delete

Implement only when confirmed by legacy evidence.

When supported:

- restore exactly the previously issued quantity to Room Stock
- remove or mark the exact Pending Milk record compatibly
- create a rollback audit reference
- never change Main Stock

### View Feedback

Display:

- selected Attendance date
- eligible absent students
- already-issued students
- selected quantity
- Room Stock before and after
- duplicate rejection
- ETag conflict/retry result
- partial-save or audit warning, when applicable
- success and error messages

## Architecture Rules

### Repository

May own:

- `absentMilk` paths and queries
- Room Stock versioned reads and conditional writes through existing boundaries
- record persistence
- audit persistence

Must not own:

- eligibility rules
- duplicate business decisions
- UI

### Service

Owns:

- session and room validation
- legacy record normalization
- eligibility
- duplicate prevention
- quantity calculation
- Room Stock-only workflow
- compatible record, ledger, and stockLog construction
- rollback calculation when supported

### Manager

Owns:

- UI-safe load/issue/rollback commands
- event emission
- partial-save and recovery orchestration

### View

May:

- render students and status
- collect date and student selections
- call PendingMilkManager
- render Manager results and events

Must not:

- access Firebase or Repository directly
- call fetch
- access Local Storage or Session Storage
- calculate eligibility, duplicates, quantity, or stock differences
- create records, ledger, or stockLog payloads
- change Main Stock

## Business Protection

- Main Stock delta is always zero.
- Pending Milk deducts Room Stock only.
- Quantity is deducted exactly once.
- Duplicate issue is blocked in the Service.
- Teacher access is restricted to the authenticated room.
- Negative Room Stock remains visible and is not silently clamped.
- ETag conflict reads the latest Room Stock and recalculates before retry.
- Successful Room Stock mutation must not be repeated during audit-only recovery.
- Firebase path `milkApp/absentMilk` remains compatible.
- Existing Attendance records are read-only for Pending Milk eligibility.

## Real-Data Incident Quarantine

Room `อ.3-3` / `mqn0z13eyx5b`, date `2026-07-28` remains quarantined.

Sprint 4.4 must not:

- use that room/date for eligibility or issue tests
- create, edit, delete, or replay a real Pending Milk record
- use quarantined Attendance or Room Stock as trusted evidence
- manually rewrite stock, queue, ledger, stockLog, or history

All mutation validation must use in-memory or fully isolated fixtures.

## Planned Tests

Expected:

- `tests/pending-milk-module-check.mjs`
- `tests/pending-milk-ui-check.mjs`
- `tests/pending-milk-isolated-write-check.mjs`

Required coverage:

- exact authenticated-room eligibility
- absent-only eligibility
- already-issued exclusion
- legacy-compatible record fields
- duplicate prevention
- one-student and multi-student quantity
- Room Stock deduction only
- Main Stock unchanged
- ETag conflict recalculation
- partial-save and audit-only recovery behavior
- rollback exact restoration when supported
- no direct Firebase/Repository/storage/stock logic in View
- responsive rendering
- protected legacy files unchanged

## Automated Regression Gate

Existing 18 tests remain mandatory, plus new Pending Milk tests.

No real Firebase or classroom write is allowed in automated or browser validation.

## Browser Gate

Desktop Chrome with empty/isolated Pending Milk fixtures:

- Admin Login/Logout unchanged
- Teacher Pending Milk section renders
- selected date loads only authenticated-room Attendance
- absent students display correctly
- already-issued state displays correctly
- no mutation during read-only validation
- Console clean
- Network contains no full-school Attendance or absentMilk read

Chrome Device Toolbar at 820 x 1180:

- date selector and student rows remain readable
- selection controls remain usable
- totals and Room Stock feedback remain contained
- action and Logout remain reachable
- no abnormal horizontal overflow
- Console clean

Write interaction must use in-memory or a fully isolated Firebase target only.

Physical iPad remains deferred and must not be represented as PASS.

## Out of Scope

- Retroactive Milk
- Vacation Milk
- photos and signatures
- Attendance history and printing
- Report UI
- Admin operational UI
- Firebase schema migration
- replacement or removal of `teacher.html`
- production deployment
- real-classroom write tests

## Merge Gate

Sprint 4.4 may merge into `develop` when:

- legacy-compatible Pending Milk schema is documented
- dedicated architecture boundaries are preserved
- eligibility and duplicate prevention tests pass
- isolated issue and rollback tests pass
- Main Stock remains unchanged
- Room Stock changes exactly once
- ETag and partial-save behavior is safe
- complete regression suite passes
- desktop and 820 x 1180 browser gates pass
- Console and Network gates pass
- working tree is clean
- `index.html` and `teacher.html` remain unchanged

## Production Meaning

A Sprint 4.4 merge into `develop` does not authorize:

- Retroactive or Vacation Milk cutover
- replacement of `teacher.html`
- merge to `main`
- production traffic switching
- Firebase schema changes
- legacy-file removal
- closure of the deferred real-data incident
