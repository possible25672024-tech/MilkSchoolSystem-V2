# Sprint 4.6 — Vacation Milk Operational UI Plan

Date: 2026-07-29

Branch: `feature/sprint-4.6-vacation-milk-ui`

Status: ACTIVE / LEGACY AUDIT PASSED / MODULE VALIDATION PENDING

## Objective

Migrate the protected Teacher Vacation Milk workflow into modular V2 while preserving the binding Teacher legacy parity contract, Firebase compatibility, Room Stock-only behavior, exact rollback, typed Queue recovery, and safe payload boundaries.

## Implemented Modules

```text
modules/repositories/vacationMilkRepository.js
modules/services/vacationMilkService.js
modules/vacation/vacationMilkManager.js
modules/vacation/vacationMilkView.js
```

Integrated through:

```text
modules/core/app.js
```

## Legacy Audit — PASS

Artifact:

- `docs/VACATION_MILK_LEGACY_AUDIT.md`

Verified from protected `teacher.html`:

- Firebase path `milkApp/vacationMilk`;
- Firebase push-ID records;
- academic year and vacation after semester 1 or 2;
- issue date;
- day count, default 30 and minimum 1;
- `totalBoxes = authenticated-room student count × day count`;
- current Room Stock display and insufficient-stock warning;
- visible authenticated-room student roster;
- per-student parent/recipient signatures;
- up to five photo items in the legacy UI;
- compatible note, signature, signatures, photos, and saved time;
- record saved before Room Stock deduction;
- issue ledger type `VACATION`;
- delete removes record before Room Stock restoration;
- delete ledger type `ROLLBACK`;
- report filter by academic year and semester;
- A4 output with roster, signatures, photos, and Teacher sign-off;
- Main Stock unchanged.

## Current Runtime

Repository:

- room-scoped `vacationMilk` query;
- exact record load;
- Firebase push-ID create;
- exact record delete.

Service:

- Teacher authenticated-room enforcement;
- academic year, semester, issue date, and day validation;
- stable room roster normalization;
- quantity preview;
- exact duplicate guard using room, academic year, semester, issue date, and days;
- compatible record construction;
- record-first issue and delete;
- Room Stock-only deduction/restoration;
- ledger `VACATION`/`ROLLBACK`;
- stockLog `OUT`/`IN`;
- explicit partial-stock error details;
- Main Stock delta zero.

Manager:

- UI-safe preview, history, issue, and remove commands;
- stable Teacher roster snapshot;
- partial stock Queue delegation;
- audit-only Queue delegation;
- overlapping delete/rollback guard;
- lifecycle events and cleanup.

View:

- Teacher-only Vacation Milk panel;
- academic year, semester, issue date, room, and day inputs;
- student/day/box/Room Stock summary;
- visible student roster and per-student box count;
- explicit Media & Signature parity handoff;
- optional note;
- issue confirmation;
- Room Stock and Queue feedback;
- room history and confirmed rollback;
- responsive layout;
- no direct Firebase, Repository, QueueStorage, stock, ledger, or retry ownership.

## Duplicate Identity

Sprint 4.6 blocks only an exact duplicate:

```text
roomId + academicYear + semester + issueDate + days
```

A genuinely different issue date or day count remains possible.

## Automated Gates

Added:

```text
tests/vacation-milk-module-check.mjs
```

The module test covers:

- protected legacy evidence;
- room-scoped Repository path;
- valid and invalid day counts;
- three students × 30 days = 90 boxes;
- compatible signatures and photos;
- successful Room Stock `200 → 110`;
- exact duplicate prevention;
- history totals;
- exact rollback `110 → 200`;
- `VACATION`/`ROLLBACK` ledger routing;
- `OUT`/`IN` stockLog routing;
- cross-room rejection;
- Main Stock remains 999;
- App integration;
- View ownership boundary.

Local execution is pending.

## Next Gates

1. Module Gate.
2. Typed `VACATION` recovery-routing gate.
3. Operational UI gate.
4. Isolated issue/delete/partial-save gate.
5. Complete regression run.
6. Publish `/milkApp/vacationMilk → .indexOn ["roomId"]` if not already present.
7. Desktop read-only indexed Network and Console gate.
8. Responsive 820 x 1180 gate.
9. Clean branch and working tree.

## Media, Signature, Report, and Print Parity

The current Service preserves compatible `signature`, `signatures`, and `photos` fields, and the View preserves visible student detail.

Shared capture, compression, file limits, lazy media loading, Queue-safe metadata, report assembly, and A4 printing remain mandatory under:

- `docs/TEACHER_LEGACY_PARITY_CONTRACT.md`

They are deferred by sequence, not removed.

## Safety Boundary

Do not use:

- room `อ.3-3`;
- room ID `mqn0z13eyx5b`;
- date `2026-07-28`;
- any real-classroom write;
- direct Firebase Console mutation of Vacation Milk records;
- manual Queue, Room Stock, Main Stock, ledger, stockLog, or transaction-history repair.

Do not press browser issue or delete until typed recovery and isolated write gates pass.

## Completion Decision

Sprint completion may authorize only fast-forward integration into `develop`.

It will not authorize `main`, production cutover, real-classroom writes, legacy replacement, media/signature completion, report completion, Firebase security sign-off, physical iPad sign-off, or incident closure.
