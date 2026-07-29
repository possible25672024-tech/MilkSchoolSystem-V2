# Sprint 4.5 — Retroactive Milk Legacy Compatibility Audit

Date: 2026-07-29

Branch: `feature/sprint-4.5-retroactive-milk-ui`

Status: PASS — protected legacy behavior recorded read-only

## Protected Source

`teacher.html` was inspected read-only. It was not changed.

## User Workflow

The legacy Teacher page exposes:

```text
จ่ายนมย้อนหลัง
```

The form contains:

- academic year;
- semester;
- issue date;
- authenticated room name;
- retroactive start date;
- retroactive end date;
- student count;
- Monday–Friday day count;
- total box count;
- debt box count;
- optional note;
- per-student signatures;
- photos;
- save and cancel actions;
- recent history;
- print/report controls.

Signature/photo capture and printing expansion remain outside Sprint 4.5. The compatible record fields remain preserved.

## Quantity Calculation

Legacy calculation:

```text
weekday dates between start and end, inclusive
×
authenticated-room student count
=
totalBoxes
```

Saturday and Sunday are excluded.

At issue time:

```text
debtBoxes = totalBoxes
status = debt
```

## Firebase Schema

Path:

```text
milkApp/retroMilk
```

Record key:

```text
Firebase push ID
```

Compatible record fields:

```text
academicYear
semester
date
retroStart
retroEnd
roomId
roomName
teacher
studentCount
days
totalBoxes
debtBoxes
status
note
signature
signatures
photos
savedAt
```

## Successful Issue Order

1. Validate required fields and student roster.
2. Calculate Monday–Friday dates and total boxes.
3. Push the compatible record to `milkApp/retroMilk`.
4. Deduct the exact quantity from Room Stock.
5. Create a ledger entry with type `RETRO` and negative quantity.
6. Keep Main Stock unchanged.

The modular implementation additionally creates the compatible `OUT` stockLog through the existing shared stock boundary.

## Successful Delete Order

1. Confirm that the record still exists.
2. Prevent overlapping delete/rollback calls.
3. Delete the exact `retroMilk` record.
4. Restore the exact `totalBoxes` quantity to Room Stock.
5. Create a ledger entry with type `ROLLBACK` and positive quantity.
6. Keep Main Stock unchanged.

The modular implementation additionally creates the compatible `IN` stockLog through the existing shared stock boundary.

## History Boundary

Legacy history is filtered to the authenticated room and sorted by saved time. It displays:

- academic year and semester;
- issue date;
- retroactive range;
- weekday count;
- total boxes;
- signature completion;
- debt/paid status;
- print and delete actions.

The modular View initially preserves operational history, quantities, debt state, and delete/rollback. Printing and media capture remain deferred.

## Duplicate Safety

Because the legacy operation covers every current student in the authenticated room, the modular Service rejects an exact duplicate of:

```text
roomId + academicYear + semester + retroStart + retroEnd
```

This prevents an identical room/range from deducting Room Stock twice while preserving distinct academic periods or ranges.

## Stock Rules

- Retroactive Milk deducts Room Stock only.
- Delete restores Room Stock only.
- Main Stock delta is always zero.
- Negative Room Stock is not silently clamped.
- ETag conflict handling remains owned by the completed shared stock Service.
- Audit-only retry must never repeat a successful Room Stock mutation.

## Queue Compatibility

Partial issue requires typed Queue work:

```text
operationType: RETRO
difference: totalBoxes
```

Partial delete requires:

```text
operationType: ROLLBACK
difference: -totalBoxes
```

The Queue key remains:

```text
tc_pending_saves_v1
```

Typed `RETRO` routing is a pending Sprint gate. Real browser writes remain prohibited until it passes.

## Safety Decision

The legacy compatibility audit is accepted as the source of truth for Sprint 4.5 implementation.

The following remain protected:

- `index.html`;
- `teacher.html`;
- Firebase paths;
- Room Stock-only behavior;
- Main Stock isolation;
- deferred incident quarantine;
- rollback capability.
