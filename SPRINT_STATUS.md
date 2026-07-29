# MilkSchoolSystem-V2

# Sprint Status

Last Update: 2026-07-29

Current Branch: `feature/sprint-4.6-vacation-milk-ui`

Current Version: V2

## Current Sprint

Sprint 4.6 — Vacation Milk Operational UI

Status: **82% — MODULE AND RECOVERY GATES PASSED / UI AND ISOLATED TESTS IMPLEMENTED / FIREBASE INDEX BLOCKER CONFIRMED**

Sprint 4.5 Retroactive Milk Operational UI completed all automated, isolated, desktop, indexed Network, Console, and 820 x 1180 responsive gates and was fast-forward integrated into `develop` at:

```text
fd15eb2712db83c6b0b13f0eee6a8da635681337
```

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

## Sprint 4.6 Legacy Audit — PASS

Confirmed from protected `teacher.html`:

- Firebase path `milkApp/vacationMilk`;
- Firebase push-ID records;
- academic year and vacation after semester 1 or 2;
- issue date;
- vacation-day count defaults to 30 and has minimum 1;
- `totalBoxes = authenticated-room student count × day count`;
- current Room Stock display and insufficient-stock warning;
- visible authenticated-room student roster;
- per-student parent/recipient signatures;
- up to five photo items in the legacy UI;
- compatible `note`, `signature`, `signatures`, `photos`, and `savedAt` fields;
- record saved before Room Stock deduction;
- issue ledger type `VACATION`;
- delete removes record before Room Stock restoration;
- delete ledger type `ROLLBACK`;
- history and A4 report compatibility;
- Main Stock remains unchanged.

Artifact:

- `docs/VACATION_MILK_LEGACY_AUDIT.md`

## Sprint 4.6 Runtime — IMPLEMENTED

Repository:

- `modules/repositories/vacationMilkRepository.js`;
- room-scoped `vacationMilk` query;
- exact record load/create/delete.

Service:

- `modules/services/vacationMilkService.js`;
- authenticated Teacher-room enforcement;
- academic year, semester, issue date, and day validation;
- stable room roster normalization;
- quantity preview;
- exact duplicate guard using room, academic year, semester, issue date, and days;
- compatible record construction;
- record-first issue and delete;
- Room Stock-only mutation;
- ledger `VACATION`/`ROLLBACK`;
- stockLog `OUT`/`IN`;
- explicit partial-stock details;
- Main Stock delta zero.

Manager:

- `modules/vacation/vacationMilkManager.js`;
- UI-safe preview/history/issue/remove;
- stable Teacher roster snapshot;
- partial stock and audit-only Queue delegation;
- overlapping delete guard;
- lifecycle events and cleanup.

View:

- `modules/vacation/vacationMilkView.js`;
- Teacher-only panel;
- academic year, semester, issue date, room, and day inputs;
- student/day/box/Room Stock summary;
- visible student roster and per-student box count;
- explicit Shared Media & Signature handoff;
- optional note;
- issue confirmation;
- Room Stock and Queue feedback;
- room history and confirmed rollback;
- responsive layout;
- no direct Firebase, Repository, QueueStorage, stock, ledger, or retry ownership.

App and Sync:

- `modules/core/app.js`;
- `modules/sync/vacationSyncAdapter.js`;
- Retroactive and Vacation adapters install before Queue startup replay;
- existing `ATTENDANCE`, `PENDING`, `RETRO`, and `ROLLBACK` routing remains available;
- protected legacy files remain unchanged.

## Module, Recovery, and Documentation Gates — PASS

Confirmed locally:

```text
Vacation Milk module checks passed.
Vacation Milk recovery routing checks passed.
Cutover documentation checks passed.
```

At the reported validation point:

- feature branch synchronized with origin;
- working tree clean.

Module coverage:

- three students × 30 days = 90 boxes;
- compatible signatures and photos;
- issue changes Room Stock `200 → 110`;
- exact duplicate issue blocked;
- delete restores Room Stock `110 → 200`;
- ledger `VACATION`/`ROLLBACK`;
- stockLog `OUT`/`IN`;
- cross-room rejection;
- Main Stock remains 999.

