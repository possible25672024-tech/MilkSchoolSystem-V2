# Sprint 4.7 — Media and Signature Browser Validation Report

Date: 2026-07-29

Branch: `feature/sprint-4.7-media-signature-ui`

Status: STAGED — desktop and 820 x 1180 read-only browser validation pending.

## Preconditions

Required before opening the browser:

- complete Sprint 4.7 regression runner passed;
- feature branch synchronized with origin;
- working tree clean;
- protected `index.html` and `teacher.html` unchanged;
- no real classroom write is authorized;
- physical iPad remains deferred.

## Queue Preflight

Before Teacher login, inspect the browser queue without changing it:

```js
localStorage.getItem("tc_pending_saves_v1")
```

Proceed only when the result is `null`, `"[]"`, or a parsed empty array.

If a non-empty queue exists:

- stop the browser gate;
- do not clear or edit the queue;
- report the queue count without exposing student or evidence payloads.

Repeat the same check after validation. The result must remain empty.

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
- Queue retry, replay, or remove.

Do not manually edit Firebase, IndexedDB, Local Storage, Room Stock, Main Stock, ledger, stockLog, or transaction history.

## Developer Tools Setup

1. Open the current V2 application through the same local server used for prior gates.
2. Open Developer Tools.
3. Clear Console and Network entries.
4. Keep Network recording enabled.
5. Use the Fetch/XHR filter when checking Firebase traffic.
6. Do not enable request blocking or modify responses.

Allowed during this gate:

- GET;
- OPTIONS;
- browser-local rendering and preview state.

Must remain absent:

- POST;
- PUT;
- PATCH;
- DELETE.

## Admin Regression

Validate the Admin session first:

- authenticated Admin shell renders normally;
- Logout remains reachable;
- Teacher evidence panels remain hidden or inactive;
- normal `MilkSchoolSystem V2 Started` message appears;
- no JavaScript or Firebase error appears.

Then Logout normally.

## Teacher Desktop Read-Only Validation

Login with a non-quarantined Teacher room.

Confirm the authenticated room and roster load before reviewing evidence controls.

### Attendance Evidence

Expected section:

```text
หลักฐานเช็กดื่มนมรายวัน
```

Confirm:

- photo input accepts JPEG, PNG, and WebP;
- `โหลดหลักฐานเดิม` control is visible;
- photo counter is visible;
- Teacher signature canvas is visible;
- `ใช้ลายเซ็นนี้` and `ล้างลายเซ็น` controls are reachable;
- no photo is selected;
- no signature is drawn;
- Attendance save and delete remain unpressed.

Changing to a non-quarantined date for read-only loading is allowed. Do not use `2026-07-28`.

### Pending Milk Evidence

Expected section:

```text
รูปถ่ายและลายเซ็นผู้รับนมค้าง
```

Confirm:

- photo input and `0 / 5` style count are visible;
- selected student-and-absence-date owner control renders when preview selections exist;
- receiver-name field renders;
- signature canvas and clear/use controls render;
- local draft notice states that Firebase is not written;
- no issue or delete action is pressed.

Preview checkboxes may be selected only to render owner context. Do not attach media and do not issue milk.

### Retroactive Milk Evidence

Expected section:

```text
รูปถ่ายและลายเซ็นผู้รับนมย้อนหลัง
```

Confirm:

- valid non-quarantined date-range preview renders;
- authenticated-room student owner list renders;
- photo input, receiver-name field, signature canvas, and controls render;
- changing only issue date while the same retroactive range remains selected does not visibly reset the evidence section;
- no issue or delete action is pressed.

### Vacation Milk Evidence

Expected section:

```text
รูปถ่ายและลายเซ็นผู้ปกครอง/ผู้รับนมช่วงปิดเทอม
```

Confirm:

- the current authenticated roster renders;
- default vacation day count and box preview remain correct;
- photo input, student selector, parent/recipient field, signature canvas, and controls render;
- the evidence owner list is available after Teacher login without a manual page reload;
- no issue or delete action is pressed.

## Lazy Evidence Controls

The following controls may be pressed only when they perform read-only/local hydration:

- Attendance `โหลดหลักฐานเดิม`;
- Pending `โหลดหลักฐานของสัปดาห์นี้`;
- Retroactive `โหลดหลักฐานของช่วงนี้`;
- Vacation `โหลดหลักฐานของรายการนี้`.

Expected:

- the selected context remains unchanged;
- no full historical evidence collection downloads at Teacher login;
- no POST, PUT, PATCH, or DELETE appears;
- no Queue entry is created;
- Console remains clean.

## Responsive 820 x 1180

Use Chrome Device Toolbar with exactly `820 x 1180`.

Confirm:

- Admin shell remains contained and readable;
- Teacher shell remains vertically scrollable;
- all four evidence sections remain readable;
- photo inputs do not cause abnormal horizontal overflow;
- signature canvases fit inside their panels;
- owner selectors, receiver-name inputs, and action buttons remain reachable;
- Attendance, Pending, Retroactive, Vacation, Queue, and Logout controls remain reachable;
- Console remains free of JavaScript and Firebase errors.

## Network Acceptance

At the end of both desktop and responsive review, confirm:

```text
GET/OPTIONS only
POST = 0
PUT = 0
PATCH = 0
DELETE = 0
```

Room-scoped Firebase GET requests are allowed. Full-school evidence downloads at Teacher login are not allowed.

## Evidence to Record

Record or provide screenshots showing:

1. desktop Attendance evidence section;
2. desktop Pending, Retroactive, and Vacation evidence sections;
3. Vacation owner list available after Teacher login;
4. responsive 820 x 1180 evidence layout;
5. clean Console;
6. Network methods showing no write request;
7. empty `tc_pending_saves_v1` before and after validation.

Do not include passwords, tokens, Firebase secrets, full Data URLs, student-sensitive evidence, or real signatures in screenshots.

## Acceptance Criteria

The browser gate passes only when:

- Admin regression passes;
- all four Teacher evidence sections render;
- authenticated-room ownership is preserved;
- desktop layout passes;
- 820 x 1180 layout passes;
- Console is clean;
- Network contains no POST, PUT, PATCH, or DELETE;
- queue remains empty;
- no real photo, signature, Firebase write, stock mutation, or Queue replay occurs.

## Current Decision

Pending local browser evidence.

This gate does not authorize merge to `main`, production deployment, replacement of `teacher.html`, real-classroom evidence capture, Firebase security sign-off, physical iPad sign-off, report/A4 parity completion, or closure of the deferred real-data incident.
