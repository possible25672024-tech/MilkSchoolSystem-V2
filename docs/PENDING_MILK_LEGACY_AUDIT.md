# Sprint 4.4 — Pending Milk Legacy Compatibility Audit

Date: 2026-07-29

Branch: `feature/sprint-4.4-pending-milk-ui`

Status: COMPLETE — read-only audit of protected `teacher.html`; no legacy file changed

## Source Reviewed

Protected file:

- `teacher.html`

Firebase path:

```text
milkApp/absentMilk
```

## Eligibility Rule

The legacy Teacher workflow:

1. resolves the selected date to Monday–Friday of the same week;
2. reads Attendance keys `{roomId}_{YYYY-MM-DD}` for those five dates;
3. creates one candidate for each student/date pair whose Attendance status is `absent`;
4. scans existing `absentMilk` records for the authenticated room;
5. excludes every student/date pair already present in `record.students[studentId].days`.

One eligible student/date pair equals one milk box.

## Legacy Record Shape

The protected runtime pushes one record under `milkApp/absentMilk`:

```js
{
  weekStart,
  weekEnd,
  roomId,
  roomName,
  teacher,
  date,
  students: {
    [studentId]: {
      name,
      days: ["YYYY-MM-DD"]
    }
  },
  totalBoxes,
  note,
  signature: "",
  signatures: {},
  photos: [],
  savedAt
}
```

Record IDs are Firebase push IDs. Sprint 4.4 preserves this instead of introducing a new key format.

## Stock and Audit Behavior

Issue:

- save `absentMilk` record first;
- deduct `totalBoxes` from Room Stock;
- Main Stock remains unchanged;
- create ledger type `PENDING` with negative quantity and `referenceId` equal to the pushed record ID.

Delete:

- delete the selected `absentMilk` record;
- restore its `totalBoxes` to Room Stock;
- Main Stock remains unchanged;
- create ledger type `ROLLBACK` with positive quantity and `referenceId` equal to the deleted record ID;
- duplicate delete/rollback is blocked while the same ID is in flight.

The V2 implementation also creates a compatible stockLog record so operational audit evidence is consistent with Attendance and recovery workflows.

## Week Calculation

Legacy behavior uses Monday through Friday only. Saturday and Sunday are not included in Pending Milk eligibility.

The V2 Service uses UTC-safe date arithmetic to preserve the same five dates without timezone shifts.

## Scoped Read Decision

Attendance:

- exact five child keys only;
- no full-room or full-school Attendance history read.

Pending Milk:

- room-scoped query using `orderBy: "roomId"` and `equalTo: roomId`;
- no intentional full-school `absentMilk` read.

## Sprint 4.4 Compatibility Decisions

- preserve `milkApp/absentMilk`;
- preserve Firebase push IDs;
- preserve `students[studentId].days` duplicate identity;
- preserve `weekStart`, `weekEnd`, issue `date`, `totalBoxes`, `note`, `signature`, `signatures`, `photos`, and `savedAt`;
- preserve issue order: record first, protected Room Stock update second;
- preserve delete order: record delete first, protected Room Stock restoration second;
- preserve Main Stock delta zero;
- use Service-level duplicate recheck immediately before save;
- use only isolated/in-memory write validation.

## Known Recovery Work Still Required

The existing generic Room Stock queue currently replays through the Attendance adjustment path. Sprint 4.4 must extend its safe metadata/routing so a queued Pending Milk retry produces ledger type `PENDING` or `ROLLBACK`, not `ATTENDANCE`.

Until that routing and its tests pass, the Pending Milk partial-save recovery gate remains open and the browser write gate must not start.

## Incident Quarantine

Do not use:

- room `อ.3-3`;
- room ID `mqn0z13eyx5b`;
- date `2026-07-28`.

The existing real-data incident remains open and blocks production cutover.
