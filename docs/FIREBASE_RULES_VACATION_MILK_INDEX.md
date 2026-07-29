# Firebase Realtime Database — Vacation Milk Room Index

Date: 2026-07-29

Branch: `feature/sprint-4.6-vacation-milk-ui`

Status: PUBLISHED AND VALIDATED

## Published Rule

The product owner preserved the existing room indexes and published:

```json
{
  "rules": {
    ".read": true,
    ".write": true,
    "milkApp": {
      "absentMilk": {
        ".indexOn": ["roomId"]
      },
      "retroMilk": {
        ".indexOn": ["roomId"]
      },
      "vacationMilk": {
        ".indexOn": ["roomId"]
      }
    }
  }
}
```

## Browser Validation

Validated from the local V2 Teacher page with a non-quarantined room.

The Vacation Milk preview displayed:

```text
16 students × 30 days = 480 boxes
Room Stock = 476
```

The student roster and per-student quantity were visible.

The room-scoped history request returned:

```text
Method: GET
Status: 200
Path: /milkApp/vacationMilk.json
Query: orderBy="roomId" and equalTo="<authenticated-room-id>"
```

The response contained no records for the selected room, and the UI correctly rendered:

```text
โหลดประวัติแล้ว 0 รายการ
ยังไม่มีรายการนมช่วงปิดเทอม
```

No Vacation Milk record was created, deleted, or replayed during this read-only validation.

## Index Decision

The previous HTTP 400 index blocker is closed.

The indexed room-scoped request is accepted for Sprint 4.6 regression and final browser validation.

## Security Boundary

The root rules still contain:

```text
.read = true
.write = true
```

The query index improves query validity and performance only. It does not provide authentication or authorization and does not resolve the production-security blocker.

## Protected Safety Boundary

The validation did not use:

- room `อ.3-3`;
- room ID `mqn0z13eyx5b`;
- date `2026-07-28`;
- the Vacation Milk issue button;
- Vacation Milk delete/rollback;
- Queue replay;
- direct Firebase data mutation.