Recovery coverage:

- QueueStorage, SyncService, SyncManager, and SyncView preserve `VACATION`;
- App installs Vacation routing before startup Queue replay;
- legacy Queue entries remain `ATTENDANCE`;
- existing `RETRO`, `PENDING`, and `ROLLBACK` remain available;
- Vacation replay changes Room Stock exactly once;
- ledger `VACATION` quantity `-90`;
- stockLog `OUT` quantity `90`;
- failed audit becomes audit-only work;
- audit-only retry never repeats Room Stock mutation;
- exact rollback restores Room Stock `110 → 200`;
- Main Stock remains 999.

Artifacts:

- `docs/VACATION_MILK_RECOVERY_ROUTING_GATE.md`

## Operational UI and Isolated Write Gates — IMPLEMENTED / LOCAL RUN PENDING

Added:

```text
tests/vacation-milk-ui-check.mjs
tests/vacation-milk-isolated-write-check.mjs
docs/VACATION_MILK_ISOLATED_WRITE_GATE.md
```

Coverage:

- Teacher-only panel and Admin rejection;
- default 30-day vacation period;
- visible student names and per-student quantity;
- Shared Media & Signature handoff;
- student/day/box/Room Stock summaries;
- explicit issue and delete confirmations;
- successful issue feedback `200 → 110`;
- successful delete feedback `110 → 200`;
- exact duplicate rejection;
- partial issue queued as `VACATION` difference `30`;
- partial delete queued as `ROLLBACK` difference `-30`;
- failed stock mutation leaves Room Stock unchanged before retry;
- compatible `signature`, `signatures`, and `photos` fields remain present;
- no Firebase or real classroom writes;
- Main Stock remains 999.

Expected:

```text
Vacation Milk UI checks passed.
Vacation Milk isolated write checks passed.
```

## Firebase Realtime Database Index — CONFIRMED BLOCKER

Read-only browser evidence confirms the operational preview works:

```text
16 students × 30 days = 480 boxes
Room Stock = 476
```

History loading currently returns HTTP 400:

```text
Index not defined, add ".indexOn": "roomId", for path "/milkApp/vacationMilk"
```

Current Firebase Rules still contain only:

```text
/milkApp/absentMilk → .indexOn ["roomId"]
/milkApp/retroMilk  → .indexOn ["roomId"]
```

After the UI and isolated write gates pass, preserve those indexes and add:

```text
/milkApp/vacationMilk → .indexOn ["roomId"]
```

Root-level public `.read` and `.write` remain a production-security blocker.

## Remaining Gates

1. Vacation Milk UI local test.
2. Vacation Milk isolated write local test.
3. Publish and validate the Vacation Milk room index.
4. Complete all 30 regression checks.
5. Desktop read-only indexed Network and Console gate.
6. Responsive 820 x 1180 gate.
7. Clean branch and working tree.

## Browser Restriction

- do not press `บันทึกนมช่วงปิดเทอม`;
- do not press Vacation Milk delete/rollback;
- do not create or replay a real Queue entry;
- do not use a real-classroom write.

## Mandatory Parity Sequence After Sprint 4.6

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

## Protected Business Rules

- Main Stock decreases only on classroom distribution.
- Vacation Milk changes Room Stock only.
- Delete restores Room Stock only.
- Quantity equals authenticated-room student count multiplied by vacation-day count.
- Exact duplicate issue is blocked by Service logic.
- Teacher access remains limited to the authenticated room.
- ETag conflicts read the latest Room Stock and recalculate before retry.
- Audit-only recovery never repeats a successful Room Stock mutation.
- Firebase path `milkApp/vacationMilk` remains compatible.
- Queue storage key remains `tc_pending_saves_v1`.
- Negative Room Stock is not silently clamped.
- Legacy files remain available until explicit production-cutover approval.
