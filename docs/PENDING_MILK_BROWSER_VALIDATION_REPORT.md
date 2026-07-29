# Sprint 4.4 — Pending Milk Browser Validation Report

Date: 2026-07-29

Branch: `feature/sprint-4.4-pending-milk-ui`

Status: DESKTOP READ-ONLY PASS / FINAL RESPONSIVE DATA RETEST PENDING

## Safety Boundary

Browser validation remained read-only.

Confirmed from the provided evidence:

- no `จ่ายนมค้าง` action was pressed;
- no `ลบและคืนสต็อก` action was pressed;
- no real Queue entry was created or replayed;
- the quarantined room/date was not used as an accepted write target;
- no `POST`, `PUT`, `PATCH`, or `DELETE` request appeared.

The Local Storage queue safety check was completed before Teacher validation. Browser writes remain prohibited.

## Admin Regression — PASS

Observed:

- Admin Login rendered the existing Admin authenticated shell;
- school identity remained visible;
- Pending Milk and Queue Teacher panels did not activate for Admin;
- Console contained only the normal `MilkSchoolSystem V2 Started` message;
- no JavaScript error was visible.

## Teacher Pending Milk Panel — PASS

Observed:

- `จ่ายนมค้างรายสัปดาห์` rendered inside the Teacher shell;
- week date selector rendered;
- `โหลดรายการ` button remained reachable;
- four summary cards rendered;
- note field rendered;
- issue action remained disabled/unpressed;
- latest-room-history area rendered;
- Logout remained reachable;
- Queue panel remained available below the Teacher workflow.

## Attendance Request Scope — PASS

After pressing only `โหลดรายการ`, Network showed five date-scoped Attendance reads for the selected Monday–Friday week.

Examples from the evidence included:

```text
<room-id>_2026-07-20.json
<room-id>_2026-07-21.json
<room-id>_2026-07-22.json
<room-id>_2026-07-23.json
<room-id>_2026-07-24.json
```

A previous selected week similarly showed five exact date reads.

Result: PASS

The Repository is not downloading all Attendance history for this feature.

## Pending Milk Room Query — PASS

The Firebase Realtime Database Rules were published with:

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

The expected room-scoped request then returned HTTP 200:

```text
absentMilk.json?orderBy="roomId"&equalTo="<authenticated-room-id>"
```

Result: PASS

The authenticated-room query completed without downloading the complete cross-room collection.

## Eligibility and History Rendering — PASS

For the selected week, the UI displayed:

```text
มีสิทธิ์รับ 0
เคยรับแล้ว 4
เลือกแล้ว 0
กล่องที่จะหัก 0
```

The correct empty-state message rendered:

```text
ไม่มีนักเรียนที่ขาดและยังไม่ได้รับนมค้างในสัปดาห์นี้
```

The room history rendered an existing record for the same week with four boxes.

The issue action remained disabled because no eligible pair was selected. The visible delete/rollback action was not pressed.

Result: PASS

## Network Mutation Safety — PASS

Visible Network entries were read-only fetches.

Observed:

- five exact Attendance reads;
- one room-scoped `absentMilk` read with HTTP 200;
- normal shell refresh reads;
- no `POST`;
- no `PUT`;
- no `PATCH`;
- no `DELETE`.

Result: PASS

## Console — PASS

After the successful Pending Milk load, Console displayed only the normal startup message:

```text
MilkSchoolSystem V2 Started
```

No JavaScript error or Firebase request error was visible.

Result: PASS

## Responsive Gate at 820 x 1180

Previously confirmed while the Firebase index blocker was visible:

- Attendance rows remained contained;
- Pending Milk week selector and Load button remained reachable;
- four summary cards remained readable;
- note and disabled issue action remained reachable;
- history area and Logout remained contained;
- Queue panel remained visible below the workflow;
- no abnormal horizontal overflow was visible.

Layout result: PASS

One final completed-data screenshot at 820 x 1180 remains required because the successful retest now renders the already-issued count and a real room-history record instead of the earlier error state.

Pending evidence:

- loaded data remains contained at 820 x 1180;
- history record and unpressed delete action remain contained;
- Queue panel and Logout remain reachable;
- Console remains clean;
- no mutation occurs.

## Current Acceptance Decision

Passed:

- Admin shell regression;
- Teacher Pending Milk panel rendering;
- exact five-day Attendance read scope;
- room-scoped indexed `absentMilk` read;
- eligible/already-issued/empty-state rendering;
- room history rendering;
- read-only Network method boundary;
- clean Console;
- prior responsive layout containment.

Remaining:

- one final 820 x 1180 screenshot with the successfully loaded data and clean Console.

Sprint 4.4 remains open until the final completed-data responsive evidence is recorded and the branch remains synchronized with a clean working tree.

This browser gate does not authorize `main`, production cutover, real-classroom write testing, replacement of `teacher.html`, or closure of the deferred real-data incident.
