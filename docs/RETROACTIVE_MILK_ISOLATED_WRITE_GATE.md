# Sprint 4.5 — Retroactive Milk UI and Isolated Write Gate

Date: 2026-07-29

Branch: `feature/sprint-4.5-retroactive-milk-ui`

Status: PASS — operational UI and isolated issue/delete/partial-save checks confirmed locally

## Purpose

Validate the operational Teacher UI, successful issue/delete behavior, duplicate protection, partial-save Queue conversion, and Main Stock isolation without Firebase or real classroom data.

## Test Files

- `tests/retroactive-milk-ui-check.mjs`
- `tests/retroactive-milk-isolated-write-check.mjs`

## Confirmed Local Output

```text
Retroactive Milk UI checks passed.
Retroactive Milk isolated write checks passed.
```

The feature branch was synchronized with origin and the working tree was clean after both tests.

## Operational UI Gate — PASS

Verified:

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

## Isolated Successful Issue — PASS

In-memory baseline:

- room ID: `isolated-retro-room`;
- three students;
- date range Friday 2026-08-07 through Monday 2026-08-10;
- weekday count: 2;
- Room Stock: 100;
- Main Stock: 999.

Confirmed:

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

## Duplicate Protection — PASS

An exact duplicate academic year, semester, start date, and end date was rejected with:

```text
RETRO_DUPLICATE_RANGE
```

No additional record or Room Stock mutation occurred.

## Successful Delete and Rollback — PASS

Confirmed:

- record deleted before Room Stock restoration;
- Room Stock `94 → 100`;
- ledger type `ROLLBACK`, quantity `6`;
- stockLog type `IN`, quantity `6`;
- Main Stock remains 999.

## Partial Issue — PASS

The isolated test deliberately failed Room Stock after the compatible Retroactive Milk record was saved.

Confirmed:

- record remained saved;
- Room Stock remained 100 before retry;
- Manager returned `stockQueued: true`;
- difference was `3` for three students × one weekday;
- operation type was `RETRO`;
- safe Retroactive Milk note was preserved;
- Main Stock remained 999.

## Partial Delete — PASS

The isolated test deliberately failed Room Stock after the record was deleted.

Confirmed:

- record remained deleted;
- Room Stock remained 100 before retry;
- Manager returned `stockQueued: true`;
- difference was `-3`;
- operation type was `ROLLBACK`;
- safe rollback note was preserved;
- Main Stock remained 999.

## Safety Boundary

The tests:

- did not load FirebaseService;
- did not instantiate a production Repository;
- did not call `fetch`;
- did not use Local Storage or Session Storage;
- did not use room `อ.3-3`;
- did not use date `2026-07-28`;
- did not change `index.html` or `teacher.html`;
- did not implement or discard deferred photo/signature/report parity.

## Decision

The Retroactive Milk Operational UI and isolated write gates are accepted for the Sprint 4.5 code gate.

Browser issue and delete actions remain prohibited. The next acceptance step is the complete 26-test regression run, followed by a read-only browser, Network, Console, and 820 x 1180 responsive gate.

The later Media and Signature Sprint remains mandatory under:

- `docs/TEACHER_LEGACY_PARITY_CONTRACT.md`
