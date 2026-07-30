# Sprint 5.1 — Large Attendance Payload Resilience

Date: 2026-07-30

Branch: `feature/sprint-5.1-attendance-scalability`

Status: **AUTOMATED PASS — 60/60 / PRODUCT-OWNER BROWSER RETRY PENDING**

## Trigger

Product-owner Live Server validation proved that Admin login and room selection
work, but a room with long Attendance history returned:

```text
413 Request Entity Too Large
milkApp/mcAttendance.json
```

The existing room-prefix query still hydrated historical base64 photos and
signatures. The response therefore grew with every saved evidence record.

## Goal

Keep Admin room history usable as Attendance evidence grows, without changing
Firebase paths, record shapes, stock formulas, Queue behavior, or protected
legacy pages.

## Gate A — Scalable Attendance discovery

- read `milkApp/mcAttendance` with `shallow=true` only to discover record keys;
- retain only exact `{roomId}_{YYYY-MM-DD}` keys for the selected room;
- hydrate only each matching `/data` child;
- use bounded concurrency;
- never hydrate historical photos or signatures during Admin room loading.

## Gate B — Scoped Admin operations

- defer the media-bearing Attendance collection in the Teacher core snapshot;
- load Attendance summaries through `AttendanceRepository`;
- load Pending, Retroactive, and Vacation histories through their room-scoped
  repositories;
- preserve the existing Admin View/Edit/Delete behavior;
- load full evidence only after the existing explicit view, edit, or print
  action.

## Gate C — Scalable whole-school report

- do not compose Admin reports from the full operational Stock snapshot;
- discover Attendance, Pending, Retroactive, and Vacation keys with shallow
  reads;
- hydrate only formula and browser-local deduplication fields;
- exclude `photos`, `signature`, and `signatures`;
- bound field requests globally rather than per record;
- accept both Firebase object collections and arrays in Dashboard totals.

## Gate D — Safety and compatibility

- no Firebase schema or security-rule change;
- no Main Stock or Room Stock mutation during reads;
- no Queue, ledger, stockLog, media, or browser-storage ownership in the View;
- preserve exact-date Attendance editing and Service-owned delete rollback;
- preserve `index.html` and `teacher.html`.

## Browser acceptance

1. Admin login opens the Admin room workspace.
2. Select the previously failing room.
3. Network shows one shallow `mcAttendance` key-index request followed only by
   selected-room `/data` child reads.
4. No `413` response occurs.
5. Attendance/Pending/Retroactive/Vacation tables render.
6. Console contains no application error.
7. No POST, PUT, PATCH, or DELETE occurs during initial room loading.
8. Whole-school report renders without `(records || []).reduce is not a
   function`.

Sprint 5.1 does not authorize `main`, Production deployment, legacy
replacement, Firebase-rule changes, or incident closure.
