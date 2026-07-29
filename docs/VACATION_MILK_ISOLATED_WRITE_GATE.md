# Sprint 4.6 — Vacation Milk UI and Isolated Write Gate

Date: 2026-07-29

Branch: `feature/sprint-4.6-vacation-milk-ui`

Status: PASS — operational UI and isolated issue/delete/partial-save checks confirmed locally

## Purpose

Validate the operational Teacher UI, successful issue/delete behavior, exact duplicate protection, partial-save Queue conversion, visible student detail, and Main Stock isolation without Firebase or real classroom writes.

## Test Files

- `tests/vacation-milk-ui-check.mjs`
- `tests/vacation-milk-isolated-write-check.mjs`

## Confirmed Local Output

```text
Vacation Milk UI checks passed.
Vacation Milk isolated write checks passed.
```

The feature branch was synchronized with origin at the reported validation point.

A diagnostic file named `vacation-ui-error.txt` was created only while investigating the failed assertion. It is not a product artifact and must remain untracked or be removed before the final clean-tree gate.

## Operational UI Gate — PASS

Verified:

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
- successful and queued result messages remain visible after automatic history refresh;
- Teacher stock refresh after issue/delete;
- Logout cleanup;
- no direct Firebase, Repository, browser storage, QueueStorage, stock, ledger, stockLog, or retry ownership in the View.

## Isolated Successful Issue — PASS

In-memory baseline:

- room ID: `isolated-vacation-room`;
- three students;
- 30 vacation days;
- Room Stock: 200;
- Main Stock: 999.

Confirmed:

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

## Exact Duplicate Protection — PASS

The same combination was rejected:

```text
roomId + academicYear + semester + issueDate + days
```

Confirmed error:

```text
VACATION_DUPLICATE_ISSUE
```

No extra record or Room Stock mutation occurred.

## Successful Delete and Rollback — PASS

Confirmed:

- record deleted before stock restoration;
- Room Stock `110 → 200`;
- ledger type `ROLLBACK`, quantity `90`;
- stockLog type `IN`, quantity `90`;
- Main Stock remains 999.

## Partial Issue — PASS

The isolated gate deliberately failed Room Stock after a compatible 30-box record was saved.

Confirmed:

- record remained saved;
- Room Stock remained 200 before retry;
- Manager returned `stockQueued: true`;
- difference was `30`;
- operation type was `VACATION`;
- safe Vacation Milk note was preserved;
- Main Stock remained 999.

## Partial Delete — PASS

The isolated gate deliberately failed Room Stock after the record was deleted.

Confirmed:

- record remained deleted;
- Room Stock remained 200 before retry;
- Manager returned `stockQueued: true`;
- difference was `-30`;
- operation type was `ROLLBACK`;
- safe rollback note was preserved;
- Main Stock remained 999.

## Firebase Index Validation — PASS

The product owner published:

```text
/milkApp/vacationMilk → .indexOn ["roomId"]
```

Read-only browser validation returned HTTP 200 for the room-scoped Vacation Milk history query. The previous HTTP 400 index blocker is closed.

Artifact:

- `docs/FIREBASE_RULES_VACATION_MILK_INDEX.md`

## Safety Boundary

The automated tests:

- did not load FirebaseService;
- did not instantiate the production Repository;
- did not call `fetch`;
- did not use Local Storage or Session Storage;
- did not use room `อ.3-3`;
- did not use room ID `mqn0z13eyx5b`;
- did not use date `2026-07-28`;
- did not change `index.html` or `teacher.html`;
- did not implement or discard deferred photo/signature/report parity.

The browser index validation was read-only and did not press issue, delete, or Queue retry.

## Decision

The Vacation Milk operational UI, isolated issue/delete/partial-save gate, and Firebase room-index gate are accepted.

Browser issue/delete actions remain prohibited. The next acceptance step is the complete 30-test regression run, followed by final desktop Console and 820 x 1180 responsive read-only validation.

The later Media and Signature Sprint remains mandatory under:

- `docs/TEACHER_LEGACY_PARITY_CONTRACT.md`
