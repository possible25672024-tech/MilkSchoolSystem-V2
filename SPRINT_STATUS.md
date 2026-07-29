# MilkSchoolSystem-V2

# Sprint Status

Last Update: 2026-07-29

Current Branch: `feature/sprint-4.5-retroactive-milk-ui`

Current Version: V2

## Current Sprint

Sprint 4.5 — Retroactive Milk Operational UI

Status: **100% — COMPLETE / READY FOR FAST-FORWARD INTEGRATION INTO `develop`**

Completed and validated:

- legacy compatibility audit;
- authenticated-room Repository;
- Service calculation and duplicate protection;
- Manager orchestration;
- Teacher operational View;
- App integration;
- published `/milkApp/retroMilk` room index;
- typed `RETRO` Queue recovery;
- Operational UI Gate;
- isolated issue/delete/partial-save Gate;
- Cutover Documentation Gate;
- all 26 automated regression checks;
- empty Local Storage Queue safety;
- Admin regression;
- Teacher read-only preview;
- indexed history request HTTP 200;
- read-only Network method boundary;
- clean Console;
- loaded responsive layout at 820 x 1180.

Browser issue/delete actions were not used against real Firebase data.

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
- Sprint 4.5 Retroactive Milk Operational UI ready for `develop` integration.

Protected `index.html` and `teacher.html` remain unchanged and operational.

Physical iPad remains deferred and must not be represented as PASS.

## Teacher Legacy Parity Contract — BINDING

V2 must retain every Teacher capability from protected `teacher.html`:

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

Photos, signatures, visible/printable student detail, history, summaries, printing, Vacation Milk, student reports, Room Stock view, settings, and final navigation parity are mandatory future work. They are deferred by Sprint sequence, not removed.

Artifact:

- `docs/TEACHER_LEGACY_PARITY_CONTRACT.md`

## Sprint 4.5 Runtime

Implemented:

- `modules/repositories/retroactiveMilkRepository.js`
- `modules/services/retroactiveMilkService.js`
- `modules/retroactive/retroactiveMilkManager.js`
- `modules/retroactive/retroactiveMilkView.js`
- `modules/sync/retroactiveSyncAdapter.js`
- App integration through `modules/core/app.js`

Business behavior:

- authenticated Teacher room only;
- inclusive Monday–Friday calculation;
- `totalBoxes = student count × weekday count`;
- `debtBoxes = totalBoxes`;
- exact duplicate academic-period/range protection;
- record-first issue and delete;
- Room Stock-only deduction/restoration;
- ledger `RETRO` / `ROLLBACK`;
- stockLog `OUT` / `IN`;
- Main Stock unchanged;
- audit-only recovery never repeats stock mutation.

## Automated Gates — PASS

Confirmed locally:

```text
Retroactive Milk module checks passed.
Retroactive Milk recovery routing checks passed.
Retroactive Milk UI checks passed.
Retroactive Milk isolated write checks passed.
Cutover documentation checks passed.
ALL 26 REGRESSION CHECKS PASSED
```

At the reported validation point:

- feature branch synchronized with origin;
- working tree clean.

## Browser and Responsive Gates — PASS

Confirmed:

- `tc_pending_saves_v1` absent before Teacher validation;
- Admin shell unchanged;
- Teacher Retroactive panel rendered;
- local preview `16 × 21 = 336` rendered without a write;
- room-scoped `retroMilk` request returned HTTP 200;
- seven history records rendered;
- no POST, PUT, PATCH, or DELETE;
- no Firebase index error;
- Console clean;
- loaded 820 x 1180 view contained fields, summaries, history cards, and unpressed rollback actions;
- no abnormal horizontal overflow.

Artifact:

- `docs/RETROACTIVE_MILK_BROWSER_VALIDATION_REPORT.md`

## Firebase Realtime Database Indexes

Published:

```text
/milkApp/absentMilk → .indexOn ["roomId"]
/milkApp/retroMilk  → .indexOn ["roomId"]
```

Root-level public `.read` and `.write` remain a production-security blocker.

## Mandatory Parity Sequence

Sprint 4.6:

- Vacation Milk operational UI;
- Room Stock-only issue/delete;
- typed Queue recovery;
- isolated and read-only browser gates.

Sprint 4.7:

- shared Media and Signature workflow;
- Attendance daily photo and Teacher signature;
- Pending, Retroactive, and Vacation Milk photo/signature evidence.

Sprint 4.8:

- Attendance history;
- daily/weekly/monthly/semester summaries;
- required 15-day mode;
- A4 preview and printing.

Sprint 4.9:

- student report;
- remaining Room Stock view;
- Teacher settings;
- complete navigation and final legacy parity matrix.

## Deferred Real-Classroom Incident — OPEN

Quarantined:

- room `อ.3-3`;
- room ID `mqn0z13eyx5b`;
- date `2026-07-28`;
- Attendance 22 present / 3 absent;
- Room Stock 1,253 versus recorded pre-test 1,275;
- known discrepancy -22.

Recovery remains mandatory before `main` or production cutover.

## Integration Decision

Sprint 4.5 may be fast-forward merged into `develop`.

This does not authorize:

- merge to `main`;
- production deployment;
- real-classroom write testing;
- replacement or removal of `teacher.html`;
- media/signature completion;
- report completion;
- Firebase security sign-off;
- physical iPad sign-off;
- incident closure.
