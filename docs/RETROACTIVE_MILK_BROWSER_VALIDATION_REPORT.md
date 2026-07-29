# Sprint 4.5 — Retroactive Milk Browser Validation Report

Date: 2026-07-29

Branch: `feature/sprint-4.5-retroactive-milk-ui`

Status: PASS — read-only desktop, indexed Network, clean Console, and 820 x 1180 responsive validation completed.

## Preconditions

Confirmed:

- all four Sprint-specific Retroactive Milk tests passed;
- all 26 regression checks passed;
- feature branch synchronized with origin;
- working tree clean;
- `/milkApp/retroMilk` has `.indexOn: ["roomId"]` published;
- protected `index.html` and `teacher.html` remain unchanged.

## Local Queue Safety — PASS

Before Teacher validation, Application → Local Storage for `http://127.0.0.1:5500` showed no stored queue entry.

Result:

```text
tc_pending_saves_v1 absent
```

No persistent Queue work was available for startup replay.

## Admin Regression — PASS

Observed:

- Admin authenticated shell rendered;
- Teacher Retroactive, Pending, and Queue panels did not activate for Admin;
- no JavaScript error was visible;
- Admin behavior remained unchanged.

## Teacher Retroactive Panel — PASS

Observed for a non-quarantined room:

- heading `จ่ายนมย้อนหลัง` rendered;
- academic year and semester rendered;
- issue date rendered;
- authenticated room remained read-only;
- start and end date controls rendered;
- student, weekday, total-box, and debt summary cards rendered;
- note field rendered;
- Load History and Issue buttons remained reachable;
- history area rendered;
- existing rollback actions remained visible but unpressed.

Read-only preview example:

```text
16 students × 21 weekdays = 336 boxes
Debt boxes = 336
```

Changing dates produced only local preview calculation and no write request.

## Indexed History Read — PASS

After clearing Network and pressing only `โหลดประวัติ`, the expected room-scoped request appeared:

```text
/milkApp/retroMilk.json?orderBy="roomId"&equalTo="<authenticated-room-id>"
```

Observed:

- HTTP 200;
- response size approximately 2.6 MB for the current room history;
- seven history records rendered;
- no Firebase index error;
- no POST;
- no PUT;
- no PATCH;
- no DELETE.

No Retroactive Milk issue, delete, rollback, Attendance mutation, Pending Milk mutation, or manual Queue retry was performed.

## History Rendering — PASS

Observed history cards included:

- date ranges;
- academic year and semester;
- issue date;
- weekday count;
- total boxes;
- debt status;
- rollback buttons contained within each card.

Rollback buttons were not pressed.

## Console — PASS

After clearing Console and loading indexed history:

- no JavaScript error appeared;
- no Firebase HTTP 400 appeared;
- normal startup message `MilkSchoolSystem V2 Started` remained visible.

The DevTools Issues counter was not treated as a Console error.

## Responsive 820 x 1180 — PASS

After successful indexed history load, Chrome Device Toolbar at `820 x 1180` showed:

- academic year and semester fields readable;
- issue date and room contained;
- start/end controls reachable;
- all four summary cards readable;
- note field contained;
- Load History and unpressed Issue action reachable;
- multiple history cards and unpressed rollback actions contained;
- no abnormal horizontal overflow;
- Console remained clean.

The evidence focused on the loaded Retroactive panel and history. Existing Teacher Logout and Queue controls remain part of the same vertically scrollable shell and were already validated in the completed Teacher/Queue responsive foundation.

## Safety Boundary

- room `อ.3-3` was not accepted as a write-test target;
- room ID `mqn0z13eyx5b` remains quarantined;
- date `2026-07-28` remains quarantined;
- no real-classroom write occurred;
- no Queue entry was created or replayed;
- no Room Stock or Main Stock mutation occurred.

## Acceptance Decision

Sprint 4.5 browser and responsive gates are accepted.

This result authorizes only fast-forward integration into `develop`. It does not authorize:

- merge to `main`;
- production deployment;
- real-classroom writes;
- replacement of `teacher.html`;
- media/signature completion;
- report completion;
- Firebase security sign-off;
- physical iPad sign-off;
- closure of the deferred real-data incident.
