# Attendance Real-Data Test Incident

Date: 2026-07-28

Branch: `feature/sprint-4.2-attendance-daily-ui`

Status: OPEN — production classroom data requires read-only verification and reconciliation review

## Confirmation

The product owner confirmed that the Attendance save/delete validation was performed against real classroom data, not an isolated Firebase project and not an approved disposable room/date.

This means the observed browser writes cannot be counted as the approved isolated Sprint 4.2 write gate.

## Observed Actions

Evidence supplied in screenshots shows:

1. One successful save reported 22 present and 3 absent students.
2. That save reported Room Stock `1,275 → 1,253`, a decrease of 22.
3. A later successful save reported 7 present and 3 absent students.
4. That save reported Room Stock `350 → 343`, a decrease of 7.
5. Delete required confirmation for Attendance date `2026-07-28`.
6. Delete reported restoration of 7 boxes.
7. Delete reported Room Stock `343 → 350`.
8. Console remained free of visible application JavaScript errors.

## Current Assessment

The final displayed Room Stock for the second observed sequence returned to its displayed pre-save value of 350 boxes.

This is evidence that the delete operation reversed the immediately preceding 7-box Room Stock deduction at the UI-result level.

It does not prove that the real classroom data is fully restored because the screenshots do not establish:

- whether an Attendance record already existed before the test
- the exact Attendance key and record before the first write
- the exact Attendance record after deletion
- Main Stock before and after
- queue state before and after
- ledger and stockLog entries
- whether the first 22-present save and the later 7-present save involved the same room
- whether other users wrote to the same room/date during the test

If no Attendance record existed before the tested save, deletion may have returned the date to its original no-record state.

If a valid Attendance record existed before the tested save, the delete may have removed that real record. In that case, the record must be restored through an approved recovery workflow that also preserves Room Stock consistency.

## Immediate Safety Actions

- Stop all additional Save, Edit, and Delete tests against real classroom data.
- Do not manually delete ledger, stockLog, or transaction history entries.
- Do not manually rewrite Room Stock or Main Stock without an exported backup and a documented reconciliation plan.
- Preserve the current Firebase state until read-only verification is completed.
- Keep `index.html` and `teacher.html` available as protected operational and recovery paths.

## Required Read-Only Verification

Use the affected real room and date only for reads.

Record:

1. room ID and room name
2. tested Attendance date
3. whether `mcAttendance/{roomId}_{YYYY-MM-DD}` currently exists
4. current Attendance present/absent totals and notes
5. authoritative expected Attendance for that room/date from school records
6. current Room Stock and the authoritative expected Room Stock
7. current Main Stock and the authoritative expected Main Stock
8. current queue count
9. related ledger, stockTransactions, and stockLog entries around the test time
10. whether the 22-present and 7-present observations came from the same room or different rooms

## Backup Before Correction

Before any correction:

- export the current Firebase database or at least the affected `milkApp` subtree
- record the export timestamp
- retain the export outside the working browser
- do not overwrite the only available backup

## Recovery Decision

### Case A — No Real Attendance Existed Before Testing

If authoritative records confirm that no Attendance record should exist for the tested date and Room Stock is back at the authoritative value, no Attendance rewrite may be required.

Audit entries produced by the test should remain documented. Do not erase them without a separate approved audit-cleanup procedure.

### Case B — A Real Attendance Record Existed Before Testing

If a real record should exist but is now missing or incorrect:

- restore the Attendance record from an authoritative source or backup
- apply the matching Room Stock effect exactly once
- verify Main Stock remains unchanged
- verify ledger and stockLog consistency
- avoid restoring Attendance alone when Room Stock already reflects a different state

Use the protected operational workflow or a reviewed recovery script after backup. Do not patch isolated Firebase nodes ad hoc.

## Sprint Decision

Sprint 4.2 remains blocked from merge into `develop` until:

- the affected real classroom data is verified
- any required correction is completed and reviewed
- Room Stock and Main Stock are reconciled
- the incident is closed
- the complete write gate is repeated on an isolated or approved disposable target

## Git Working Tree Note

A clean Git working tree confirms that local source files are synchronized. It does not confirm that Firebase classroom data is unchanged or reconciled.
