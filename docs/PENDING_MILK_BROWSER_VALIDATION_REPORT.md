# Sprint 4.4 — Pending Milk Browser Validation Report

Date: 2026-07-29

Branch: `feature/sprint-4.4-pending-milk-ui`

Status: PARTIAL PASS / BLOCKED BY FIREBASE RULES INDEX

## Safety Boundary

Browser validation remained read-only.

Confirmed from the provided evidence:

- no `จ่ายนมค้าง` action was pressed;
- no `ลบและคืนสต็อก` action was pressed;
- no real Queue entry was created or replayed;
- the quarantined room/date was not used as an accepted write target;
- no `POST`, `PUT`, `PATCH`, or `DELETE` request appeared.

The Local Storage queue safety check was completed before Teacher validation in the preceding gate sequence. Browser writes remain prohibited.

## Admin Regression — PASS

Observed:

- Admin Login rendered the existing Admin authenticated shell;
- school identity remained visible;
- Pending Milk and Queue Teacher panels did not activate for Admin;
- Console contained only the normal `MilkSchoolSystem V2 Started` message;
- no JavaScript error was visible.

Admin Logout evidence was previously established in the completed Sprint 4.3 gate and the current Admin shell remained unchanged.

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
<room-id>_2026-07-27.json
<room-id>_2026-07-28.json
<room-id>_2026-07-29.json
<room-id>_2026-07-30.json
<room-id>_2026-07-31.json
```

A second selected week similarly showed five exact date reads.

Result: PASS

The Repository is not downloading all Attendance history for this feature.

## Pending Milk Room Query — BLOCKED

The expected room-scoped request was issued:

```text
absentMilk.json?orderBy="roomId"&equalTo="<authenticated-room-id>"
```

Firebase returned HTTP 400:

```text
Index not defined, add ".indexOn": "roomId", for path "/milkApp/absentMilk", to the rules
```

Result: BLOCKED BY ENVIRONMENT CONFIGURATION

The application displayed the same index error safely in the Pending Milk panel. No fallback write or mutation occurred.

Required environment change:

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

This must be merged into the existing Firebase Realtime Database Rules without replacing existing permissions or validation rules.

Artifact:

- `docs/FIREBASE_RULES_PENDING_MILK_INDEX.md`

## Network Mutation Safety — PASS

Visible Network entries were read-only fetches.

Observed:

- five exact Attendance reads;
- one attempted room-scoped `absentMilk` read;
- no `POST`;
- no `PUT`;
- no `PATCH`;
- no `DELETE`.

Result: PASS

## Eligibility Rendering — NOT YET VALIDATED

Because the room-scoped `absentMilk` query was rejected by Firebase Rules, the UI could not complete the already-issued exclusion and eligibility rendering step.

Pending after index publish:

- eligible student/date rows or correct empty state;
- already-issued count;
- history records for the authenticated room;
- no Firebase error message;
- clean Console after Load.

## Responsive Gate at 820 x 1180 — LAYOUT PASS / DATA GATE BLOCKED

Observed:

- Attendance rows remained contained;
- Pending Milk week selector and Load button remained reachable;
- four summary cards remained readable;
- note and disabled issue action remained reachable;
- history area and Logout remained contained;
- Queue panel remained visible below the workflow;
- no abnormal horizontal overflow was visible.

The Firebase index error also remained readable and contained at 820 x 1180.

Responsive layout result: PASS

Responsive completed-data result: PENDING AFTER RULES INDEX

## Console Decision

Before the Pending Milk load, the Console showed no JavaScript error.

The failed Firebase REST request is an expected environment blocker, not evidence of a JavaScript exception. The final clean-Console gate must nevertheless be repeated after the index is published and the request returns 200.

## Current Acceptance Decision

Passed:

- Admin shell regression;
- Teacher Pending Milk panel rendering;
- exact five-day Attendance read scope;
- read-only Network method boundary;
- responsive layout containment.

Blocked:

- room-scoped `absentMilk` response;
- eligible/already-issued/history rendering;
- final clean Console and no-error UI state.

Sprint 4.4 remains open until:

1. `.indexOn: ["roomId"]` is published at `/milkApp/absentMilk`;
2. the room-scoped request returns 200;
3. eligibility/history renders or a correct empty state appears;
4. Network remains read-only;
5. Console is clean;
6. branch remains synchronized and working tree clean.

This browser gate does not authorize `main`, production cutover, real-classroom write testing, replacement of `teacher.html`, or closure of the deferred real-data incident.
