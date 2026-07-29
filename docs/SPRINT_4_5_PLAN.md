# Sprint 4.5 — Retroactive Milk Operational UI Plan

Date: 2026-07-29

Branch: `feature/sprint-4.5-retroactive-milk-ui`

Status: ACTIVE / LEGACY AUDIT COMPLETE / INITIAL RUNTIME IMPLEMENTED

## Objective

Replace the protected legacy Retroactive Milk workflow with a modular Teacher operational flow while preserving verified Firebase schema, Room Stock behavior, debt semantics, audit references, Queue recovery, and rollback compatibility.

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
- App integration after Pending Milk.

## Pending Runtime Gate

Typed Queue recovery must be extended so:

```text
RETRO    → RETRO ledger / OUT stockLog
ROLLBACK → ROLLBACK ledger / IN stockLog
```

Legacy Queue entries without operation metadata must continue to default to `ATTENDANCE`.

Until this gate passes, do not use the Retroactive Milk issue/delete buttons against Firebase.

## Automated Gates

Sprint-specific tests:

```text
tests/retroactive-milk-module-check.mjs
tests/retroactive-milk-recovery-routing-check.mjs
tests/retroactive-milk-ui-check.mjs
tests/retroactive-milk-isolated-write-check.mjs
```

The first module test is implemented. Expected final regression count is 26.

## Browser Gate

Read-only only until all automated and isolated gates pass.

Required evidence:

- Queue key absent or `[]` before Teacher Login;
- Admin Login/Logout unchanged;
- Retroactive Milk panel renders for Teacher only;
- room-scoped history read;
- no POST, PUT, PATCH, or DELETE during read-only validation;
- no real issue or delete action pressed;
- clean Console;
- contained 820 x 1180 layout;
- Logout and Queue panel remain reachable.

The room-scoped query may require `.indexOn: ["roomId"]` at `/milkApp/retroMilk` in Firebase Realtime Database Rules.

## Safety Boundary

Do not use:

- room `อ.3-3`;
- room ID `mqn0z13eyx5b`;
- date `2026-07-28`;
- any real classroom write;
- direct Firebase Console mutation of Retroactive Milk data;
- manual Room Stock, Main Stock, Queue, ledger, stockLog, or transaction-history repair.

## Out of Scope

- debt settlement by the local authority;
- Vacation Milk;
- new signature/photo capture;
- printing changes;
- report adapter changes;
- production deployment;
- Firebase security hardening beyond required query indexes;
- replacement or removal of `teacher.html`.

## Completion Criteria

Sprint 4.5 may close only when:

1. all four modules are implemented;
2. legacy schema and business rules are preserved;
3. typed `RETRO` recovery passes;
4. isolated issue/delete/partial-save gates pass;
5. all 26 regression checks pass;
6. desktop read-only Network and Console gates pass;
7. 820 x 1180 responsive gate passes;
8. branch is synchronized and working tree clean;
9. `index.html` and `teacher.html` remain unchanged.

Completion authorizes only fast-forward integration into `develop`. It does not authorize `main`, production cutover, real-classroom write testing, incident closure, or legacy removal.
