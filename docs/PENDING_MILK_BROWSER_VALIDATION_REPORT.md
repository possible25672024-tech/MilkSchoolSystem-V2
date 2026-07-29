# Sprint 4.4 — Pending Milk Browser Validation Report

Date: 2026-07-29

Branch: `feature/sprint-4.4-pending-milk-ui`

Status: READY / READ-ONLY VALIDATION PENDING

## Safety Boundary

Browser validation must remain read-only.

Do not:

- press `จ่ายนมค้าง`
- press `ลบและคืนสต็อก`
- create a real Queue entry
- replay a real Queue entry
- use room `อ.3-3`
- use date `2026-07-28`

Before Teacher Login, inspect Local Storage key:

```text
tc_pending_saves_v1
```

Proceed only when the key is absent or contains an empty array. Do not delete a non-empty real queue.

## Admin Regression

Pending evidence:

- Admin Login renders the existing Admin shell
- Admin Logout returns to Login
- Queue and Pending Milk Teacher panels do not activate for Admin
- Console contains no JavaScript error

## Teacher Read-Only Gate

Pending evidence:

- Teacher Login renders the Pending Milk panel
- the selected week date is visible
- Load button is reachable
- four summary values are visible
- no issue or delete action is pressed
- Console contains no JavaScript error

## Network Evidence

After clearing Network and pressing only `โหลดรายการ`, expected read-only requests are:

- exactly five date-scoped Attendance reads for the authenticated room
- one room-scoped `absentMilk` read
- Teacher/Room Stock refresh reads as required by the existing shell

Prohibited mutation evidence:

- no `POST`
- no `PUT`
- no `PATCH`
- no `DELETE`

## Eligibility Evidence

Depending on existing safe room data, the UI may show:

- eligible student/date pairs
- already-issued count
- empty-state message when no eligible pair exists

The gate validates rendering and request scope only. It does not validate a real issue or rollback.

## Responsive Gate

Chrome Device Toolbar:

```text
820 x 1180
```

Pending evidence:

- week selector and Load button remain reachable
- summary cards remain readable
- student/date rows remain contained
- note and disabled/unpressed issue action remain reachable
- history and delete controls remain contained without being pressed
- Queue panel and Logout remain reachable
- no abnormal horizontal overflow
- Console clean

## Acceptance Decision

Sprint 4.4 may be closed only after:

1. Admin regression passes;
2. Teacher read-only Pending Milk gate passes;
3. Network shows only read operations;
4. 820 x 1180 responsive gate passes;
5. Console is clean;
6. branch remains synchronized and working tree clean.

This browser gate does not authorize `main`, production cutover, real-classroom write testing, replacement of `teacher.html`, or closure of the deferred real-data incident.
