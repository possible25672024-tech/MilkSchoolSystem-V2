# Sprint 4.6 — Vacation Milk Legacy Compatibility Audit

Date: 2026-07-29

Branch: `feature/sprint-4.6-vacation-milk-ui`

Status: PASS — protected `teacher.html` inspected read-only

## Protected Boundary

The legacy source remains unchanged:

- `teacher.html`
- `index.html`

The audit establishes compatibility requirements only. It does not authorize a real Firebase write.

## Teacher Navigation

Legacy Teacher navigation contains:

```text
จ่ายนมช่วงปิดเทอม
```

The page is Teacher-room scoped and is part of the binding parity contract.

## Firebase Path

Legacy Vacation Milk records use:

```text
milkApp/vacationMilk
```

Records use Firebase push IDs.

The modular Repository must read history with a room-scoped query:

```text
orderBy = roomId
equalTo = authenticated room id
```

This query requires:

```text
/milkApp/vacationMilk → .indexOn ["roomId"]
```

before the final browser gate.

## Input and Quantity Rules

Legacy inputs:

- academic year;
- vacation after semester 1 or 2;
- issue date;
- vacation-day count, default 30 and minimum 1;
- optional note.

Quantity formula:

```text
student count × vacation-day count = total boxes
```

Legacy displays:

- student count;
- day count;
- total boxes;
- current Room Stock;
- insufficient-stock warning.

Negative Room Stock is not silently clamped by V2 business rules.

## Student, Signature, and Photo Evidence

Legacy displays the authenticated-room student roster and assigns the selected vacation-day count to every student.

Per-student signature structure:

```text
signatures[studentId] = {
  sig,
  receiverName
}
```

Legacy supports:

- parent/recipient name;
- drawn recipient signature;
- photo evidence, up to five images in the existing UI;
- report rendering of student names, box/day count, parent signature, and photos.

The current Sprint preserves compatible fields and visible student detail. Shared capture, compression, limits, lazy loading, and Queue-safe media handling remain assigned to the mandatory Media and Signature Sprint.

## Compatible Record

Verified fields:

```text
academicYear
semester
date
days
roomId
roomName
teacher
studentCount
totalBoxes
note
signature
signatures
photos
savedAt
```

The modular Service must not rename or remove these fields.

## Issue Operation Order

Legacy order:

1. create `milkApp/vacationMilk` push record;
2. deduct exact `totalBoxes` from Room Stock;
3. create ledger type `VACATION` with negative quantity;
4. retain Main Stock unchanged.

The modular implementation also creates a compatible `OUT` stockLog through the shared audited Room Stock boundary.

## Delete and Rollback Order

Legacy order:

1. verify the record exists and belongs to the active room;
2. block overlapping delete/rollback calls;
3. confirm exact quantity with the Teacher;
4. delete the Vacation Milk record;
5. restore exact `totalBoxes` to Room Stock;
6. create ledger type `ROLLBACK` with positive quantity;
7. retain Main Stock unchanged.

The modular implementation also creates a compatible `IN` stockLog.

## Duplicate Identity

Legacy did not explicitly prevent duplicate save clicks.

Sprint 4.6 adds a Service-level exact duplicate guard using:

```text
roomId + academicYear + semester + issueDate + days
```

This prevents accidental exact double issue while preserving the ability to record a genuinely different issue date or day count.

## History and Report Compatibility

Legacy room history shows:

- academic year and semester;
- issue date;
- day count;
- student count;
- total boxes;
- photo count;
- delete action.

Legacy report filters by academic year and semester and supports A4 output containing:

- school, room, and Teacher identity;
- each issue record;
- student roster;
- per-student box/day count;
- parent signature;
- photo evidence;
- Teacher sign-off area.

Report and print parity remain mandatory under `docs/TEACHER_LEGACY_PARITY_CONTRACT.md` and are not removed by Sprint 4.6.

## Stock Rules

- Vacation Milk deducts Room Stock only.
- Delete restores Room Stock only.
- Main Stock remains unchanged.
- Issue quantity is deducted exactly once.
- Rollback quantity is restored exactly once.
- Audit-only retry must never repeat a successful Room Stock mutation.
- Queue storage key remains `tc_pending_saves_v1`.

## Current Sprint Decision

Accepted for modular implementation:

- Repository path and room query;
- record compatibility;
- exact quantity calculation;
- visible student detail;
- record-first issue and delete;
- Room Stock-only mutation;
- `VACATION`/`ROLLBACK` ledger routing;
- `OUT`/`IN` stockLog routing;
- exact duplicate protection;
- partial-save Queue handoff;
- Main Stock isolation.

Deferred but mandatory:

- parent signature capture;
- photo capture and compression;
- final report and A4 printing;
- physical iPad validation.
