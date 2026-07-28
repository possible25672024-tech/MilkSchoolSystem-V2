# Attendance Real-Data Test Incident

Date: 2026-07-28

Branch: `feature/sprint-4.2-attendance-daily-ui`

Status: OPEN — affected rooms identified; read-only verification, backup, and reconciliation are still required

## Confirmation

The product owner confirmed that the Attendance save/delete validation was performed against real classroom data, not an isolated Firebase project and not an approved disposable room/date.

The product owner also confirmed that neither affected room had an Attendance record for 2026-07-28 before the test.

The observed browser writes cannot be counted as the approved isolated Sprint 4.2 write gate.

## Affected Real Classroom Records

### Room A — Created Test Record Still Requires Verification and Recovery

- room name: `อ.3-3`
- room ID: `mqn0z13eyx5b`
- tested date: `2026-07-28`
- exact Attendance key: `mqn0z13eyx5b_2026-07-28`
- pre-test Attendance state: no record had been checked or saved for this date
- observed save: 22 present and 3 absent
- observed Room Stock: `1,275 → 1,253`
- observed Room Stock difference: `-22`, matching the present count
- delete evidence: not supplied for this room

Current assessment:

- the test appears to have created a new real Attendance record where no record existed before
- the displayed Room Stock appears to remain 22 boxes below the pre-test displayed value unless another later operation changed it
- this room requires backup and read-only verification before any corrective delete or stock recovery

Expected recovery target, subject to read-only verification:

- Attendance key absent, because no record existed before the test
- Room Stock restored to the authoritative pre-test value, expected from the supplied evidence to be 1,275 boxes
- Main Stock unchanged
- test-created ledger and stockLog entries retained and documented unless a separate approved audit-cleanup procedure is defined

### Room B — Save Followed by Delete, Probable Reversal Pending Verification

- room name: `อ.3-4`
- room ID: `mqn0z13emyrc`
- tested date: `2026-07-28`
- exact Attendance key: `mqn0z13emyrc_2026-07-28`
- pre-test Attendance state: no record existed for this date
- observed save: 7 present and 3 absent
- observed Room Stock: `350 → 343`
- observed delete: restored 7 boxes
- observed final Room Stock: `343 → 350`

Current assessment:

- the delete reversed the immediately preceding 7-box Room Stock deduction at the displayed UI-result level
- because no Attendance record existed before the test, the expected final Attendance state is no record
- this room is probably restored, but must still be verified read-only

Expected reconciled state:

- Attendance key absent
- Room Stock 350 boxes, unless authoritative school records show another valid operation after the test
- Main Stock unchanged
- no pending queue item for this Attendance operation

## Immediate Safety Actions

- Stop all additional Save, Edit, and Delete tests against real classroom data.
- Do not manually delete ledger, stockLog, or transaction-history entries.
- Do not manually rewrite Room Stock or Main Stock.
- Preserve the current Firebase state until export and read-only verification are completed.
- Keep `index.html` and `teacher.html` available as protected operational and recovery paths.

## Required Backup Before Correction

Before changing Room A or Room B:

- export the current Firebase database or at least the complete `milkApp` subtree
- record the export timestamp
- store the export outside the working browser
- do not overwrite the only available backup
- capture the current values for both Attendance keys, both Room Stock values, Main Stock, queue count, ledger, and stockLog

## Read-Only Verification Checklist

### Room A — `อ.3-3`

Read only:

1. `milkApp/mcAttendance/mqn0z13eyx5b_2026-07-28`
2. `milkApp/roomStock/mqn0z13eyx5b`
3. `milkApp/stock`
4. queue count for room `mqn0z13eyx5b`
5. related `stockTransactions` and `stockLog` entries around the test time

Confirm:

- whether the Attendance key currently exists
- whether it contains 22 present and 3 absent
- whether Room Stock is currently 1,253
- whether Main Stock is unchanged from the authoritative value
- whether a Room Stock or audit retry remains queued
- whether another user changed this room/date after the test

### Room B — `อ.3-4`

Read only:

1. `milkApp/mcAttendance/mqn0z13emyrc_2026-07-28`
2. `milkApp/roomStock/mqn0z13emyrc`
3. `milkApp/stock`
4. queue count for room `mqn0z13emyrc`
5. related `stockTransactions` and `stockLog` entries around the test time

Confirm:

- Attendance key is absent or null
- Room Stock is 350
- Main Stock is unchanged from the authoritative value
- no Room Stock or audit retry remains queued
- delete and rollback audit records are present and internally consistent

## Recovery Decision

### Room A — Required Corrective Workflow

After backup and read-only verification, if the exact Attendance key exists with the test-created record and no legitimate school Attendance should exist for 2026-07-28:

- use one reviewed Attendance delete workflow that removes the exact key and restores its current recorded present count exactly once
- verify the result reports restoration of 22 boxes when the current record still contains 22 present students
- verify Room Stock returns from 1,253 to 1,275, unless authoritative records establish a different current value
- verify Main Stock does not change
- verify the Attendance key becomes absent
- verify no duplicate Room Stock adjustment remains queued

Do not separately edit Room Stock before or after the Attendance delete. Doing both would restore stock twice.

If the current key no longer matches the observed 22-present record, stop and reconcile from the backup and audit history before any correction.

### Room B — Verification-Only Unless a Mismatch Is Found

If the Attendance key is absent, Room Stock is 350, Main Stock is unchanged, and no retry is queued:

- no further corrective write is required
- retain the incident and audit entries as the record of the test

If any value differs, stop and review the backup, queue, ledger, and stockLog before correction.

## Sprint Decision

Sprint 4.2 remains blocked from merge into `develop` until:

- both affected rooms complete read-only verification
- the current Firebase export is preserved
- Room A is corrected through one reviewed Attendance delete workflow when required
- Room B is confirmed reconciled or corrected if a mismatch is found
- Room Stock and Main Stock are reconciled
- queue, ledger, and stockLog are reviewed
- the incident is closed
- the complete write gate is repeated on an isolated or approved disposable target

## Git Working Tree Note

A clean Git working tree confirms that local source files are synchronized. It does not confirm that Firebase classroom data is unchanged or reconciled.
