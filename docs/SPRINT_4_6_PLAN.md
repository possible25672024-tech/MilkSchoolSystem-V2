# Sprint 4.6 — Vacation Milk Operational UI Plan

Date: 2026-07-29

Branch: `feature/sprint-4.6-vacation-milk-ui`

Status: ACTIVE / LEGACY AUDIT PENDING

## Objective

Migrate the protected Teacher Vacation Milk workflow into modular V2 while preserving the binding Teacher legacy parity contract, Firebase compatibility, Room Stock-only behavior, exact rollback, typed Queue recovery, and safe payload boundaries.

## Planned Modules

```text
modules/repositories/vacationMilkRepository.js
modules/services/vacationMilkService.js
modules/vacation/vacationMilkManager.js
modules/vacation/vacationMilkView.js
```

A typed sync adapter or compatible shared routing extension will be added only after the legacy transaction type and rollback behavior are verified from protected `teacher.html`.

## First Gate — Read-Only Legacy Audit

Confirm before implementation:

- Firebase path and push-ID structure;
- academic year and semester fields;
- vacation issue date and date-range fields;
- weekday/weekend counting rules;
- authenticated-room student quantity calculation;
- compatible note, signature, signatures, photos, and saved-time fields;
- record-first or stock-first operation order;
- issue ledger and stockLog types;
- delete/rollback ledger and stockLog types;
- duplicate prevention identity;
- debt/status behavior if present;
- Main Stock isolation;
- existing report and print compatibility.

Protected `teacher.html` remains read-only and unchanged.

## Required Business Rules

- Teacher access remains limited to the authenticated room.
- Vacation Milk changes Room Stock only.
- Main Stock remains unchanged.
- Delete restores exactly the quantity previously deducted.
- Failed stock work becomes typed persistent Queue work.
- Successful stock followed by audit failure becomes audit-only Queue work.
- Audit-only retry never repeats stock mutation.
- Negative Room Stock is not silently clamped.
- Queue key remains `tc_pending_saves_v1`.

## Planned Gates

1. legacy schema and behavior audit;
2. module test;
3. typed recovery-routing test;
4. operational UI test;
5. isolated issue/delete/partial-save test;
6. complete regression run;
7. Firebase room index where required;
8. desktop read-only Network and Console gate;
9. responsive 820 x 1180 gate;
10. clean branch and working tree.

## Safety Boundary

Do not use:

- room `อ.3-3`;
- room ID `mqn0z13eyx5b`;
- date `2026-07-28`;
- any real-classroom write;
- direct Firebase Console mutation of Vacation Milk records;
- manual Queue, Room Stock, Main Stock, ledger, stockLog, or transaction-history repair.

## Legacy Parity

Sprint 4.6 does not remove later work for:

- photos and signatures;
- Attendance history and reports;
- A4 printing;
- student report;
- remaining Room Stock view;
- Teacher settings;
- final navigation parity.

Binding artifact:

- `docs/TEACHER_LEGACY_PARITY_CONTRACT.md`

## Completion Decision

Sprint completion may authorize only fast-forward integration into `develop`.

It will not authorize `main`, production cutover, real-classroom writes, legacy replacement, media/signature completion, report completion, Firebase security sign-off, physical iPad sign-off, or incident closure.
