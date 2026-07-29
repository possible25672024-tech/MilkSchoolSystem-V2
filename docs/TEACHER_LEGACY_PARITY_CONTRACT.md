# Teacher V2 — Legacy Parity Contract

Date: 2026-07-29

Source of truth: protected `teacher.html` and the product-owner screenshots from the active school system.

Status: BINDING FOR V2 CUTOVER

## Decision

V2 must retain every operational Teacher menu and workflow that exists in the protected legacy page. A feature may be migrated into a later Sprint, but it must not be silently removed, renamed into an unrelated workflow, or represented as complete before functional parity is verified.

Protected files remain available and unchanged until explicit production-cutover approval:

- `teacher.html`
- `index.html`

## Required Teacher Navigation

The final V2 Teacher navigation must retain these capabilities:

1. ภาพรวมการดื่มนม
2. เช็คดื่มนมรายวัน
3. ประวัติการเช็ค
4. สรุปรายงาน
5. พิมพ์รายงาน A4
6. นมค้างรายสัปดาห์
7. จ่ายนมย้อนหลัง
8. จ่ายนมช่วงปิดเทอม
9. รายงานนักเรียน
10. สต็อกนมคงเหลือ
11. ตั้งค่า
12. ออกจากระบบ

The home/role identity, authenticated room, Teacher name, school identity, and room-only access boundary must also remain visible and enforced.

## Attendance Parity

Required:

- date, academic year, and semester selection;
- authenticated-room student roster;
- present/absent state per student;
- per-student note;
- select-all present/absent actions;
- save, edit, and delete with Room Stock difference protection;
- Teacher identity;
- daily photo evidence;
- Teacher signature;
- history by month;
- edit/delete from history;
- daily, weekly, monthly, and semester summaries;
- A4 preview and printing;
- no Main Stock mutation.

Current modular status:

- roster and Attendance CRUD implemented;
- Room Stock difference and Queue recovery implemented;
- photo capture, Teacher signature, full history, summary, and print parity remain pending.

## Pending Milk Parity

Required:

- selected week;
- absent student/date eligibility derived from daily Attendance;
- exclusion of student/date pairs already issued;
- visible student names before issue;
- one selected student/date pair equals one box;
- optional note;
- recipient/student signatures where required by the legacy workflow;
- photo evidence;
- issue history;
- delete and exact Room Stock restoration;
- monthly/weekly report and A4 printing;
- no Main Stock mutation.

Current modular status:

- eligibility, student names, duplicate prevention, issue history, delete/rollback, Room Stock, typed Queue recovery, desktop and responsive gates passed;
- photo/signature capture and print/report parity remain pending.

## Retroactive Milk Parity

Required:

- academic year and semester;
- issue date;
- inclusive start/end range;
- Monday–Friday calculation;
- authenticated-room roster snapshot;
- visible student roster or printable student detail, not only an anonymous total;
- student count, weekday count, total boxes, and debt boxes;
- note;
- student/recipient signature evidence where required;
- photo evidence;
- room history and debt status;
- delete and exact Room Stock restoration;
- report/print compatibility;
- no Main Stock mutation.

Current modular status:

- calculation, compatible record, history, issue/delete, Room Stock, and initial View implemented;
- typed `RETRO` Queue recovery is being validated;
- roster detail, photo/signature capture, and report/print parity remain pending.

## Vacation Milk Parity

Required:

- authenticated room;
- academic period and vacation date range;
- student roster/recipient detail;
- exact quantity calculation;
- Vacation Milk photo/signature evidence;
- issue history;
- delete/rollback;
- Room Stock-only behavior;
- report and A4 printing;
- no Main Stock mutation.

Status: planned after Sprint 4.5.

## Student, Stock, Setting, Report, and Print Parity

Required:

- student report for the authenticated room;
- remaining Room Stock view and last-updated state;
- Teacher settings that are safe for the authenticated room;
- daily, weekly, monthly, semester, and required 15-day summary/print modes;
- A4 preview and print output;
- browser and iPad-responsive access;
- room-scoped and date-scoped payload loading;
- no all-school Teacher payload download.

## Media and Signature Boundary

Photos and signatures must not be added as unrestricted base64 growth inside the login-blocking payload.

The implementation must:

- preserve compatible legacy fields during migration;
- load media lazily and only for the selected room/date/record;
- enforce file count, type, and size limits;
- generate thumbnails/previews separately from original evidence when appropriate;
- keep Attendance/stock save atomic boundaries clear;
- queue metadata safely without exposing photo/signature payloads in Queue UI;
- avoid downloading all historical photos/signatures at Teacher Login;
- support cleanup, backup, restore, and long-term storage limits.

## Planned Migration Sequence

### Sprint 4.5

- complete Retroactive Milk runtime;
- typed `RETRO` Queue recovery;
- isolated issue/delete/partial-save validation;
- indexed room-scoped history read;
- read-only desktop and responsive gate.

### Sprint 4.6

- Vacation Milk operational UI;
- Room Stock-only issue/delete;
- typed Queue recovery;
- isolated and read-only browser gates.

### Sprint 4.7

- shared Media and Signature workflow;
- Attendance Teacher signature and daily photo evidence;
- Pending Milk photo/signature evidence;
- Retroactive and Vacation photo/signature evidence;
- lazy media loading and storage limits.

### Sprint 4.8

- Attendance history parity;
- daily/weekly/monthly/semester summaries;
- A4 preview and print;
- required 15-day report mode;
- edit/delete navigation parity.

### Sprint 4.9

- student report;
- remaining Room Stock view;
- Teacher settings;
- complete Teacher navigation shell;
- final legacy parity matrix and cutover rehearsal.

Sprint numbering may be split further when test isolation or risk requires it, but no listed capability may be removed from the parity contract.

## Stock and Data Rules

- Main Stock decreases only when Admin distributes milk to classrooms.
- Attendance, Pending Milk, Retroactive Milk, and Vacation Milk change Room Stock only.
- Delete/rollback restores exactly the quantity previously deducted.
- Negative Room Stock is not silently clamped.
- Queue storage key remains `tc_pending_saves_v1`.
- successful stock mutation followed by audit failure becomes audit-only retry work;
- audit-only retry never repeats stock mutation;
- Teacher access remains limited to the authenticated room;
- Firebase schema changes require explicit compatibility evidence.

## Current Firebase Query Indexes

Published and validated:

```text
/milkApp/absentMilk  → .indexOn ["roomId"]
/milkApp/retroMilk   → .indexOn ["roomId"]
```

The current root-level public `.read` and `.write` rules remain a production-security blocker and do not count as production readiness.

## Cutover Rule

V2 must not replace `teacher.html` until:

1. every capability in this document is implemented or explicitly accepted as a product-owner deferral;
2. automated, isolated, desktop, responsive, Network, Console, backup, restore, and security gates pass;
3. the open real-classroom incident is reconciled;
4. Firebase security rules are hardened;
5. physical iPad validation is completed or explicitly accepted as a blocking deferral;
6. `main` and production cutover receive explicit approval.
