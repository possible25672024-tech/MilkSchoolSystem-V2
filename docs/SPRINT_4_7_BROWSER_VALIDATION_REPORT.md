# Sprint 4.7 — Media and Signature Browser Validation Report

Date: 2026-07-29

Branch: `feature/sprint-4.7-media-signature-ui`

Status: **99.5% PARTIAL PASS — ALL AUTOMATED, QUEUE, NETWORK, ADMIN, ATTENDANCE, PENDING, AND RETROACTIVE GATES ACCEPTED / POST-FIX VACATION STOCK VISUAL PENDING**

## Accepted automated foundation

Confirmed on the feature branch:

- Media Policy, Processor, Signature Pad, IndexedDB Media Store, and Queue-redaction gates passed;
- Attendance, Pending, Retroactive, and Vacation evidence integration gates passed;
- recovery and duplicate-prevention gate passed;
- Teacher session-roster fallback gate passed;
- Vacation live Teacher-stock refresh regression passed;
- Vacation adapter public-status compatibility remained stable;
- the complete automatic regression runner passed after the live-stock correction.

Final reported output:

```text
ALL 43 REGRESSION CHECKS PASSED (6.2s)
On branch feature/sprint-4.7-media-signature-ui
Your branch is up to date with 'origin/feature/sprint-4.7-media-signature-ui'.
nothing to commit, working tree clean
```

Relevant commits:

```text
209457c fix(media): refresh Vacation preview from live Teacher snapshot
744bde5 fix(media): preserve Vacation adapter status contract
4daf1b9 test(media): keep Vacation status contract stable
```

## Accepted Queue and Network evidence

The submitted screenshots confirm:

- `localStorage.getItem("tc_pending_saves_v1")` returned `null` before Teacher login;
- the same Queue key returned `null` again after Logout;
- the Network `Method` column was enabled;
- every visible request used `GET`;
- Firebase read endpoints returned HTTP `200`;
- module requests used `GET` with expected `200` or cache-validation `304` responses;
- no visible `POST`, `PUT`, `PATCH`, or `DELETE` request appeared.

Accepted method result:

```text
GET only
POST = 0 visible
PUT = 0 visible
PATCH = 0 visible
DELETE = 0 visible
```

The local development-server WebSocket handshake shown as `GET 101` is not an operational Firebase write.

## Accepted Admin visual gate

The supplied `820 x 1180` screenshot confirms:

- the Admin session authenticated successfully;
- the Admin shell remained contained and readable;
- the Administrator and school identity remained visible;
- Logout remained reachable;
- Teacher evidence panels were not active in the Admin shell;
- Console showed normal startup output without a JavaScript or Firebase error.

## Accepted Teacher dashboard visual gate

The supplied responsive screenshot confirms:

- the authenticated room and Teacher identity rendered;
- the roster contained 16 students;
- the Teacher dashboard displayed live Room Stock `476`;
- the visible Queue count was `0`;
- the Teacher shell remained vertically scrollable;
- Console remained clean.

The dashboard value establishes the live-stock reference required for the final Vacation comparison:

```text
Teacher dashboard Room Stock = 476
```

## Accepted Attendance evidence visual gate

The supplied `820 x 1180` screenshot confirms:

- the authenticated-room roster rendered;
- the Attendance evidence section rendered below the daily student list;
- photo input was visible;
- the photo count showed `0 / 5 รูป`;
- the existing-evidence load control was reachable;
- the Teacher-signature canvas fit inside its panel;
- `ใช้ลายเซ็นนี้` and `ล้างลายเซ็น` controls were reachable;
- no photo was selected;
- no signature was drawn;
- no Attendance save or delete action was pressed;
- no abnormal horizontal overflow was visible.

## Accepted Pending evidence visual gate

The latest screenshots confirm:

- the heading `รูปถ่ายและลายเซ็นผู้รับนมค้าง` rendered;
- the photo input was visible;
- the photo count showed `0 / 5 รูป`;
- no local photo preview remained;
- the student-and-absence-date selector was visible;
- the recipient-name field was visible;
- the signature canvas fit inside the panel;
- the local evidence-load control was reachable;
- no photo was selected;
- no signature was drawn;
- no Pending issue or delete action was pressed;
- Console remained clean.

This closes the earlier local IndexedDB draft blocker. The accepted browser state contains no selected Pending evidence media.

## Accepted Retroactive evidence visual gate

Desktop and `820 x 1180` screenshots confirm:

- the Retroactive evidence section rendered;
- the heading `รูปถ่ายและลายเซ็นผู้รับนมย้อนหลัง` was visible;
- photo input was visible;
- the photo count showed `0 / 5 รูป`;
- student owner selector was visible;
- recipient or parent-name field was visible;
- signature canvas and clear/use controls were reachable;
- the selected-range form remained readable;
- no photo was selected;
- no signature was drawn;
- no issue or delete action was pressed;
- responsive layout did not show abnormal horizontal overflow.

## Accepted prior Vacation layout evidence

Previously supplied screenshots confirmed:

- Chrome Device Toolbar used `820 x 1180`;
- Vacation Milk operational and evidence panels rendered;
- photo input, owner selector, recipient-name field, signature canvas, and controls were visible;
- the authenticated room roster contained 16 students;
- the preview showed 16 students, 30 days, and 480 boxes;
- Console remained clean.

That screenshot preceded the live-stock correction and showed the obsolete fallback Room Stock. It cannot close the final stock-consistency visual check.

## Remaining blocker — post-fix Vacation stock proof

After Teacher login, wait for the live Teacher snapshot and capture the Vacation summary and evidence panel together.

Required result:

```text
Teacher dashboard Room Stock = 476
Vacation Milk Room Stock     = 476
```

The screenshot must also show:

- Vacation evidence heading;
- photo count `0 / 5 รูป`;
- authenticated-room student owner selector;
- parent or recipient-name field;
- signature canvas and controls;
- no selected photo;
- no drawn signature;
- clean Console;
- readable `820 x 1180` layout without abnormal horizontal overflow.

## Read-only restrictions

Do not use:

- room `อ.3-3`;
- room ID `mqn0z13eyx5b`;
- date `2026-07-28`;
- a real classroom evidence photo;
- a real Teacher, parent, student, or recipient signature.

Do not press Attendance, Pending, Retroactive, or Vacation save/delete actions. Do not create, retry, replay, remove, or edit Queue entries. Do not manually change Firebase, Room Stock, Main Stock, ledger, stockLog, transaction history, IndexedDB, or Local Storage.

## Acceptance decision

Accepted:

- final 43-check regression run;
- synchronized and clean feature branch at the reported test head;
- Queue empty before and after the walkthrough;
- GET-only visible Network methods;
- Admin responsive shell;
- Teacher dashboard with live Room Stock `476`;
- Attendance desktop/responsive evidence controls with `0 / 5 รูป`;
- Pending evidence controls with `0 / 5 รูป` and no local preview;
- Retroactive desktop/responsive evidence controls with `0 / 5 รูป`;
- clean Console evidence;
- prior Vacation responsive layout.

Sprint 4.7 remains open only for:

1. post-fix Vacation evidence rendered with Room Stock `476`, matching the dashboard;
2. final branch synchronization after the closing documentation commit.

This report does not authorize merge to `main`, production deployment, replacement of `teacher.html`, real-classroom evidence capture, Firebase security sign-off, physical iPad sign-off, report/A4 parity completion, or closure of the deferred real-data incident.
