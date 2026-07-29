# Sprint 4.5 — Retroactive Milk UI and Isolated Write Gate

Date: 2026-07-29

Branch: `feature/sprint-4.5-retroactive-milk-ui`

Status: IMPLEMENTED / LOCAL VALIDATION PENDING

## Purpose

Validate the operational Teacher UI, successful issue/delete behavior, duplicate protection, partial-save Queue conversion, and Main Stock isolation without Firebase or real classroom data.

## Test Files

- `tests/retroactive-milk-ui-check.mjs`
- `tests/retroactive-milk-isolated-write-check.mjs`

## Operational UI Coverage

The UI test verifies:

- programmatic Retroactive Milk panel creation;
- Teacher-only activation and Admin rejection;
- authenticated room display;
- academic year, semester, issue date, start date, and end date delegation;
- three students × two weekdays = six boxes;
- student, weekday, total-box, and debt summary rendering;
- issue button remains disabled until a valid preview exists;
- explicit issue confirmation;
- note delegation;
- successful Room Stock feedback `100 → 94`;
- history rendering with debt badge;
- confirmed delete/rollback delegation;
- restored Room Stock feedback `94 → 100`;
- partial-save Queue warning;
- Teacher refresh after issue/delete;
- Logout cleanup;
- no direct Firebase, Repository, browser storage, QueueStorage, stock, ledger, or stockLog ownership in the View;
- future roster/photo/signature parity remains protected by the binding contract.

## Isolated Successful Issue

In-memory baseline:

- room ID: `isolated-retro-room`;
- three students;
- date range Friday 2026-08-07 through Monday 2026-08-10;
- weekday count: 2;
- Room Stock: 100;
- Main Stock: 999.

Expected:

- quantity: 6 boxes;
- compatible debt record saved first;
- `studentCount: 3`;
- `days: 2`;
- `totalBoxes: 6`;
- `debtBoxes: 6`;
- `status: debt`;
- compatible empty `signature`, `signatures`, and `photos` fields;
- Room Stock `100 → 94`;
- ledger type `RETRO`, quantity `-6`;
- stockLog type `OUT`, quantity `6`;
- Main Stock remains 999.

## Duplicate Protection

An exact duplicate academic year, semester, start date, and end date must be rejected with:

```text
RETRO_DUPLICATE_RANGE
```

No additional record or Room Stock mutation may occur.

## Successful Delete and Rollback

Expected:

- record deleted before Room Stock restoration;
- Room Stock `94 → 100`;
- ledger type `ROLLBACK`, quantity `6`;
- stockLog type `IN`, quantity `6`;
- Main Stock remains 999.

## Partial Issue

The test deliberately fails Room Stock after the compatible Retroactive Milk record is saved.

Expected:

- record remains saved;
- Room Stock remains 100 before retry;
- Manager returns `stockQueued: true`;
- difference is `3` for three students × one weekday;
- operation type is `RETRO`;
- safe Retroactive Milk note is preserved;
- Main Stock remains 999.

## Partial Delete

The test deliberately fails Room Stock after the record is deleted.

Expected:

- record remains deleted;
- Room Stock remains 100 before retry;
- Manager returns `stockQueued: true`;
- difference is `-3`;
- operation type is `ROLLBACK`;
- safe rollback note is preserved;
- Main Stock remains 999.

## Safety Boundary

The tests:

- do not load FirebaseService;
- do not instantiate a production Repository;
- do not call `fetch`;
- do not use Local Storage or Session Storage;
- do not use room `อ.3-3`;
- do not use date `2026-07-28`;
- do not change `index.html` or `teacher.html`;
- do not implement or discard deferred photo/signature/report parity.

## Expected Local Output

```text
Retroactive Milk UI checks passed.
Retroactive Milk isolated write checks passed.
```

## Decision Boundary

Browser issue and delete actions remain prohibited until both tests and the complete 26-test regression gate pass.

The later Media and Signature Sprint remains mandatory under:

- `docs/TEACHER_LEGACY_PARITY_CONTRACT.md`
