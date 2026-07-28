# Attendance Real-Data Test Incident

Date: 2026-07-28

Branch: `feature/sprint-4.2-attendance-daily-ui`

Status: OPEN — both affected rooms verified read-only; Room A requires one reviewed Attendance delete after backup, but the first recovery attempt was halted because the active Teacher UI did not match the verified Room A state

## Confirmation

The product owner confirmed that the Attendance save/delete validation was performed against real classroom data, not an isolated Firebase project and not an approved disposable room/date.

The product owner also confirmed that neither affected room had an Attendance record for 2026-07-28 before the test.

The observed browser writes cannot be counted as the approved isolated Sprint 4.2 write gate.

## Verified Real Classroom Records

Read-only verification was supplied through direct Firebase REST paths on 2026-07-28.

### Room A — Corrective Delete Required

- room name: `อ.3-3`
- room ID: `mqn0z13eyx5b`
- tested date: `2026-07-28`
- exact Attendance key: `mqn0z13eyx5b_2026-07-28`
- pre-test Attendance state: no record had been checked or saved for this date
- verified current Attendance state: record exists
- verified record class ID: `mqn0z13eyx5b`
- verified record room name: `อ.3-3`
- verified record date: `2026-07-28`
- verified present count: 22
- verified absent count: 3
- verified current Room Stock: 1,253
- observed pre-test Room Stock: 1,275
- verified outstanding Room Stock difference: -22

Assessment:

- the test-created Attendance record is still present
- the Room Stock remains 22 boxes below the verified pre-test value
- because no record existed before the test, the recovery target is no Attendance record and Room Stock 1,275
- Room A requires one reviewed Attendance delete workflow after backup

### Room B — Reconciled at Attendance/Room Stock Level

- room name: `อ.3-4`
- room ID: `mqn0z13emyrc`
- tested date: `2026-07-28`
- exact Attendance key: `mqn0z13emyrc_2026-07-28`
- pre-test Attendance state: no record existed for this date
- observed save: 7 present and 3 absent
- observed Room Stock: `350 → 343`
- observed delete: restored 7 boxes
- verified current Attendance state: `null`
- verified current Room Stock: 350

Assessment:

- the Attendance record is absent, matching the pre-test state
- Room Stock is 350, matching the verified pre-test value
- no additional Attendance or Room Stock correction is required for Room B unless queue, Main Stock, ledger, or stockLog review reveals a mismatch

## Halted Recovery Attempt

A later supplied Teacher UI screenshot did not satisfy the Room A recovery prerequisites:

- the displayed Room Stock was 1,404, not 1,253
- the form displayed 26 students with 0 checked, 0 present, 0 absent, and 26 unchecked
- the verified Room A test record should display 22 present and 3 absent

Decision:

- do not press Save or Delete on that screen
- the active Teacher session or loaded room/date state does not match the verified Room A recovery target
- return to Login and select the exact Teacher account/session for `อ.3-3` / `mqn0z13eyx5b`
- after Login, verify the Teacher header identifies `อ.3-3`
- verify Room Stock is 1,253 before loading the date
- load `2026-07-28` and verify 22 present and 3 absent before any delete

This halted attempt caused no recorded corrective write because the delete prerequisites were not met.

## Immediate Safety Actions

- Stop all additional Save, Edit, and Delete tests against real classroom data except the single reviewed recovery delete for Room A.
- Do not manually delete ledger, stockLog, or transaction-history entries.
- Do not manually rewrite Room Stock or Main Stock.
- Preserve the current Firebase state until export and recovery are completed.
- Keep `index.html` and `teacher.html` available as protected operational and recovery paths.

## Required Backup Before Room A Correction

Before changing Room A:

- export the current Firebase database or at least the complete `milkApp` subtree
- record the export timestamp
- store the export outside the working browser
- do not overwrite the only available backup
- capture the current Main Stock value
- capture the current queue count for room `mqn0z13eyx5b`
- capture related `stockTransactions` and `stockLog` entries around the test time

## Reviewed Recovery Workflow — Room A

Prerequisites:

- Firebase export preserved
- active Teacher header identifies `อ.3-3`
- active session is for room ID `mqn0z13eyx5b`
- current Attendance record still contains 22 present and 3 absent
- current Room Stock is still 1,253
- no legitimate school Attendance should exist for `2026-07-28`

Recovery action:

1. Login as Teacher for room `อ.3-3` / `mqn0z13eyx5b`.
2. Confirm the Teacher header displays `อ.3-3` and Room Stock 1,253.
3. Load date `2026-07-28`.
4. Confirm the form still shows the test-created 22 present and 3 absent record.
5. Press `ลบข้อมูลวันที่เลือก` once.
6. Confirm the deletion once.
7. Do not separately edit Room Stock before or after the delete.

Expected result:

- UI reports restoration of 22 boxes
- Room Stock changes from 1,253 to 1,275
- Attendance key `mqn0z13eyx5b_2026-07-28` becomes absent or `null`
- Main Stock remains unchanged
- no duplicate Room Stock retry remains queued

Stop conditions:

- Teacher header does not identify `อ.3-3`
- Room Stock is not 1,253 before loading or deletion
- the form does not show 22 present and 3 absent
- the delete reports a restoration other than 22
- a queue or error message appears
- another user changed the same room/date after verification

If any stop condition occurs, do not continue. Reconcile from the export, queue, ledger, and stockLog before correction.

## Post-Recovery Verification

Read-only REST checks after Room A delete:

- `milkApp/mcAttendance/mqn0z13eyx5b_2026-07-28` must return `null`
- `milkApp/roomStock/mqn0z13eyx5b` must return `1275`
- `milkApp/mcAttendance/mqn0z13emyrc_2026-07-28` must remain `null`
- `milkApp/roomStock/mqn0z13emyrc` must remain `350`
- Main Stock must remain unchanged
- queue count must not contain a duplicate Room Stock adjustment for either room

## Audit Handling

Do not delete the test-created ledger, stockLog, or rollback entries manually. Retain them as the incident audit trail unless a separate reviewed cleanup procedure is approved.

## Sprint Decision

Sprint 4.2 remains blocked from merge into `develop` until:

- the current Firebase export is preserved
- Room A completes the reviewed delete recovery
- Room A post-recovery REST checks return Attendance `null` and Room Stock `1275`
- Room B remains Attendance `null` and Room Stock `350`
- Main Stock is confirmed unchanged
- queue, ledger, and stockLog are reviewed
- the incident is closed
- the complete write gate is repeated on an isolated or approved disposable target

## Git Working Tree Note

A clean Git working tree confirms that local source files are synchronized. It does not confirm that Firebase classroom data is unchanged or reconciled.
