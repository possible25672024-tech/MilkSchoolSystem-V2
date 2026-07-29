# Firebase Realtime Database Rule Requirement — Pending Milk Room Index

Date: 2026-07-29

Branch: `feature/sprint-4.4-pending-milk-ui`

Status: REQUIRED ENVIRONMENT CONFIGURATION

## Browser Evidence

The Sprint 4.4 read-only browser gate reached the correct room-scoped query:

```text
/milkApp/absentMilk.json?orderBy="roomId"&equalTo="<authenticated-room-id>"
```

Firebase returned HTTP 400:

```text
Index not defined, add ".indexOn": "roomId", for path "/milkApp/absentMilk", to the rules
```

The five date-scoped Attendance reads completed with HTTP 200. No Pending Milk mutation was performed.

## Root Cause

`PendingMilkRepository.loadRoomPendingRecords()` intentionally queries `milkApp/absentMilk` by the child field `roomId` so the Teacher UI does not download every room's Pending Milk history.

Firebase Realtime Database REST queries that use `orderBy` require the queried child key to be declared with `.indexOn` at the collection path.

This is an environment Rules requirement, not a UI, Service, Manager, or Repository logic defect.

## Required Rules Merge

Add this index under the existing `rules` object. Preserve every existing `.read`, `.write`, validation, and other index rule.

```json
{
  "rules": {
    "milkApp": {
      "absentMilk": {
        ".indexOn": ["roomId"]
      }
    }
  }
}
```

This snippet is a merge fragment. Do not replace a complete existing Rules document with the fragment when other rules already exist.

For a database that currently uses root-level public test permissions, the resulting structure may look like:

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

Public root permissions are not introduced or recommended by this document; the example only shows how to preserve an already-existing test configuration while adding the required index.

## Firebase Console Procedure

1. Open the Firebase project used by `index-v2.html`.
2. Open Realtime Database.
3. Open the Rules tab.
4. Locate the existing `rules` object.
5. Merge `milkApp → absentMilk → .indexOn: ["roomId"]` into it.
6. Preserve all existing permission and validation rules.
7. Publish the Rules.

## Read-Only Retest

After Rules publish:

1. reload `index-v2.html`;
2. confirm `tc_pending_saves_v1` is absent or `[]` before Teacher Login;
3. use a non-quarantined room;
4. clear Network;
5. press only `โหลดรายการ`;
6. verify exactly five date-scoped Attendance reads return 200;
7. verify the room-scoped `absentMilk` request returns 200;
8. verify no `POST`, `PUT`, `PATCH`, or `DELETE` appears;
9. verify the UI shows an eligible/already-issued/empty result rather than a Firebase index error;
10. verify Console is clean.

Do not press `จ่ายนมค้าง` or `ลบและคืนสต็อก`.

## Rejected Workaround

Do not remove `orderBy`/`equalTo` and download all `absentMilk` records merely to bypass the index requirement. That would weaken the authenticated-room payload boundary and degrade performance as data grows.

## Safety Boundary

The quarantined real-data target remains excluded:

- room `อ.3-3`
- room ID `mqn0z13eyx5b`
- date `2026-07-28`

No application code, protected legacy file, real Pending Milk record, Room Stock, Main Stock, queue, ledger, or stockLog was changed while diagnosing this blocker.
