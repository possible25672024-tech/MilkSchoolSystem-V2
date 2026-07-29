# Sprint 4.7 — Media and Signature Browser Validation Report

Date: 2026-07-29

Branch: `feature/sprint-4.7-media-signature-ui`

Status: **PARTIAL PASS / LIVE TEACHER STOCK CONSISTENCY FIX IMPLEMENTED / LOCAL RETEST PENDING**

## Preconditions

Confirmed before the submitted browser evidence:

- complete Sprint 4.7 regression runner passed;
- feature branch matched Origin;
- working tree was clean;
- protected `index.html` and `teacher.html` remained unchanged;
- no real classroom evidence write was authorized;
- physical iPad remained deferred.

## Submitted Browser Evidence — ACCEPTED

The supplied screenshots confirm:

- Chrome Device Toolbar used `820 x 1180`;
- the Teacher shell remained vertically scrollable;
- the Vacation Milk operational panel rendered;
- the Vacation evidence section rendered inside the panel;
- photo input, student selector, parent or recipient field, signature canvas, and clear/use controls were visible;
- the authenticated room roster contained 16 students;
- Vacation preview showed 16 students, 30 days, and 480 boxes;
- no photo was selected;
- no signature was drawn;
- Console showed the normal `MilkSchoolSystem V2 Started` message;
- no JavaScript or Firebase error was visible in Console;
- Teacher dashboard rendered with zero visible Queue items;
- Logout returned to the login screen;
- the branch remained synchronized with Origin and the working tree remained clean.

## Browser Finding — BLOCKER FOUND

The screenshots show inconsistent Room Stock for the same authenticated Teacher room:

```text
Vacation Milk panel: 1040 boxes
Teacher dashboard:    476 boxes
```

This prevents Browser Gate acceptance even though the responsive layout and Console evidence passed.

### Root cause

The Vacation preview can render from the authenticated session fallback before `TeacherManager.refresh()` finishes loading the live room snapshot.

`TeacherManager` emits:

```text
milkapp:teacher-refreshed
```

after the live snapshot is available, but the Vacation preview previously replayed only after login. The Vacation stock card could therefore retain the fallback value while the Teacher dashboard displayed the live value.

### Runtime correction

Implemented:

```text
modules/media/vacationEvidenceAdapter.js
```

The adapter now:

- keeps the existing post-login preview replay;
- listens for `milkapp:teacher-refreshed`;
- confirms that the refreshed room matches the authenticated Teacher room;
- replays `VacationMilkView.handlePreviewChange()` after the live snapshot arrives;
- ignores refresh events for other rooms;
- ignores refresh events outside a Teacher session;
- keeps listener installation idempotent;
- performs no Firebase, Queue, Room Stock, or Main Stock write.

Regression check added:

```text
tests/vacation-live-stock-refresh-check.mjs
```

Expected output:

```text
Vacation live Teacher stock refresh checks passed.
```

## Evidence Still Missing

The supplied screenshots do not yet prove all Browser Gate requirements.

Still required after pulling the stock-refresh fix:

1. Vacation stock card and Teacher dashboard show the same live Room Stock value.
2. Desktop Attendance evidence section renders.
3. Desktop Pending evidence section renders.
4. Desktop Retroactive evidence section renders.
5. Queue value is explicitly checked before and after validation with:

```js
localStorage.getItem("tc_pending_saves_v1")
```

6. Network evidence records the validation activity and confirms:

```text
GET/OPTIONS only
POST = 0
PUT = 0
PATCH = 0
DELETE = 0
```

The submitted Network screenshot was taken after the request list had been cleared and contained no entries. It therefore does not prove the request-method acceptance criteria.

## Queue Preflight

Before the retest, inspect the queue without changing it:

```js
localStorage.getItem("tc_pending_saves_v1")
```

Proceed only when the result is `null`, `"[]"`, or a parsed empty array.

When a non-empty Queue exists:

- stop the browser gate;
- do not clear or edit it;
- report only the Queue count without exposing student or evidence payloads.

Repeat the check after validation. The Queue must remain empty.

## Safety Boundary

Do not use:

- room `อ.3-3`;
- room ID `mqn0z13eyx5b`;
- date `2026-07-28`;
- a real classroom photo;
- a real Teacher, parent, student, or recipient signature.

Do not press:

- Attendance save or delete;
- Pending Milk issue or delete;
- Retroactive Milk issue or delete;
- Vacation Milk issue or delete;
- Queue retry, replay, remove, or edit.

Do not manually edit Firebase, IndexedDB, Local Storage, Room Stock, Main Stock, ledger, stockLog, or transaction history.

## Read-Only Retest

### Desktop

Confirm all four sections:

```text
หลักฐานเช็กดื่มนมรายวัน
รูปถ่ายและลายเซ็นผู้รับนมค้าง
รูปถ่ายและลายเซ็นผู้รับนมย้อนหลัง
รูปถ่ายและลายเซ็นผู้ปกครอง/ผู้รับนมช่วงปิดเทอม
```

For Vacation Milk, wait for the Teacher dashboard to finish loading and confirm that its Room Stock equals the Vacation stock card.

### Responsive 820 x 1180

Confirm:

- all four evidence sections remain readable;
- photo inputs do not create abnormal horizontal overflow;
- signature canvases remain inside their panels;
- owner selectors, receiver-name fields, and buttons remain reachable;
- Attendance, Pending, Retroactive, Vacation, Queue, and Logout controls remain reachable;
- Console remains clean.

### Network

Keep Network recording enabled before login and do not clear the request list until the final screenshot is taken.

Accepted methods:

```text
GET
OPTIONS
```

Forbidden methods:

```text
POST
PUT
PATCH
DELETE
```

## Acceptance Criteria

The Browser Gate passes only when:

- the new live-stock regression check passes;
- the complete regression runner passes again;
- Vacation and Teacher dashboard Room Stock values match;
- Admin regression passes;
- all four Teacher evidence sections render;
- authenticated-room ownership remains visible;
- desktop layout passes;
- `820 x 1180` layout passes;
- Console remains clean;
- Network contains no POST, PUT, PATCH, or DELETE;
- Queue remains empty;
- no real evidence, Firebase write, stock mutation, or Queue replay occurs;
- branch matches Origin and working tree is clean.

## Current Decision

Responsive Vacation evidence layout and clean Console are accepted as a partial pass.

Sprint 4.7 remains open because the submitted evidence exposed a live-stock consistency defect and did not include complete Network, Queue, Attendance, Pending, and Retroactive evidence.

This gate does not authorize merge to `main`, production deployment, replacement of `teacher.html`, real-classroom evidence capture, Firebase security sign-off, physical iPad sign-off, report/A4 parity completion, or closure of the deferred real-data incident.