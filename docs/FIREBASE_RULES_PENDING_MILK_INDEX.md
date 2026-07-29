# Firebase Realtime Database Rule Requirement — Pending Milk Room Index

Date: 2026-07-29

Branch: `feature/sprint-4.4-pending-milk-ui`

Status: PUBLISHED / READ-ONLY QUERY VALIDATED

## Initial Browser Evidence

The Sprint 4.4 read-only browser gate reached the correct room-scoped query:

```text
/milkApp/absentMilk.json?orderBy="roomId"&equalTo="<authenticated-room-id>"
```

Firebase initially returned HTTP 400:

```text
Index not defined, add ".indexOn": "roomId", for path "/milkApp/absentMilk", to the rules
```

The five date-scoped Attendance reads completed with HTTP 200. No Pending Milk mutation was performed.

## Root Cause

`PendingMilkRepository.loadRoomPendingRecords()` intentionally queries `milkApp/absentMilk` by the child field `roomId` so the Teacher UI does not download every room's Pending Milk history.

Firebase Realtime Database REST queries that use `orderBy` require the queried child key to be declared with `.indexOn` at the collection path.

This was an environment Rules requirement, not a UI, Service, Manager, or Repository logic defect.

## Published Rules Merge

The Firebase Realtime Database Rules now include:

```json
{
  "rules": {
    ".read": true,
    ".write": true,
    "milkApp": {
      "absentMilk": {
        ".indexOn": ["roomId"]
      }
    }
  }
}
```

The index was merged into the existing Rules document without removing the existing root permissions.

The root-level public test permissions remain a separate security concern and are not approved for production cutover.

## Validation After Publish

Confirmed from the read-only browser retest:

- five exact date-scoped Attendance reads returned HTTP 200;
- the room-scoped `absentMilk` query returned HTTP 200;
- the Pending Milk UI completed eligibility and already-issued calculations;
- the selected week displayed `มีสิทธิ์รับ 0` and `เคยรับแล้ว 4`;
- the correct empty-state message rendered for the selected week;
- room history rendered an existing four-box record;
- the issue button remained disabled/unpressed;
- the delete/rollback action remained unpressed;
- no `POST`, `PUT`, `PATCH`, or `DELETE` appeared;
- Console contained no JavaScript error.

## Required Continuing Safety

Do not remove `orderBy`/`equalTo` and download all `absentMilk` records. That would weaken the authenticated-room payload boundary and degrade performance as data grows.

Before future Teacher browser validation:

1. confirm `tc_pending_saves_v1` is absent or `[]`;
2. use a non-quarantined room;
3. keep Pending Milk validation read-only unless a later isolated environment is explicitly approved;
4. do not press `จ่ายนมค้าง` or `ลบและคืนสต็อก` against real classroom data.

## Safety Boundary

The quarantined real-data target remains excluded:

- room `อ.3-3`
- room ID `mqn0z13eyx5b`
- date `2026-07-28`

No application code, protected legacy file, real Pending Milk record, Room Stock, Main Stock, queue, ledger, or stockLog was changed while publishing and validating the index.
