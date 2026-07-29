# Sprint 4.6 — Vacation Milk UI and Isolated Write Gate

Date: 2026-07-29

Branch: `feature/sprint-4.6-vacation-milk-ui`

Status: IMPLEMENTED / LOCAL VALIDATION PENDING

## Purpose

Validate the operational Teacher UI, successful issue/delete behavior, exact duplicate protection, partial-save Queue conversion, visible student detail, and Main Stock isolation without Firebase or real classroom writes.

## Test Files

- `tests/vacation-milk-ui-check.mjs`
- `tests/vacation-milk-isolated-write-check.mjs`

## Operational UI Coverage

The UI gate verifies:

- programmatic Vacation Milk panel creation;
- Teacher-only activation and Admin rejection;
- authenticated room display;
- academic year, semester, issue date, and vacation-day inputs;
- default vacation period of 30 days;
- visible student roster;
- per-student box quantity;
- explicit Shared Media & Signature handoff;
- student, day, total-box, and Room Stock summaries;
- issue button availability only with a valid preview;
- explicit issue confirmation;
- note delegation;
- successful Room Stock feedback `200 → 110`;
- room history rendering;
- exact delete/rollback delegation;
- restored Room Stock feedback `110 → 200`;
- partial-save Queue warning;
- Teacher stock refresh after issue/delete;
- Logout cleanup;
- no direct Firebase, Repository, browser storage, QueueStorage, stock, ledger, stockLog, or retry ownership in the View.

Expected output:

```text
Vacation Milk UI checks passed.
```

## Isolated Successful Issue

In-memory baseline:

- room ID: `isolated-vacation-room`;
- three students;
- 30 vacation days;
- Room Stock: 200;
- Main Stock: 999.

Expected result:

- quantity: 90 boxes;
- compatible record saved before stock mutation;
- `studentCount: 3`;
- `days: 30`;
- `totalBoxes: 90`;
- empty compatible `signature`, `signatures`, and `photos` fields;
- Room Stock `200 → 110`;
- ledger type `VACATION`, quantity `-90`;
- stockLog type `OUT`, quantity `90`;
- Main Stock remains 999.

## Exact Duplicate Protection

The same combination must be rejected:

```text
roomId + academicYear + semester + issueDate + days
```

Expected error:

```text
VACATION_DUPLICATE_ISSUE
```

No extra record or Room Stock mutation may occur.

## Successful Delete and Rollback

Expected:

- record deleted before stock restoration;
- Room Stock `110 → 200`;
- ledger type `ROLLBACK`, quantity `90`;
- stockLog type `IN`, quantity `90`;
- Main Stock remains 999.

## Partial Issue

The isolated gate deliberately fails Room Stock after a compatible 30-box record is saved.

Expected:

- record remains saved;
- Room Stock remains 200 before retry;
- Manager returns `stockQueued: true`;
- difference is `30`;
- operation type is `VACATION`;
- safe Vacation Milk note is preserved;
- Main Stock remains 999.

## Partial Delete

The isolated gate deliberately fails Room Stock after the record is deleted.

Expected:

- record remains deleted;
- Room Stock remains 200 before retry;
- Manager returns `stockQueued: true`;
- difference is `-30`;
- operation type is `ROLLBACK`;
- safe rollback note is preserved;
- Main Stock remains 999.

Expected output:

```text
Vacation Milk isolated write checks passed.
```

## Safety Boundary

The tests:

- do not load FirebaseService;
- do not instantiate the production Repository;
- do not call `fetch`;
- do not use Local Storage or Session Storage;
- do not use room `อ.3-3`;
- do not use room ID `mqn0z13eyx5b`;
- do not use date `2026-07-28`;
- do not change `index.html` or `teacher.html`;
- do not implement or discard deferred photo/signature/report parity.

## Firebase Index Blocker

The read-only browser screenshot confirms that the UI preview works, while history loading currently returns:

```text
Index not defined, add ".indexOn": "roomId", for path "/milkApp/vacationMilk"
```

Do not publish the index until both local tests in this gate pass. After they pass, preserve existing indexes and add only:

```text
/milkApp/vacationMilk → .indexOn ["roomId"]
```

## Decision

Browser issue/delete actions remain prohibited. After these two local gates pass, the next steps are:

1. publish and validate the Vacation Milk room index;
2. run the complete 30-test regression gate;
3. perform desktop and responsive read-only browser validation.

The later Media and Signature Sprint remains mandatory under:

- `docs/TEACHER_LEGACY_PARITY_CONTRACT.md`
