# Sprint 4.7 — Media and Signature Browser Validation Report

Date: 2026-07-29

Branch: `feature/sprint-4.7-media-signature-ui`

Status: **PARTIAL PASS — QUEUE PREFLIGHT AND PENDING EVIDENCE RENDER ACCEPTED / FINAL REGRESSION, CLEAN LOCAL DRAFT, METHOD EVIDENCE, AND REMAINING PANELS PENDING**

## Accepted automated foundation

Previously accepted on this feature branch:

- Media Policy, Processor, Signature Pad, IndexedDB Media Store, and Queue redaction gates;
- Attendance, Pending, Retroactive, and Vacation evidence integration gates;
- recovery and duplicate-prevention gate;
- Teacher session-roster fallback gate;
- the original 42+ full-regression run before the live Vacation stock correction.

The live Vacation stock correction and stable adapter-status contract are implemented at:

```text
209457c fix(media): refresh Vacation preview from live Teacher snapshot
744bde5 fix(media): preserve Vacation adapter status contract
4daf1b9 test(media): keep Vacation status contract stable
```

A final full-regression result after `4daf1b9` is still required as explicit test output. A clean Git tree alone does not prove that the runner passed.

## Submitted browser evidence — accepted

The supplied screenshots confirm:

- the application started normally at `127.0.0.1:5500/index-v2.html`;
- `localStorage.getItem("tc_pending_saves_v1")` returned `null` before Teacher login;
- Teacher dashboard rendered for a non-quarantined room;
- the dashboard displayed live Room Stock `476` and visible Queue count `0`;
- the Pending Milk evidence panel rendered;
- Pending photo input, recipient selector, recipient-name field, signature canvas, local-load control, and remove control were reachable;
- Firebase read endpoints returned HTTP 200 in Network;
- the feature branch matched Origin and the working tree was clean at `4daf1b9`.

## Browser evidence that remains partial

### 1. Pending local draft must be removed

The Pending evidence screenshot shows:

```text
1 / 5 รูป
```

and a local preview. This is an IndexedDB draft, not evidence of a Firebase write, but the Browser Gate is required to finish with no selected media.

Use the visible `นำออก` control for that draft and confirm:

```text
0 / 5 รูป
ยังไม่มีรูปถ่าย
```

Do not manually edit IndexedDB or Local Storage.

### 2. Network Method is not visible

The submitted Network table shows Firebase resources, Status `200`, and Type `fetch`, but the Method column is not enabled. The screenshot therefore does not directly prove:

```text
POST = 0
PUT = 0
PATCH = 0
DELETE = 0
```

For final evidence, right-click the Network header row and enable `Method`. Keep recording active before login and do not clear the request list before the final screenshot.

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

### 3. Remaining visual evidence

Still required:

- Attendance evidence section;
- Retroactive evidence section;
- Vacation evidence section after the live Teacher snapshot arrives;
- Vacation Room Stock equals the Teacher dashboard value;
- desktop layout evidence;
- responsive `820 x 1180` evidence covering all four evidence panels;
- clean Console after the final walkthrough;
- Queue value after Logout remains `null`, `"[]"`, or an empty parsed array.

## Final regression command

Run after pulling the latest branch:

```powershell
git pull --ff-only origin feature/sprint-4.7-media-signature-ui

node tests/vacation-media-signature-integration-check.mjs
if ($LASTEXITCODE -ne 0) {
    throw "TEST FAILED: tests/vacation-media-signature-integration-check.mjs"
}

node tests/vacation-live-stock-refresh-check.mjs
if ($LASTEXITCODE -ne 0) {
    throw "TEST FAILED: tests/vacation-live-stock-refresh-check.mjs"
}

node tests/run-sprint-4.7-regression.mjs
if ($LASTEXITCODE -ne 0) {
    throw "TEST FAILED: Sprint 4.7 full regression"
}

git status
```

Required final output includes:

```text
Vacation Milk Media and Signature integration checks passed.
Vacation live Teacher stock refresh checks passed.
ALL 43 REGRESSION CHECKS PASSED
nothing to commit, working tree clean
```

The regression count may be greater than 43 when additional `*-check.mjs` files exist.

## Safety boundary

Do not use:

- room `อ.3-3`;
- room ID `mqn0z13eyx5b`;
- date `2026-07-28`;
- a real classroom evidence photo;
- a real Teacher, parent, student, or recipient signature.

Do not press Attendance, Pending, Retroactive, or Vacation save/delete actions. Do not create, retry, replay, remove, or edit Queue entries. Do not manually change Firebase, Room Stock, Main Stock, ledger, stockLog, transaction history, IndexedDB, or Local Storage.

## Acceptance decision

Queue preflight and Pending evidence rendering are accepted as partial browser evidence.

Sprint 4.7 remains open until:

1. the final 43+ regression run passes after `4daf1b9`;
2. the Pending local media draft is removed;
3. all four evidence panels are shown;
4. Vacation and dashboard Room Stock values match;
5. the Network Method column proves GET/OPTIONS-only traffic;
6. Queue remains empty after Logout;
7. branch matches Origin and the working tree is clean.

This report does not authorize merge to `main`, production deployment, replacement of `teacher.html`, real-classroom evidence capture, Firebase security sign-off, physical iPad sign-off, report/A4 parity completion, or closure of the deferred real-data incident.
