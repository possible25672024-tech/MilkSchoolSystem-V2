# Sprint 4.5 — Retroactive Milk Operational UI Plan

Date: 2026-07-29

Branch: `feature/sprint-4.5-retroactive-milk-ui`

Status: ACTIVE / MODULE GATE PASSED / TYPED RECOVERY IMPLEMENTED

## Objective

Replace the protected legacy Retroactive Milk workflow with a modular Teacher operational flow while preserving verified Firebase schema, Room Stock behavior, debt semantics, audit references, Queue recovery, rollback compatibility, and the binding Teacher legacy parity contract.

## Teacher Legacy Parity Contract

The product owner confirmed that every Teacher menu and operational capability shown in the protected `teacher.html` must remain in V2.

Binding artifact:

- `docs/TEACHER_LEGACY_PARITY_CONTRACT.md`

Sprint 4.5 does not remove later-sprint capabilities such as photos, signatures, history, summaries, printing, Vacation Milk, student reports, stock view, or settings. Those items remain mandatory parity work and are sequenced after the current Retroactive Milk stock/runtime gate.

## Protected Legacy Boundary

The protected `teacher.html` remains read-only and unchanged.

Verified behavior:

- Firebase path `milkApp/retroMilk`;
- Firebase push-ID records;
- authenticated Teacher room only;
- academic year, semester, issue date, start date, and end date are required;
- only Monday–Friday dates count;
- `totalBoxes = weekday count × authenticated-room student count`;
- `debtBoxes = totalBoxes`;
- initial status is `debt`;
- note, signature, signatures, photos, and saved time remain compatible;
- record is saved before Room Stock deduction;
- issue ledger type is `RETRO` and stockLog type is `OUT`;
- delete removes the record before Room Stock restoration;
- delete ledger type is `ROLLBACK` and stockLog type is `IN`;
- overlapping delete/rollback calls are blocked;
- Main Stock remains unchanged.

## Target Modules

```text
modules/repositories/retroactiveMilkRepository.js
modules/services/retroactiveMilkService.js
modules/retroactive/retroactiveMilkManager.js
modules/retroactive/retroactiveMilkView.js
modules/sync/retroactiveSyncAdapter.js
```

## Current Runtime

Implemented:

- authenticated-room `retroMilk` Repository query;
- UTC-safe inclusive weekday calculation;
- reversed and weekend-only range rejection;
- authenticated-room roster normalization;
- total and debt quantity preview;
- compatible debt-record construction;
- exact duplicate academic-period/range protection;
- record-first issue workflow;
- Room Stock-only deduction;
- `RETRO` ledger and `OUT` stockLog;
- record-first delete workflow;
- Room Stock restoration;
- `ROLLBACK` ledger and `IN` stockLog;
- partial stock error details;
- audit-only Queue delegation;
- Teacher-only operational View;
- App integration after Pending Milk;
- Retroactive sync adapter installed before Queue startup.

## Typed Recovery Gate

Implemented routing:

```text
RETRO    → RETRO ledger / OUT stockLog
ROLLBACK → ROLLBACK ledger / IN stockLog
```

The adapter:

- preserves `RETRO` through QueueStorage;
- preserves `RETRO` in SyncService and SyncManager safe summaries;
- displays a reviewed Retroactive Milk label in SyncView;
- deducts Room Stock exactly once for `RETRO` replay;
- converts failed audit work to the existing audit-only queue type;
- never repeats Room Stock mutation during audit-only replay;
- preserves legacy Queue entries without operation metadata as `ATTENDANCE`;
- leaves Main Stock unchanged.

Added:

- `tests/retroactive-milk-recovery-routing-check.mjs`

Local execution remains required before browser work.

## Automated Gates

Sprint-specific tests:

```text
tests/retroactive-milk-module-check.mjs
tests/retroactive-milk-recovery-routing-check.mjs
tests/retroactive-milk-ui-check.mjs
tests/retroactive-milk-isolated-write-check.mjs
```

Confirmed locally:

```text
Retroactive Milk module checks passed.
Cutover documentation checks passed.
```

The recovery-routing test is implemented and awaits local execution. Expected final regression count remains 26.

## Firebase Query Index

The product owner published:

```text
/milkApp/retroMilk → .indexOn ["roomId"]
```

The existing Pending Milk index remains:

```text
/milkApp/absentMilk → .indexOn ["roomId"]
```

The final read-only browser gate must verify the indexed Retroactive Milk history request returns HTTP 200.

## Browser Gate

Read-only only until all automated and isolated gates pass.

Required evidence:

- Queue key absent or `[]` before Teacher Login;
- Admin Login/Logout unchanged;
- Retroactive Milk panel renders for Teacher only;
- room-scoped history read returns HTTP 200;
- no POST, PUT, PATCH, or DELETE during read-only validation;
- no real issue or delete action pressed;
- clean Console;
- contained 820 x 1180 layout;
- Logout and Queue panel remain reachable.

## Deferred Parity Work — Mandatory, Not Removed

The following capabilities are deferred to the parity sequence documented in `docs/TEACHER_LEGACY_PARITY_CONTRACT.md`:

- visible/printable Retroactive Milk student roster detail;
- Attendance daily photo and Teacher signature;
- Pending, Retroactive, and Vacation Milk photo/signature evidence;
- Attendance history, edit/delete navigation, summaries, and A4 print;
- Vacation Milk operational UI;
- student report;
- remaining Room Stock view;
- Teacher settings;
- final Teacher navigation parity.

## Safety Boundary

Do not use:

- room `อ.3-3`;
- room ID `mqn0z13eyx5b`;
- date `2026-07-28`;
- any real classroom write;
- direct Firebase Console mutation of Retroactive Milk data;
- manual Room Stock, Main Stock, Queue, ledger, stockLog, or transaction-history repair.

## Out of Scope for This Sprint Only

- debt settlement by the local authority;
- Vacation Milk implementation;
- new signature/photo capture implementation;
- printing implementation;
- report adapter implementation;
- production deployment;
- Firebase security hardening beyond required query indexes;
- replacement or removal of `teacher.html`.

These items are not removed from the product. Applicable Teacher capabilities remain mandatory under the parity contract.

## Completion Criteria

Sprint 4.5 may close only when:

1. all four operational modules and the sync adapter are implemented;
2. legacy schema and business rules are preserved;
3. typed `RETRO` recovery passes;
4. isolated issue/delete/partial-save gates pass;
5. all 26 regression checks pass;
6. indexed desktop read-only Network and Console gates pass;
7. 820 x 1180 responsive gate passes;
8. branch is synchronized and working tree clean;
9. `index.html` and `teacher.html` remain unchanged;
10. the Teacher legacy parity contract remains recorded as binding future work.

Completion authorizes only fast-forward integration into `develop`. It does not authorize `main`, production cutover, real-classroom write testing, incident closure, media/signature completion, report completion, or legacy removal.
