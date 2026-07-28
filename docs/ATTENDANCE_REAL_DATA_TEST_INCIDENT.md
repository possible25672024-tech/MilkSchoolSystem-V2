# Attendance Real-Data Test Incident

Date: 2026-07-28

Branch: `feature/sprint-4.2-attendance-daily-ui`

Status: DEFERRED BY PRODUCT OWNER — development may continue, but Room A remains a known production-data discrepancy and a room-name mapping mismatch must be resolved before recovery or production use

## Product-Owner Decision

The product owner requested that corrective recovery be postponed so implementation can continue more quickly.

This is accepted as a development-flow decision, not as incident resolution.

The incident remains open and must not be represented as fixed, reconciled, or production-ready.

## Confirmed Current State

Read-only Firebase REST evidence was supplied on 2026-07-28.

### Room A — Known Deferred Discrepancy and Room-Name Mismatch

- user-reported room name: `อ.3-3`
- room ID: `mqn0z13eyx5b`
- affected date: `2026-07-28`
- exact Attendance key: `mqn0z13eyx5b_2026-07-28`
- pre-test Attendance state: no record existed
- current Attendance state: test-created record still exists
- verified record class ID: `mqn0z13eyx5b`
- verified room name stored inside the Attendance record: `อ.3-4`
- verified present count: 22
- verified absent count: 3
- verified savedAt: `2026-07-28T04:55:40.371Z`
- current Room Stock: 1,253
- authoritative pre-test Room Stock from recorded evidence: 1,275
- known Room Stock discrepancy: -22

Critical mapping issue:

- the product owner identifies room ID `mqn0z13eyx5b` as `อ.3-3`
- the saved Attendance payload identifies the same ID as `อ.3-4`
- the authoritative `milkApp/rooms/mqn0z13eyx5b` record must be inspected before any recovery delete
- recovery must use the exact authenticated room ID, not only the displayed room name

Expected future recovery target, subject to room-mapping verification and authoritative reconciliation:

- Attendance key absent or `null`
- Room Stock 1,275
- Main Stock unchanged
- audit history retained

### Room B — Reconciled at Attendance/Room Stock Level

- user-reported room name: `อ.3-4`
- room ID: `mqn0z13emyrc`
- affected date: `2026-07-28`
- exact Attendance key: `mqn0z13emyrc_2026-07-28`
- current Attendance state: `null`
- current Room Stock: 350
- pre-test Room Stock: 350

No additional Attendance or Room Stock correction is currently required for Room B unless later queue or audit review reveals a mismatch.

## Quarantine Rules During Continued Development

Until Room A is corrected:

- do not use room ID `mqn0z13eyx5b` for any further Save, Edit, Delete, queue, retry, or stock tests
- do not use date `2026-07-28` for this room ID as trusted report, Attendance, or stock evidence
- do not manually change Room Stock, Main Stock, ledger, stockLog, or transaction history
- do not remove the incident documentation
- do not represent the current Firebase database as production-ready
- use only mocked, in-memory, isolated Firebase, or explicitly disposable targets for future write validation

## Development Decision

Development on Sprint 4.2 may continue.

The real-data recovery is separated from code implementation and moved to the mandatory pre-production reconciliation checklist.

The unresolved Room A discrepancy and room-name mismatch do not authorize additional writes against the real classroom database.

## Merge and Release Meaning

- feature work may continue on `feature/sprint-4.2-attendance-daily-ui`
- Sprint 4.2 code may be considered for `develop` only after the complete isolated automated write gate passes
- this incident does not permit merge to `main`
- this incident blocks production cutover and official use of the affected Room A data
- Room A recovery must be completed before the affected room/date is used for official Attendance, stock reconciliation, reports, or production acceptance

## Deferred Recovery Workflow — Room A

Before future correction:

1. Export Firebase or at least the complete `milkApp` subtree.
2. Record the export timestamp and keep the backup outside the working browser.
3. Inspect `milkApp/rooms/mqn0z13eyx5b` and confirm the authoritative room name and Teacher mapping.
4. Confirm the active Teacher session uses room ID `mqn0z13eyx5b`.
5. Confirm Room Stock is still 1,253.
6. Load `2026-07-28` and confirm 22 present and 3 absent.
7. Delete the exact Attendance record once through the reviewed Attendance workflow.
8. Do not separately edit Room Stock.

Expected result:

- UI reports restoration of 22 boxes
- Room Stock changes from 1,253 to 1,275
- Attendance key becomes `null`
- Main Stock remains unchanged
- no duplicate Room Stock retry remains queued

Stop if the room mapping is ambiguous or any current value differs from the recorded state. Reconcile from backup, queue, ledger, and stockLog before correction.

## Mandatory Pre-Production Checklist

Before production cutover, `main` merge, or official operational acceptance:

- export and preserve the current Firebase database
- verify authoritative room mappings for `mqn0z13eyx5b` and `mqn0z13emyrc`
- recover Room A or reconcile it against authoritative records
- verify Room A Attendance key is `null`
- verify Room A Room Stock is correct
- verify Room B remains Attendance `null` and Room Stock 350
- verify Main Stock remained unchanged by Attendance testing
- review queue, ledger, stockTransactions, and stockLog
- close this incident explicitly
- ensure no other real classroom test records remain

## Git Working Tree Note

A clean Git working tree confirms that source files are synchronized. It does not confirm that Firebase classroom data is reconciled.
