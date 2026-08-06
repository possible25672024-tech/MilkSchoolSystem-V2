# Sprint 5.5 — Student Import, Room Management and Student Report

Date: 2026-07-31

Branch: `feature/sprint-5.5-student-room-management`

Status: **AUTOMATED PASS — 67/67 / LIVE SERVER BROWSER GATE PENDING**

## Goal

ย้ายงานนำเข้ารายชื่อนักเรียน จัดการห้องเรียน และรายงานนักเรียนเข้าสู่หน้า
Admin V2 โดยรักษา `roomId`, รายชื่อจริง และ Room Stock เดิม ใช้
`preview → confirm` และ Firebase ETag ป้องกัน Admin อีกเครื่องเขียนทับข้อมูล
ที่เปลี่ยนหลังดูตัวอย่าง

## Gate A — Local file parsing

- use the vendored SheetJS `xlsx@0.18.5` browser build;
- do not load spreadsheet code from a CDN;
- accept `.xlsx`, `.xls`, and UTF-8 `.csv`;
- treat one Excel Sheet as one room and a CSV filename as its room name;
- detect and validate the student header before building a preview;
- preserve source student fields, Thai text, student codes, and merged
  gender/name/surname layouts;
- reject empty files, unsupported files, missing headers, and empty rosters.

## Gate B — Preview and duplicate protection

- parse the complete selected workbook before any Firebase write;
- preview every valid room, its teacher, grade, student count, and create/update
  state;
- reject duplicate room names;
- reject duplicate students inside one room;
- reject the same strong student id across imported rooms;
- never generate or persist fallback ids such as `student_*`;
- require explicit Admin confirmation after the preview.

## Gate C — ETag concurrency

- read `milkApp/rooms` with `X-Firebase-ETag: true`;
- keep the preview bound to that exact ETag;
- confirm with one conditional `PUT` and `If-Match`;
- treat HTTP 412 as `ROOM_IMPORT_CONFLICT`;
- do not retry or overwrite automatically;
- clear the selected file and require a new preview after conflict.

## Gate D — Room and stock invariants

- repeated import preserves the existing immutable `roomId`;
- repeated import preserves embedded Room Stock;
- new rooms start with Room Stock `0`;
- room metadata edits preserve students, `roomId`, and Room Stock;
- room deletion remains blocked by Room Stock, distribution, Attendance,
  Pending, Retroactive, Vacation, or ledger references;
- no Sprint 5.5 action writes Main Stock, `milkApp/roomStock`, receives,
  distributes, Attendance, milk-operation history, Queue, ledger, or stockLog.

## Gate E — Admin V2 and student report

- add Admin navigation for import, room management, and student report;
- refresh the Admin room selector after a successful room change;
- show room, grade, teacher, male, female, unknown, and total counts;
- show the selected room's actual roster;
- exclude generated display fallback rows from real-student reporting;
- print the report through the browser A4 flow;
- export a UTF-8 BOM CSV with Thai column names;
- keep View code outside Firebase and browser-storage ownership.

## Automated acceptance

- local XLSX browser bundle round-trip: **PASS**;
- header and merged-name parsing: **PASS**;
- within-room and cross-room duplicate gates: **PASS**;
- ETag success and conflict paths: **PASS**;
- `roomId` and Room Stock preservation: **PASS**;
- Main Stock and Room Stock isolation: **PASS**;
- Service/Manager/View boundary: **PASS**;
- complete regression: **PASS, 67/67**.

## Browser acceptance pending

1. open Admin V2 `นำเข้านักเรียน`;
2. choose a sanitized workbook and verify every Sheet before confirming;
3. confirm that existing rooms retain their `roomId` and Room Stock;
4. confirm that Main Stock and Room Stock do not change;
5. open the student report and compare room/gender totals with the workbook;
6. open one room roster, print A4, and export CSV;
7. repeat with `.csv`;
8. create and edit a non-operational test room;
9. verify dependency-protected deletion is blocked;
10. simulate a second Admin change between preview and confirm and verify the
    conflict requires a fresh preview;
11. verify Desktop and Responsive layout, clean Console, local XLSX asset, one
    ETag read, and one conditional room write.

Use sanitized or disposable data for write tests. Do not use the quarantined
room/date and do not merge to `main` or enable Production traffic.
