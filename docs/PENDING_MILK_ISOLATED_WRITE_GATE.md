# Sprint 4.4 — Pending Milk Isolated Write Gate

Date: 2026-07-29

Branch: `feature/sprint-4.4-pending-milk-ui`

Status: IMPLEMENTED / LOCAL EXECUTION PENDING

## Purpose

Validate Pending Milk issue, duplicate prevention, delete rollback, partial-save queue conversion, and Main Stock isolation without Firebase or real classroom data.

## Test File

- `tests/pending-milk-isolated-write-check.mjs`

## In-Memory Baseline

- room ID: `isolated-pending-room`
- Room Stock: 50
- Main Stock: 999
- two students
- exact Monday–Friday Attendance fixture
- no existing Pending Milk records
- empty audit list
- empty retry list

## Successful Issue Sequence

The test selects two eligible student/date pairs.

Expected:

- one pair equals one box
- Pending Milk record is created before Room Stock work
- `totalBoxes` equals 2
- compatible `students[studentId].days` structure is preserved
- `signature`, `signatures`, and `photos` remain compatible
- Room Stock changes `50 → 48`
- ledger type is `PENDING`
- ledger quantity is `-2`
- stockLog type is `OUT`
- Main Stock remains 999

## Duplicate Protection

The test attempts to issue one of the same student/date pairs again.

Expected:

- Service rejects with `PENDING_SELECTION_INVALID`
- no duplicate record is created
- no additional Room Stock mutation occurs

## Successful Delete and Rollback

The test deletes the successful two-box record.

Expected:

- record is deleted before Room Stock restoration
- Room Stock changes `48 → 50`
- ledger type is `ROLLBACK`
- ledger quantity is `2`
- stockLog type is `IN`
- Main Stock remains 999
- issue then delete returns Room Stock to the original baseline

## Partial Issue

The test deliberately fails Room Stock after the compatible Pending Milk record is saved.

Expected:

- record remains saved
- Room Stock remains 50 before retry
- Manager returns `stockQueued: true`
- retry difference is `1`
- operation type is `PENDING`
- safe Pending Milk note metadata is preserved
- Main Stock remains 999

## Partial Delete

The test deliberately fails Room Stock after the Pending Milk record is deleted.

Expected:

- record remains deleted
- Room Stock remains 50 before retry
- Manager returns `stockQueued: true`
- retry difference is `-1`
- operation type is `ROLLBACK`
- safe rollback note metadata is preserved
- Main Stock remains 999

## Audit Boundary

Successful issue and delete create exactly one audit pair each.

The separate recovery-routing gate validates:

- failed Pending audit conversion to audit-only queue work
- preservation of PENDING/ROLLBACK audit payloads
- no repeated Room Stock mutation during audit-only retry

## Safety Boundary

The test:

- does not load FirebaseService
- does not instantiate a production repository
- does not call `fetch`
- does not use Local Storage or Session Storage
- does not use room `อ.3-3`
- does not use date `2026-07-28`
- does not change `index.html` or `teacher.html`

## Local Commands

```powershell
node tests/pending-milk-ui-check.mjs
node tests/pending-milk-isolated-write-check.mjs
```

Browser Pending Milk writes remain prohibited until both tests pass locally and the full regression gate is complete.
