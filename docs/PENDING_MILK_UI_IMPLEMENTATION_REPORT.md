# Sprint 4.4 — Pending Milk UI Implementation Report

Date: 2026-07-29

Branch: `feature/sprint-4.4-pending-milk-ui`

Status: IMPLEMENTED / FOUR SPRINT-SPECIFIC GATES PASSED / FULL REGRESSION PENDING

## Runtime

Implemented:

- `modules/repositories/pendingMilkRepository.js`
- `modules/services/pendingMilkService.js`
- `modules/pending/pendingMilkManager.js`
- `modules/pending/pendingMilkView.js`

Integrated through:

- `modules/core/app.js`

Protected legacy files remain unchanged:

- `index.html`
- `teacher.html`

## Functional Boundary

The modular Pending Milk flow:

- loads exactly Monday–Friday Attendance records for the authenticated room
- treats one absent student/date pair as one box
- excludes student/date pairs already present in compatible `absentMilk` records
- performs a Service-level duplicate recheck before save
- preserves compatible `absentMilk` fields
- creates a Firebase push-ID record through the Repository boundary
- deducts Room Stock only
- creates `PENDING` ledger and `OUT` stockLog records
- deletes the Pending Milk record before rollback
- restores Room Stock only
- creates `ROLLBACK` ledger and `IN` stockLog records
- leaves Main Stock unchanged

## Recovery Boundary

Typed Room Stock retries preserve:

- `ATTENDANCE` for existing Attendance work
- `PENDING` for unresolved Pending Milk deductions
- `ROLLBACK` for unresolved Pending Milk restorations

Failed audit writes convert to audit-only queue work. Audit-only replay preserves the already-built ledger and stockLog and never repeats Room Stock mutation.

The persistent queue key remains:

```text
tc_pending_saves_v1
```

## Passed Sprint-Specific Tests

Confirmed locally:

```text
Pending Milk module checks passed.
Pending Milk recovery routing checks passed.
Pending Milk UI checks passed.
Pending Milk isolated write checks passed.
```

### Module Gate

- compatible schema and path evidence
- authenticated-room Repository boundary
- exact Attendance date reads
- absent-only eligibility
- already-issued exclusion
- successful issue and rollback
- duplicate prevention
- Main Stock isolation

### Recovery Routing Gate

- legacy retry compatibility
- typed `PENDING` and `ROLLBACK` metadata
- correct ledger and stockLog types
- safe Queue UI summaries
- audit-only conversion
- no repeated Room Stock mutation

### UI Gate

- Teacher-only activation
- selected-week loading
- eligible/already-issued/selected totals
- issue confirmation and note delegation
- Room Stock result and partial-save feedback
- history and confirmed delete delegation
- Logout cleanup
- no direct Firebase, Repository, storage, stock, ledger, or stockLog ownership in the View

### Isolated Write Gate

- successful two-box issue: Room Stock `50 → 48`
- duplicate student/date issue blocked
- successful delete: Room Stock `48 → 50`
- partial issue queues typed `PENDING` difference `1`
- partial delete queues typed `ROLLBACK` difference `-1`
- failed stock operation does not mutate Room Stock before retry
- Main Stock remains 999 throughout

## Current Safety Decision

The Sprint-specific code gates are accepted.

Browser Pending Milk mutation remains prohibited. The next gate is the complete 22-test regression run. Browser validation after regression must remain read-only and must not create, delete, or replay real Pending Milk data.

The quarantined real-data target remains excluded:

- room `อ.3-3`
- room ID `mqn0z13eyx5b`
- date `2026-07-28`

## Remaining Acceptance Gates

1. all 22 automated tests
2. desktop Admin regression
3. desktop Teacher read-only Pending Milk panel and Network evidence
4. responsive validation at 820 x 1180
5. clean Console and clean working tree

A successful Sprint 4.4 merge into `develop` will not authorize `main`, production cutover, replacement of `teacher.html`, or closure of the deferred real-data incident.
