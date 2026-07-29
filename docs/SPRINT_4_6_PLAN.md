# Sprint 4.6 — Vacation Milk Operational UI Plan

Date: 2026-07-29

Branch: `feature/sprint-4.6-vacation-milk-ui`

Status: COMPLETE — all automated, isolated, Firebase index, desktop, Console, Network, and 820 x 1180 responsive gates passed.

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

## Runtime Completion

Repository:

- room-scoped `vacationMilk` query;
- exact record load;
- Firebase push-ID create;
- exact record delete.

Service:

- authenticated Teacher-room enforcement;
- academic year, semester, issue date, and day validation;
- stable room roster normalization;
- quantity preview;
- exact duplicate guard using room, academic year, semester, issue date, and days;
- compatible `signature`, `signatures`, and `photos` fields;
- record-first issue and delete;
- Room Stock-only deduction/restoration;
- ledger `VACATION`/`ROLLBACK`;
- stockLog `OUT`/`IN`;
- explicit partial-stock details;
- Main Stock delta zero.

Manager and View:

- Teacher-only preview, history, issue, and remove commands;
- visible authenticated-room student roster;
- default 30-day vacation period;
- per-student box quantity;
- student/day/box/Room Stock summaries;
- Shared Media & Signature handoff;
- optional note;
- explicit issue/delete confirmation;
- successful and queued result status preserved after history refresh;
- room history and confirmed rollback;
- responsive layout;
- no direct Firebase, Repository, QueueStorage, stock, ledger, or retry ownership in the View.

Sync:

- typed `VACATION` Queue metadata;
- ledger `VACATION` with negative quantity;
- stockLog `OUT` with absolute quantity;
- shared exact `ROLLBACK` restoration;
- audit-only conversion after successful stock mutation;
- audit-only retry never repeats Room Stock mutation;
- existing `ATTENDANCE`, `PENDING`, `RETRO`, and `ROLLBACK` routing preserved.

## Automated Gates — PASS

Confirmed:

```text
Vacation Milk module checks passed.
Vacation Milk recovery routing checks passed.
Vacation Milk UI checks passed.
Vacation Milk isolated write checks passed.
Cutover documentation checks passed.
ALL 30 REGRESSION CHECKS PASSED
```

Branch state at acceptance:

```text
On branch feature/sprint-4.6-vacation-milk-ui
Your branch is up to date with 'origin/feature/sprint-4.6-vacation-milk-ui'.
nothing to commit, working tree clean
```

Validated isolated stock behavior:

```text
Issue:    Room Stock 200 → 110
Rollback: Room Stock 110 → 200
Main Stock remained 999
```

Partial-save behavior:

```text
Issue retry:    VACATION difference 30
Delete retry:   ROLLBACK difference -30
```

No Firebase or real classroom write was performed by isolated tests.

## Firebase Query Index — PASS

Published and validated while preserving existing indexes:

```text
/milkApp/absentMilk   → .indexOn ["roomId"]
/milkApp/retroMilk    → .indexOn ["roomId"]
/milkApp/vacationMilk → .indexOn ["roomId"]
```

Read-only browser result:

```text
Method GET
Status 200
16 students × 30 days = 480 boxes
Room Stock = 476
History records = 0
```

The previous Firebase HTTP 400 index blocker is closed.

Root-level public `.read` and `.write` remain a separate production-security blocker.

## Browser and Responsive Gates — PASS

Accepted evidence:

- Admin authenticated shell rendered normally;
- Vacation Milk Teacher panel rendered for a non-quarantined room;
- authenticated room and all 16 student names visible;
- 30 boxes shown for each student;
- summary cards readable;
- Shared Media & Signature handoff visible;
- indexed room-scoped history GET returned HTTP 200;
- no POST, PUT, PATCH, or DELETE during read-only validation;
- Console contained no JavaScript or Firebase error;
- normal `MilkSchoolSystem V2 Started` message remained visible;
- desktop layout passed;
- responsive `820 x 1180` layout passed;
- no abnormal horizontal overflow;
- action and Logout controls remained reachable in the vertically scrollable shell.

Artifact:

- `docs/VACATION_MILK_BROWSER_VALIDATION_REPORT.md`

## Safety Boundary

Validation did not use:

- room `อ.3-3`;
- room ID `mqn0z13eyx5b`;
- date `2026-07-28`;
- Vacation Milk issue or rollback against real data;
- Queue replay against real data;
- direct Firebase data mutation;
- manual Room Stock, Main Stock, ledger, stockLog, or transaction-history repair.

## Deferred Binding Work

Sprint completion does not remove:

- Shared Media and Signature workflow;
- Attendance daily photo and Teacher signature;
- Pending, Retroactive, and Vacation Milk evidence capture;
- report and A4 printing parity;
- student report, Room Stock view, settings, and final Teacher navigation parity.

These remain mandatory under:

- `docs/TEACHER_LEGACY_PARITY_CONTRACT.md`

## Completion Decision

Sprint 4.6 is accepted for fast-forward integration into `develop`.

It does not authorize:

- merge to `main`;
- production deployment;
- real-classroom writes;
- replacement of `teacher.html`;
- Media and Signature completion;
- report completion;
- Firebase security sign-off;
- physical iPad sign-off;
- closure of the deferred real-data incident.

Next Sprint:

```text
Sprint 4.7 — Shared Media and Signature Workflow
```
