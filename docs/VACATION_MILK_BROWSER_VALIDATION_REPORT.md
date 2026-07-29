# Sprint 4.6 — Vacation Milk Browser Validation Report

Date: 2026-07-29

Branch: `feature/sprint-4.6-vacation-milk-ui`

Status: PASS — indexed read-only desktop, clean Console, responsive 820 x 1180, and complete regression validation passed.

## Preconditions

Confirmed:

- all Sprint-specific Vacation Milk tests passed;
- all 30 regression checks passed;
- feature branch synchronized with origin;
- working tree clean;
- `/milkApp/vacationMilk` has `.indexOn: ["roomId"]` published;
- existing `absentMilk` and `retroMilk` indexes remain published;
- protected `index.html` and `teacher.html` remain unchanged.

## Admin Regression — PASS

Observed:

- Admin authenticated shell rendered;
- Logout control remained reachable;
- Teacher Vacation, Retroactive, Pending, and Queue workflows did not replace the Admin shell;
- Console showed the normal `MilkSchoolSystem V2 Started` message;
- no JavaScript error was visible;
- Admin behavior remained unchanged.

## Vacation Milk Teacher Panel — PASS

Observed for a non-quarantined room:

- heading `จ่ายนมช่วงปิดเทอม` rendered;
- academic year and semester rendered;
- issue date and authenticated room remained visible;
- vacation day count defaulted to 30;
- all four summary cards rendered;
- visible authenticated-room student roster rendered;
- each of 16 students showed 30 boxes;
- Shared Media & Signature handoff remained visible;
- note, Load History, and unpressed Issue controls remained reachable.

Read-only preview evidence:

```text
16 students × 30 days = 480 boxes
Room Stock = 476
```

The Room Stock warning state correctly showed that the preview quantity exceeded current Room Stock. No issue action was pressed.

## Indexed History Read — PASS

After publishing the room index and pressing only `โหลดประวัติ`, the expected room-scoped requests appeared:

```text
/milkApp/vacationMilk.json?orderBy="roomId"&equalTo="<authenticated-room-id>"
```

Observed:

- Method GET;
- HTTP 200;
- no Firebase HTTP 400;
- zero records returned for the selected room;
- UI rendered `โหลดประวัติแล้ว 0 รายการ`;
- UI rendered `ยังไม่มีรายการนมช่วงปิดเทอม`;
- no POST;
- no PUT;
- no PATCH;
- no DELETE.

No Vacation Milk issue, delete, rollback, Attendance mutation, Pending Milk mutation, Retroactive Milk mutation, or manual Queue retry was performed.

## Console — PASS

After clearing Console:

- no JavaScript error appeared;
- no Firebase index error appeared;
- normal startup message remained visible;
- Chrome showed `No Issues` in the desktop evidence.

## Responsive 820 x 1180 — PASS

Chrome Device Toolbar at `820 x 1180` showed:

- Admin shell contained and readable;
- Teacher Vacation Milk panel contained and readable;
- 16-row student roster readable;
- summary cards readable;
- note and both action buttons reachable;
- no abnormal horizontal overflow;
- Console remained clean.

Existing Teacher Logout and Queue controls remain part of the same vertically scrollable shell and were already validated in the completed Teacher and Queue responsive foundation.

## Automated Regression — PASS

Reported local output:

```text
ALL 30 REGRESSION CHECKS PASSED
```

Repository state:

```text
On branch feature/sprint-4.6-vacation-milk-ui
Your branch is up to date with 'origin/feature/sprint-4.6-vacation-milk-ui'.
nothing to commit, working tree clean
```

## Safety Boundary

- room `อ.3-3` was not used as a write-test target;
- room ID `mqn0z13eyx5b` remains quarantined;
- date `2026-07-28` remains quarantined;
- no real-classroom write occurred;
- no Queue entry was created or replayed;
- no Room Stock or Main Stock mutation occurred;
- issue and rollback buttons remained unpressed.

## Acceptance Decision

Sprint 4.6 automated, Firebase index, browser, Console, and responsive gates are accepted.

This result authorizes only fast-forward integration into `develop`. It does not authorize:

- merge to `main`;
- production deployment;
- real-classroom writes;
- replacement of `teacher.html`;
- Media and Signature completion;
- report completion;
- Firebase security sign-off;
- physical iPad sign-off;
- closure of the deferred real-data incident.
