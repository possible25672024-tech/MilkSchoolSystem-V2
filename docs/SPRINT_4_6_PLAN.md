# Sprint 4.6 — Vacation Milk Operational UI Plan

Date: 2026-07-29

Branch: `feature/sprint-4.6-vacation-milk-ui`

Status: ACTIVE / MODULE, RECOVERY, UI, ISOLATED, AND FIREBASE INDEX GATES PASSED / FULL REGRESSION PENDING

## Objective

Migrate the protected Teacher Vacation Milk workflow into modular V2 while preserving the binding Teacher legacy parity contract, Firebase compatibility, Room Stock-only behavior, exact rollback, typed Queue recovery, visible student detail, and safe payload boundaries.

## Implemented Modules

```text
modules/repositories/vacationMilkRepository.js
modules/services/vacationMilkService.js
modules/vacation/vacationMilkManager.js
modules/vacation/vacationMilkView.js
modules/sync/vacationSyncAdapter.js
```

Integrated through:

```text
modules/core/app.js
```

The Vacation adapter installs before Queue startup replay. Protected `index.html` and `teacher.html` remain unchanged.

## Legacy Audit — PASS

Artifact:

- `docs/VACATION_MILK_LEGACY_AUDIT.md`

Verified from protected `teacher.html`:

- Firebase path `milkApp/vacationMilk`;
- Firebase push-ID records;
- academic year and vacation after semester 1 or 2;
- issue date;
- day count defaults to 30 and has minimum 1;
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
- result status preserved after automatic history refresh;
- room history and confirmed rollback;
- responsive layout;
- no direct Firebase, Repository, QueueStorage, stock, ledger, or retry ownership.

Sync:

- typed `VACATION` Queue metadata;
- reviewed safe Queue note and label;
- `VACATION` ledger with negative quantity;
- `OUT` stockLog with absolute quantity;
- exact shared `ROLLBACK` restoration;
- audit-only conversion after successful stock mutation;
- Main Stock delta zero;
- adapter installation before Queue startup replay;
- existing `RETRO`, `PENDING`, `ROLLBACK`, and legacy `ATTENDANCE` routing preserved.

## Duplicate Identity

Sprint 4.6 blocks only an exact duplicate:

```text
roomId + academicYear + semester + issueDate + days
```

A genuinely different issue date or day count remains possible.

## Confirmed Automated Gates

Confirmed locally:

```text
Vacation Milk module checks passed.
Vacation Milk recovery routing checks passed.
Vacation Milk UI checks passed.
Vacation Milk isolated write checks passed.
Cutover documentation checks passed.
```

### Module Gate

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

### Typed Recovery Gate

- Queue startup ordering;
- legacy `ATTENDANCE` fallback;
- preservation of existing `RETRO` routing;
- `VACATION` persistence and safe display;
- Room Stock `200 → 110` exactly once;
- ledger `VACATION` quantity `-90`;
- stockLog `OUT` quantity `90`;
- audit-only conversion;
- no repeated stock mutation during audit retry;
- `ROLLBACK` restoration `110 → 200`;
- Main Stock remains 999.

Artifact:

- `docs/VACATION_MILK_RECOVERY_ROUTING_GATE.md`

### UI and Isolated Write Gates — PASS

Coverage includes:

- Teacher-only panel and Admin rejection;
- 30-day default;
- visible student roster and per-student quantity;
- Media & Signature handoff;
- Room Stock preview and result feedback;
- successful and queued result status preserved after history refresh;
- history and rollback action;
- successful issue `200 → 110`;
- successful delete `110 → 200`;
- exact duplicate rejection;
- partial issue queued as `VACATION` difference `30`;
- partial delete queued as `ROLLBACK` difference `-30`;
- no Firebase or real classroom writes;
- Main Stock remains 999.

Artifact:

- `docs/VACATION_MILK_ISOLATED_WRITE_GATE.md`

## Firebase Query Index — PUBLISHED AND VALIDATED

The product owner preserved existing indexes and published:

```text
/milkApp/absentMilk   → .indexOn ["roomId"]
/milkApp/retroMilk    → .indexOn ["roomId"]
/milkApp/vacationMilk → .indexOn ["roomId"]
```

Read-only browser validation confirmed:

```text
16 students × 30 days = 480 boxes
Room Stock = 476
Method GET
Status 200
History records 0
```

The previous HTTP 400 index blocker is closed.

Artifact:

- `docs/FIREBASE_RULES_VACATION_MILK_INDEX.md`

Root-level public `.read` and `.write` remain a production-security blocker.

## Remaining Gates

1. Remove the diagnostic `vacation-ui-error.txt` if it still exists.
2. Complete all 30 regression checks.
3. Confirm synchronized branch and clean working tree.
4. Desktop read-only Console gate.
5. Responsive 820 x 1180 read-only gate.
6. Confirm no write methods or real mutation actions.

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

Do not press browser issue or delete. The browser remains read-only through Sprint acceptance.

## Completion Decision

Sprint completion may authorize only fast-forward integration into `develop`.

It will not authorize `main`, production cutover, real-classroom writes, legacy replacement, media/signature completion, report completion, Firebase security sign-off, physical iPad sign-off, or incident closure.
