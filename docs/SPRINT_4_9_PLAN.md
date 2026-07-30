# Sprint 4.9 — Student Report, Room Stock, Teacher Settings and Navigation Parity

Date: 2026-07-30

Branch: `feature/sprint-4.9-teacher-parity-cutover`

Status: **AUTOMATED GATE PASS / LOCAL BROWSER VALIDATION PENDING**

## Goal

Complete the remaining modular V2 Teacher navigation parity without changing verified stock rules, Firebase schema, protected legacy pages, or the production cutover decision.

Sprint 4.9 adds:

- authenticated-room student report and A4 print;
- actual remaining Room Stock and last-updated view;
- safe device-local Teacher display settings;
- the complete 12-item Teacher navigation shell;
- a final parity matrix and non-destructive cutover rehearsal document.

## Accepted Foundation

Sprint 4.8 is merged into `develop` at:

```text
5436f255f57a1f925d02b28f906da7f85cb9e3d7
```

The accepted foundation includes authenticated-room Attendance history, daily and per-student summaries, A4 print, desktop and Responsive `820 x 1180` browser evidence, GET-only report traffic, clean Console evidence, and 48 passing regression checks.

## Scope

### 1. Student Report

The Teacher may:

- select one student from the authenticated-room roster;
- select an explicit start and end date;
- load only the selected room/date range through `AttendanceHistoryManager`;
- view present, absent, unchecked, and attendance-rate totals;
- view one timeline row per loaded Attendance record;
- view per-date notes;
- print the already-loaded report on deterministic A4 portrait pages.

The student report must not:

- load another room;
- download historical photo or signature payloads;
- write Attendance, stock, Queue, settings, ledger, or stockLog data;
- perform another Attendance read when print preview opens.

### 2. Room Stock View

The Teacher may:

- view the actual `roomStock/{authenticatedRoomId}` balance;
- view a compatible last-updated value when available;
- request a scoped refresh through `TeacherManager`;
- see negative and zero balances without silent clamping.

The view is read-only. It must not rebuild, reconcile, calculate, repair, or mutate Room Stock or Main Stock.

### 3. Safe Teacher Settings

Allowed device-local settings:

- default student-report range: 15, 30, or 90 days;
- compact display mode;
- remember the last Teacher menu.

The preference store:

- uses key `milkapp_teacher_preferences_v1`;
- isolates preferences by authenticated room ID;
- stores no student, photo, signature, receiver, note, stock, Queue, credential, or Firebase payload;
- never changes Firebase settings or schema.

### 4. Complete Teacher Navigation

The modular V2 navigation must expose:

1. ภาพรวมการดื่มนม
2. เช็กดื่มนมรายวัน
3. ประวัติการเช็ก
4. สรุปรายงาน
5. พิมพ์รายงาน A4
6. นมค้างรายสัปดาห์
7. จ่ายนมย้อนหลัง
8. จ่ายนมช่วงปิดเทอม
9. รายงานนักเรียน
10. สต็อกนมคงเหลือ
11. ตั้งค่า
12. ออกจากระบบ

Navigation reuses the accepted Sprint 4.1–4.8 panels. It does not duplicate their Service or stock logic.

### 5. Teacher Menu Layout and Milk Wording

- desktop widths above `1100px` show the 12-item Teacher navigation as a vertical sidebar on the right;
- the sidebar remains sticky while the active Teacher panel scrolls;
- widths at or below `1100px` retain the compact horizontal navigation so the content is not squeezed;
- visible daily, history, student-report, Pending, and A4 labels use `ดื่มนม` and `ไม่ดื่มนม`;
- visible rate labels use `อัตราดื่มนม`;
- persisted status values remain `present` and `absent` for backward compatibility and unchanged Room Stock calculations.

## Module Boundary

```text
TeacherParityView
    -> TeacherParityManager
        -> TeacherParityService
        -> TeacherPreferenceStore
        -> AttendanceHistoryManager
        -> AttendanceReportBuilder
        -> TeacherManager
```

Runtime files:

```text
modules/services/teacherParityService.js
modules/storage/teacherPreferenceStore.js
modules/teacher/teacherParityManager.js
modules/teacher/teacherParityView.js
modules/core/app.js
```

## Events

Only metadata-safe events are allowed:

```text
milkapp:student-report-built
milkapp:teacher-room-stock-viewed
milkapp:teacher-preferences-saved
```

Events must not contain student names, notes, photo/signature data, credentials, Queue payloads, or Firebase records.

## Protected Business Rules

- Main Stock decreases only when Admin distributes milk to classrooms.
- Attendance, Pending, Retroactive, and Vacation workflows change Room Stock only.
- Sprint 4.9 student report and stock/settings views are read-only at the Firebase boundary.
- Attendance edit/delete difference rules remain unchanged.
- Negative Room Stock remains visible and unclamped.
- Queue key remains `tc_pending_saves_v1`.
- Teacher access remains limited to the authenticated room.
- Protected `index.html` and `teacher.html` remain unchanged.
- No Firebase schema or security-rule change is authorized.
- No merge to `main` is authorized.

## Automated Gates

### Gate A — Teacher Parity Service

- preference normalization;
- deterministic inclusive date range;
- today overview;
- actual Room Stock model;
- student timeline and totals;
- no source mutation or stock calculation.

### Gate B — Preference Store

- room isolation;
- corrupt-data fail-closed behavior;
- safe-field allowlist;
- no student/media/credential payload.

### Gate C — Manager and Events

- authenticated-room ownership;
- scoped Attendance history delegation;
- scoped Teacher refresh;
- metadata-only events;
- no Firebase, Queue, stock, or browser-storage ownership.

### Gate D — Navigation and UI

- all 12 menu items;
- right-side vertical Teacher navigation on desktop;
- compact horizontal navigation on narrower screens;
- milk-consumption wording without changing persisted `present`/`absent` values;
- reuse of accepted operational panels;
- student report and A4 rendering;
- read-only stock display;
- safe settings;
- Teacher Logout delegation;
- desktop and Responsive `820 x 1180`.

### Gate E — Full Regression

Run every `tests/*-check.mjs` file in a separate Node process. Require at least 53 checks and all checks PASS.

## Browser Acceptance

Required local evidence after automated validation:

- Teacher login for a non-quarantined room;
- all 12 menu controls visible and reachable;
- the 12 controls appear in a right-side vertical sidebar on desktop;
- `ดื่มนม`, `ไม่ดื่มนม`, and `อัตราดื่มนม` appear consistently in daily, report, student-report, Pending, and A4 views;
- Student Report loads one selected student/date range;
- Student Report A4 preview;
- Room Stock matches the Teacher header value;
- safe settings survive refresh on the same device;
- desktop and Chrome Responsive `820 x 1180`;
- clean Console;
- report/stock traffic contains no write method;
- no Queue replay or operational save/delete action;
- protected files unchanged.

## Safety Boundary

Do not use:

- room `อ.3-3`;
- room ID `mqn0z13eyx5b`;
- date `2026-07-28`;
- a real-classroom write;
- direct Firebase Console mutation;
- manual Queue, Room Stock, Main Stock, ledger, stockLog, or transaction-history repair.

## Cutover Decision

Sprint 4.9 can close Teacher navigation parity for `develop`, but it does not authorize V2 production cutover.

Production remains blocked until:

- the deferred real-data incident is closed;
- Firebase public root rules are hardened;
- backup export and isolated restore rehearsal are completed;
- physical iPad is tested or explicitly accepted as a production risk;
- remaining Admin/report adapter gaps are resolved or accepted;
- explicit `main` and production approval is granted.
