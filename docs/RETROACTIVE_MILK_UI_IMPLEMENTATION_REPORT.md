# Sprint 4.5 — Retroactive Milk UI Implementation Report

Date: 2026-07-29

Branch: `feature/sprint-4.5-retroactive-milk-ui`

Status: IMPLEMENTED / FOUR SPRINT-SPECIFIC GATES PASSED / FULL REGRESSION PENDING

## Runtime

Implemented:

- `modules/repositories/retroactiveMilkRepository.js`
- `modules/services/retroactiveMilkService.js`
- `modules/retroactive/retroactiveMilkManager.js`
- `modules/retroactive/retroactiveMilkView.js`
- `modules/sync/retroactiveSyncAdapter.js`

Integrated through:

- `modules/core/app.js`

Protected legacy files remain unchanged:

- `index.html`
- `teacher.html`

## Functional Boundary

The modular Retroactive Milk flow:

- remains limited to the authenticated Teacher room;
- accepts academic year, semester, issue date, start date, and end date;
- counts inclusive Monday–Friday dates only;
- rejects reversed and weekend-only ranges;
- uses a stable authenticated-room student snapshot;
- calculates `totalBoxes = student count × weekday count`;
- preserves `debtBoxes = totalBoxes` and `status = debt`;
- prevents exact duplicate academic-period/range issue;
- creates a compatible Firebase push-ID record through the Repository boundary;
- saves the record before Room Stock deduction;
- deducts Room Stock only;
- creates `RETRO` ledger and `OUT` stockLog records;
- deletes the record before rollback;
- restores Room Stock only;
- creates `ROLLBACK` ledger and `IN` stockLog records;
- leaves Main Stock unchanged.

## Recovery Boundary

Typed Room Stock retries preserve:

- `ATTENDANCE` for legacy/default Attendance work;
- `PENDING` for Pending Milk deductions;
- `RETRO` for Retroactive Milk deductions;
- `ROLLBACK` for exact stock restoration.

The Retroactive sync adapter is installed before Queue startup replay. Failed audit writes convert to audit-only queue work, preserving the already-built ledger and stockLog without repeating Room Stock mutation.

The persistent queue key remains:

```text
tc_pending_saves_v1
```

## Passed Sprint-Specific Tests

Confirmed locally:

```text
Retroactive Milk module checks passed.
Retroactive Milk recovery routing checks passed.
Retroactive Milk UI checks passed.
Retroactive Milk isolated write checks passed.
Cutover documentation checks passed.
```

### Module Gate

- legacy-compatible path and schema;
- authenticated-room Repository boundary;
- weekday calculation across weekends;
- reversed and weekend-only rejection;
- successful issue and rollback;
- duplicate-range prevention;
- Main Stock isolation.

### Recovery Routing Gate

- adapter installation before Queue startup;
- legacy fallback to `ATTENDANCE`;
- typed `RETRO` persistence;
- correct `RETRO`/`OUT` replay;
- exact `ROLLBACK`/`IN` restoration;
- safe Queue UI summary;
- audit-only conversion;
- no repeated Room Stock mutation.

### Operational UI Gate

- Teacher-only activation and Admin rejection;
- authenticated room and academic-period form;
- preview of student, weekday, total-box, and debt values;
- issue and delete confirmation;
- Room Stock result feedback;
- partial-save Queue warning;
- room history and debt badge;
- Teacher refresh and Logout cleanup;
- no direct Firebase, Repository, storage, Queue, stock, ledger, or stockLog ownership in the View.

### Isolated Write Gate

- successful six-box issue: Room Stock `100 → 94`;
- duplicate range blocked;
- successful delete: Room Stock `94 → 100`;
- partial issue queues typed `RETRO` difference `3`;
- partial delete queues typed `ROLLBACK` difference `-3`;
- failed stock operation does not mutate Room Stock before retry;
- compatible `signature`, `signatures`, and `photos` fields remain present;
- Main Stock remains 999 throughout.

## Firebase Query Index

Published by the product owner:

```text
/milkApp/retroMilk → .indexOn ["roomId"]
```

The final read-only browser gate must verify the room-scoped history query returns HTTP 200.

## Teacher Legacy Parity

Sprint 4.5 does not remove later Teacher capabilities. The binding parity contract continues to require:

- visible/printable student detail;
- daily Attendance photo and Teacher signature;
- Pending, Retroactive, and Vacation Milk photo/signature evidence;
- Attendance history and edit/delete navigation;
- daily, weekly, monthly, semester, and 15-day summaries;
- A4 preview and printing;
- Vacation Milk;
- student report;
- remaining Room Stock view;
- Teacher settings;
- complete navigation parity.

Artifact:

- `docs/TEACHER_LEGACY_PARITY_CONTRACT.md`

## Current Safety Decision

The Sprint-specific code gates are accepted.

Browser Retroactive Milk mutation remains prohibited. The next gate is the complete 26-test regression run. Browser validation after regression must remain read-only and must not create, delete, or replay real Retroactive Milk data.

The quarantined real-data target remains excluded:

- room `อ.3-3`
- room ID `mqn0z13eyx5b`
- date `2026-07-28`

## Remaining Acceptance Gates

1. all 26 automated tests;
2. desktop Admin regression;
3. desktop Teacher read-only Retroactive Milk panel and indexed history response;
4. read-only Network method evidence;
5. clean Console;
6. responsive validation at 820 x 1180;
7. synchronized branch and clean working tree.

A successful Sprint 4.5 merge into `develop` will not authorize `main`, production cutover, replacement of `teacher.html`, media/signature completion, report completion, or closure of the deferred real-data incident.
