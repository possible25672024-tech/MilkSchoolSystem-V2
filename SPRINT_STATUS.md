# MilkSchoolSystem-V2

# Sprint Status

Last Update: 2026-07-29

Current Branch: `feature/sprint-4.6-vacation-milk-ui`

Current Version: V2

## Current Sprint

Sprint 4.6 — Vacation Milk Operational UI

Status: **10% — ACTIVE / LEGACY AUDIT PENDING**

Sprint 4.5 Retroactive Milk Operational UI completed all automated, isolated, desktop, indexed Network, Console, and 820 x 1180 responsive gates and was fast-forward integrated into `develop` at:

```text
fd15eb2712db83c6b0b13f0eee6a8da635681337
```

Sprint 4.6 has been opened from that exact integration point.

## Completed Foundation

- Sprint 3.4.2 Recovery merged into `develop`.
- Sprint 3.4.3 Stock Module merged into `develop`.
- Sprint 3.4.4 Report Module merged into `develop`.
- Sprint 3.5 Room Module merged into `develop`.
- Sprint 3.6 Teacher Service Foundation merged into `develop`.
- Sprint 3.7 Attendance Service Foundation merged into `develop`.
- Sprint 3.8 Offline Queue and Sync Module merged into `develop`.
- Sprint 3.9 Performance and Payload Optimization merged into `develop`.
- Sprint 4.0 Cutover Readiness and Compatibility merged into `develop`.
- Sprint 4.1 Teacher UI Shell and Read-Only State merged into `develop`.
- Sprint 4.2 Teacher Daily Attendance CRUD UI merged into `develop`.
- Sprint 4.3 Offline Queue Operational UI merged into `develop`.
- Sprint 4.4 Pending Milk Operational UI merged into `develop`.
- Sprint 4.5 Retroactive Milk Operational UI merged into `develop`.

Protected `index.html` and `teacher.html` remain unchanged and operational.

Physical iPad remains deferred and must not be represented as PASS.

## Sprint 4.5 Final Result — PASS

Confirmed:

- all 26 regression checks passed;
- empty Queue safety passed;
- Admin regression passed;
- Teacher Retroactive preview passed;
- indexed `retroMilk` history request returned HTTP 200;
- seven history records rendered;
- no POST, PUT, PATCH, or DELETE;
- Console clean;
- loaded 820 x 1180 responsive layout passed;
- no real-classroom write occurred.

Artifacts:

- `docs/RETROACTIVE_MILK_UI_IMPLEMENTATION_REPORT.md`
- `docs/RETROACTIVE_MILK_BROWSER_VALIDATION_REPORT.md`

## Teacher Legacy Parity Contract — BINDING

V2 must retain every Teacher capability from protected `teacher.html`, including:

- ภาพรวมการดื่มนม
- เช็คดื่มนมรายวัน
- ประวัติการเช็ค
- สรุปรายงาน
- พิมพ์รายงาน A4
- นมค้างรายสัปดาห์
- จ่ายนมย้อนหลัง
- จ่ายนมช่วงปิดเทอม
- รายงานนักเรียน
- สต็อกนมคงเหลือ
- ตั้งค่า
- ออกจากระบบ

Photos, signatures, visible/printable student detail, history, summaries, printing, student reports, Room Stock view, settings, and final navigation parity remain mandatory future work.

Artifact:

- `docs/TEACHER_LEGACY_PARITY_CONTRACT.md`

## Sprint 4.6 Objective

Migrate Vacation Milk into modular V2 with:

- authenticated-room-only access;
- verified legacy Firebase path and schema;
- verified date and quantity rules;
- duplicate prevention;
- Room Stock-only issue/delete;
- exact rollback;
- typed persistent Queue recovery;
- audit-only retry protection;
- compatible report/media/signature fields;
- responsive Teacher operational UI;
- protected legacy files unchanged.

Planned modules:

```text
modules/repositories/vacationMilkRepository.js
modules/services/vacationMilkService.js
modules/vacation/vacationMilkManager.js
modules/vacation/vacationMilkView.js
```

## Immediate Next Gate

Read-only audit of protected `teacher.html` to confirm:

- Firebase path;
- record fields;
- quantity calculation;
- issue/delete operation order;
- ledger and stockLog types;
- duplicate identity;
- debt/status behavior;
- report and print compatibility;
- photo/signature compatibility.

Artifact:

- `docs/SPRINT_4_6_PLAN.md`

## Safety Boundary

Do not use:

- room `อ.3-3`;
- room ID `mqn0z13eyx5b`;
- date `2026-07-28`;
- any real-classroom write;
- direct Firebase Console mutation of Vacation Milk records;
- manual Queue, Room Stock, Main Stock, ledger, stockLog, or transaction-history repair.

## Production Blockers — OPEN

- deferred real-classroom incident;
- public Firebase root `.read` and `.write` rules;
- physical iPad validation;
- media/signature parity;
- report/print parity;
- remaining Teacher navigation parity;
- explicit `main` and production approval.
