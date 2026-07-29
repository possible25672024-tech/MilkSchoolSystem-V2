# Sprint 4.4 — Pending Milk Isolated Write Gate

Date: 2026-07-29

Branch: `feature/sprint-4.4-pending-milk-ui`

Status: PASS — operational UI and isolated issue/delete/partial-save checks confirmed locally

## Purpose

Validate Pending Milk issue, duplicate prevention, delete rollback, partial-save queue conversion, and Main Stock isolation without Firebase or real classroom data.

## Test Files

- `tests/pending-milk-ui-check.mjs`
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

## Operational UI Gate

Confirmed locally:

```text
Pending Milk UI checks passed.
```

Verified:

- programmatic Pending Milk panel creation
- Teacher-only activation and Admin rejection
- selected-week delegation to Manager
- eligible and already-issued totals
- selectable student/date pairs
- box count equals selected pair count
- explicit issue confirmation
- note delegation
- Room Stock result feedback
- partial-save queue warning
- recent history rendering
- confirmed delete delegation
- Teacher refresh after successful issue and delete
- Logout cleanup
- no direct Firebase, Repository, fetch, browser storage, stock, ledger, or stockLog ownership in the View

## Successful Issue Sequence

The isolated test selects two eligible student/date pairs.

Confirmed:

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

Confirmed:

- Service rejects with `PENDING_SELECTION_INVALID`
- no duplicate record is created
- no additional Room Stock mutation occurs

## Successful Delete and Rollback

The test deletes the successful two-box record.

Confirmed:

- record is deleted before Room Stock restoration
- Room Stock changes `48 → 50`
- ledger type is `ROLLBACK`
- ledger quantity is `2`
- stockLog type is `IN`
- Main Stock remains 999
- issue then delete returns Room Stock to the original baseline

## Partial Issue

The test deliberately fails Room Stock after the compatible Pending Milk record is saved.

Confirmed:

- record remains saved
- Room Stock remains 50 before retry
- Manager returns `stockQueued: true`
- retry difference is `1`
- operation type is `PENDING`
- safe Pending Milk note metadata is preserved
- Main Stock remains 999

## Partial Delete

The test deliberately fails Room Stock after the Pending Milk record is deleted.

Confirmed:

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

## Local Validation

Confirmed locally:

```text
Pending Milk UI checks passed.
Pending Milk isolated write checks passed.
```

The branch was synchronized with origin and the working tree was clean after both tests.

## Safety Boundary

The tests:

- do not load FirebaseService
- do not instantiate a production repository
- do not call `fetch`
- do not use Local Storage or Session Storage
- do not use room `อ.3-3`
- do not use date `2026-07-28`
- do not change `index.html` or `teacher.html`

## Decision

The operational UI and isolated write gates are accepted for the Sprint 4.4 code gate.

Browser Pending Milk writes remain prohibited. The next acceptance step is the complete 22-test regression run, followed by a read-only browser and responsive gate.
