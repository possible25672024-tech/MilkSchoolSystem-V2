# MilkSchoolSystem V2 — Operational Teacher UI Integration Plan

Date: 2026-07-28

Branch prepared from: `feature/sprint-4.0-cutover-readiness`

Status: PLANNED — not implemented in Sprint 4.0

## Goal

Replace the operational responsibilities of `teacher.html` with a modular V2 Teacher interface without changing verified stock rules, Firebase paths, attendance keys, offline queue storage, or the legacy rollback path.

## Protected Rules

- Main Stock must never be changed by Teacher workflows.
- Attendance, pending, retroactive, vacation, and Sync workflows change Room Stock only.
- Attendance edits apply only the present-count difference.
- Attendance deletion restores the previously consumed quantity.
- Room Stock ETag conflicts must read the latest value and recalculate before retry.
- Offline edits preserve the original `baselinePresent` and `queuedAt`.
- Negative Room Stock remains visible and is not silently clamped.
- Queue storage key remains `tc_pending_saves_v1` until a separately approved migration exists.
- `teacher.html` remains available until the V2 UI passes parity and device gates.

## Target Screen Structure

### 1. Teacher Session Header

Displays:

- school name
- room name
- teacher name
- current Room Stock
- connection state
- pending queue count
- Logout action

Data sources:

- `AuthService`
- `TeacherManager`
- `SyncManager`

### 2. Daily Attendance

Capabilities:

- load one day by `{roomId}_{YYYY-MM-DD}`
- mark students present/absent
- add notes
- save a new record
- edit an existing record
- delete a record with Room Stock restoration
- show partial-save state when Attendance is saved but Room Stock waits for retry

Module boundary:

- UI calls `AttendanceManager`
- no direct Firebase access
- no direct Room Stock calculation in the view

Required events:

- `milkapp:attendance-day-loaded`
- `milkapp:attendance-saved`
- `milkapp:attendance-deleted`
- `milkapp:attendance-stock-queued`

### 3. Pending Milk

Capabilities:

- show absent students eligible for pending milk
- issue pending milk
- deduct Room Stock only
- preserve legacy-compatible record fields
- avoid duplicate issue for the same student/date/reference

Implementation note:

Create a dedicated Manager/Service command path rather than embedding business rules in the UI.

### 4. Retroactive Milk

Capabilities:

- select eligible dates/students
- record retroactive issue
- deduct Room Stock only
- display transaction reference and resulting balance

### 5. Vacation Milk

Capabilities:

- configure vacation range and eligible students
- calculate quantities through service rules
- deduct Room Stock only
- preserve explicit transaction/audit references

### 6. Photos and Signatures

Capabilities:

- camera/file input for supporting photos
- touch/pointer signature capture
- preview and removal before save
- payload-size warning before upload
- persistence verification after reload

Safety requirements:

- do not block basic Attendance save if optional media processing fails without an explicit user decision
- do not load all historical photos/signatures during login
- load media only for the selected record

### 7. Offline and Sync Feedback

UI elements:

- online/offline banner
- pending queue badge
- last successful sync time
- retrying/failed/deferred status
- manual retry button
- item-level error summary without exposing sensitive payloads

Required events:

- current SyncManager status events
- attendance partial-save event
- queue count changes

Behavior:

- successful items are removed individually
- failed items remain
- attendance-first partial saves become stock-only retries
- successful stock updates with failed audit writes become audit-only retries

### 8. Attendance History and Printing

Capabilities:

- load history only when opened
- filter by date
- show present/absent totals
- print one day or selected range
- do not download all media unless requested

## Integration Phases

### Phase A — Shell and Read-Only State

- Teacher header
- room identity
- Room Stock display
- connection status
- queue badge
- Logout

Gate:

- desktop and 820 × 1180 layout
- clean Console
- no full-school Attendance reads

### Phase B — Attendance CRUD

- daily attendance form
- save/edit/delete
- Room Stock difference verification
- ETag conflict and partial-save UI

Gate:

- automated service tests
- isolated Firebase transaction test
- no Main Stock changes

### Phase C — Offline Queue UI

- offline banner
- persistent badge
- retry states
- restart/reconnect test

Gate:

- legacy `rec` and `diff` queue fixture compatibility
- repeated-edit baseline preservation

### Phase D — Pending, Retroactive, Vacation

- operational forms
- Room Stock-only commands
- duplicate prevention
- audit entries

Gate:

- parity test against representative legacy records

### Phase E — Photos, Signatures, Printing

- media capture
- signature input
- lazy media loading
- print layouts

Gate:

- desktop browser
- 820 × 1180 viewport
- physical-device evidence when available or explicit production risk acceptance

## Cutover Gate for Teacher UI

The V2 Teacher UI may replace `teacher.html` only when:

- all Teacher workflows are operational in V2;
- business-rule tests pass;
- isolated Firebase concurrency evidence is recorded;
- offline restart and reconnect tests pass;
- queue badge and offline banner are visible and accurate;
- photos/signatures/printing have an approved production decision;
- desktop and responsive browser tests pass;
- physical-device risk is either tested or explicitly accepted;
- rollback to `teacher.html` is rehearsed;
- product owner gives explicit approval.

## Out of Scope for Sprint 4.0

Sprint 4.0 does not implement these screens. It records the integration sequence and keeps production cutover blocked until a dedicated UI sprint completes them.
