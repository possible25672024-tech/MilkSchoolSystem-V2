# MilkSchoolSystem-V2

# Sprint Status

Last Update

2026-07-29

---

Current Branch

feature/sprint-4.5-retroactive-milk-ui

---

Current Version

V2

---

Current Sprint

Sprint 4.5 — Retroactive Milk Operational UI

Status

70% — Sprint 4.4 is complete and merged into `develop`. Retroactive Milk legacy audit, Repository, Service, Manager, Teacher View, App integration, module gate, published Firebase room index, binding Teacher legacy parity contract, and typed `RETRO` recovery implementation are complete. The recovery-routing test is implemented and awaits local execution. Browser issue/delete actions remain prohibited.

---

Completed Foundation

✓ Sprint 3.4.2 Recovery merged into `develop`

✓ Sprint 3.4.3 Stock Module merged into `develop`

✓ Sprint 3.4.4 Report Module merged into `develop`

✓ Sprint 3.5 Room Module merged into `develop`

✓ Sprint 3.6 Teacher Service Foundation merged into `develop`

✓ Sprint 3.7 Attendance Service Foundation merged into `develop`

✓ Sprint 3.8 Offline Queue and Sync Module merged into `develop`

✓ Sprint 3.9 Performance and Payload Optimization merged into `develop`

✓ Sprint 4.0 Cutover Readiness and Compatibility merged into `develop`

✓ Sprint 4.1 Teacher UI Shell and Read-Only State merged into `develop`

✓ Sprint 4.2 Teacher Daily Attendance CRUD UI merged into `develop`

✓ Sprint 4.3 Offline Queue Operational UI merged into `develop`

✓ Sprint 4.4 Pending Milk Operational UI fast-forward merged into `develop`

✓ All 22 Sprint 4.4 regression checks passed

✓ Pending Milk Firebase room index published and validated

✓ Pending Milk desktop, Network, Console, and 820 x 1180 responsive gates passed

✓ Protected `index.html` and `teacher.html` remain unchanged and operational

✓ Physical iPad remains deferred and must not be represented as PASS

---

Teacher Legacy Parity Contract — BINDING

The product owner confirmed that V2 must retain every Teacher menu and operational capability from protected `teacher.html`.

Required capabilities include:

✓ ภาพรวมการดื่มนม

✓ เช็คดื่มนมรายวัน

✓ ประวัติการเช็ค

✓ สรุปรายงาน

✓ พิมพ์รายงาน A4

✓ นมค้างรายสัปดาห์

✓ จ่ายนมย้อนหลัง

✓ จ่ายนมช่วงปิดเทอม

✓ รายงานนักเรียน

✓ สต็อกนมคงเหลือ

✓ ตั้งค่า

✓ ออกจากระบบ

Photos, signatures, history, summaries, printing, Vacation Milk, student reports, stock view, settings, and final navigation parity are mandatory future work. They are deferred by Sprint sequence, not removed.

Artifact:

- `docs/TEACHER_LEGACY_PARITY_CONTRACT.md`

---

Sprint 4.5 Legacy Compatibility Audit — PASS

Protected `teacher.html` was inspected read-only.

Confirmed:

✓ Firebase path `milkApp/retroMilk`

✓ Firebase push-ID record keys

✓ authenticated Teacher room only

✓ academic year and semester

✓ issue date and inclusive retroactive date range

✓ Monday–Friday dates only

✓ `totalBoxes = weekday count × authenticated-room student count`

✓ `debtBoxes = totalBoxes`

✓ initial status `debt`

✓ compatible `note`, `signature`, `signatures`, `photos`, and `savedAt`

✓ record saved before Room Stock deduction

✓ issue ledger type `RETRO`

✓ delete removes record before Room Stock restoration

✓ delete ledger type `ROLLBACK`

✓ overlapping delete/rollback guard

✓ Main Stock remains unchanged

Artifact:

- `docs/RETROACTIVE_MILK_LEGACY_AUDIT.md`

---

Sprint 4.5 Runtime — IMPLEMENTED

Repository:

✓ `modules/repositories/retroactiveMilkRepository.js`

✓ room-scoped `retroMilk` query

✓ exact record load

✓ Firebase push-ID create

✓ exact record delete

Service:

✓ `modules/services/retroactiveMilkService.js`

✓ Teacher authenticated-room enforcement

✓ UTC-safe inclusive weekday calculation

✓ Saturday/Sunday exclusion

✓ reversed-range and zero-weekday rejection

✓ academic year and semester validation

✓ authenticated-room roster normalization

✓ quantity and debt preview

✓ exact duplicate academic-period/range protection

✓ compatible debt-record construction

✓ record-first issue workflow

✓ Room Stock-only deduction

✓ `RETRO` ledger and `OUT` stockLog

✓ record-first delete workflow

✓ exact Room Stock restoration

✓ `ROLLBACK` ledger and `IN` stockLog

✓ explicit partial-stock error details

✓ Main Stock delta zero

Manager:

✓ `modules/retroactive/retroactiveMilkManager.js`

✓ UI-safe preview, history, issue, and remove commands

✓ stable student snapshot from TeacherManager

✓ duplicate delete/rollback in-flight guard

✓ partial stock Queue delegation

✓ audit-only Queue delegation

✓ lifecycle events and Logout cleanup

View:

✓ `modules/retroactive/retroactiveMilkView.js`

✓ Teacher-only operational panel

✓ academic year, semester, issue date, room, and range inputs

✓ student, weekday, total, and debt summary cards

✓ optional note

✓ explicit issue confirmation

✓ Room Stock and queued-work feedback

✓ authenticated-room history

✓ confirmed delete/rollback action

✓ responsive layout

✓ no direct Firebase, Repository, browser storage, QueueStorage, stock, ledger, stockLog, or retry ownership

App:

✓ App loads Retroactive modules after Pending Milk

✓ App installs Retroactive sync routing before SyncView starts Queue replay

✓ `index.html` unchanged

✓ `teacher.html` unchanged

---

Module and Documentation Gates — PASS

Confirmed locally:

✓ `Retroactive Milk module checks passed.`

✓ `Cutover documentation checks passed.`

✓ feature branch synchronized with origin at the reported test point

✓ working tree clean at the reported test point

Module coverage includes:

- weekday calculation across a weekend;
- reversed-range rejection;
- weekend-only rejection;
- three students × two weekdays = six boxes;
- compatible debt record;
- exact duplicate range protection;
- issue changes Room Stock `100 → 94`;
- delete restores Room Stock `94 → 100`;
- `RETRO`/`ROLLBACK` ledger routing;
- `OUT`/`IN` stockLog routing;
- Main Stock remains 999;
- cross-room access rejection.

---

Typed Recovery Routing — IMPLEMENTED / LOCAL RUN PENDING

Added:

- `modules/sync/retroactiveSyncAdapter.js`
- `tests/retroactive-milk-recovery-routing-check.mjs`

Implemented:

✓ QueueStorage preserves `RETRO`

✓ SyncService normalizes and replays `RETRO`

✓ SyncManager safe summaries preserve `RETRO`

✓ SyncView labels Retroactive Milk retry safely

✓ App installs the adapter before startup Queue replay

✓ `RETRO` retry creates ledger type `RETRO`

✓ `RETRO` retry creates stockLog type `OUT`

✓ `ROLLBACK` remains ledger `ROLLBACK` and stockLog `IN`

✓ audit failure converts to audit-only work

✓ audit-only retry never repeats Room Stock mutation

✓ legacy Queue entries without operation metadata default to `ATTENDANCE`

✓ Main Stock remains unchanged

Local command:

```powershell
node tests/retroactive-milk-recovery-routing-check.mjs
```

Expected:

```text
Retroactive Milk recovery routing checks passed.
```

Until this test passes:

- do not click Retroactive Milk issue;
- do not click Retroactive Milk delete/rollback;
- do not create a real Queue entry;
- use Mock/In-memory validation only.

---

Firebase Realtime Database Index — PUBLISHED

Published under the existing Rules document:

```text
/milkApp/absentMilk → .indexOn ["roomId"]
/milkApp/retroMilk  → .indexOn ["roomId"]
```

The final read-only browser gate must confirm the room-scoped Retroactive Milk history request returns HTTP 200.

⚠ Root-level public `.read` and `.write` remain a production-security blocker.

---

Remaining Sprint-Specific Tests

```text
tests/retroactive-milk-ui-check.mjs
tests/retroactive-milk-isolated-write-check.mjs
```

Expected final regression count:

```text
26
```

---

Browser Gate — NOT STARTED

Read-only only after all automated and isolated gates pass.

Required:

□ Queue key absent or `[]` before Teacher Login

□ Admin Login/Logout unchanged

□ Retroactive Milk panel renders for Teacher only

□ room-scoped indexed history request returns HTTP 200

□ no `POST`, `PUT`, `PATCH`, or `DELETE`

□ no real issue or delete action pressed

□ Console clean

□ 820 x 1180 layout contained

□ Logout and Queue panel reachable

---

Mandatory Parity Sequence After Sprint 4.5

Sprint 4.6:

- Vacation Milk operational UI and Room Stock-only recovery.

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
- complete navigation and legacy parity matrix.

---

Deferred Real-Classroom Incident — OPEN

Quarantined:

- room `อ.3-3`
- room ID `mqn0z13eyx5b`
- date `2026-07-28`
- Attendance 22 present / 3 absent
- Room Stock 1,253 versus recorded pre-test 1,275
- known discrepancy -22

Rules:

- do not use the quarantined room/date for Retroactive Milk, Pending Milk, Attendance, or Queue tests;
- do not use its values as trusted operational evidence;
- do not manually edit Attendance, Room Stock, Main Stock, queue, ledger, stockLog, or transaction history;
- recovery remains mandatory before `main` or production cutover.

---

Production Security Blocker — OPEN

Firebase Realtime Database root Rules currently retain public:

```text
.read = true
.write = true
```

This remains acceptable only for the controlled development environment. It blocks production cutover and is not resolved by query indexes.

---

Protected Business Rules

- Main Stock decreases only on classroom distribution.
- Attendance, Pending Milk, Retroactive Milk, and Vacation Milk change Room Stock only.
- Retroactive delete restores Room Stock only.
- Quantity equals authenticated-room student count multiplied by inclusive Monday–Friday count.
- Exact duplicate academic-period/range issue is blocked by Service logic.
- Teacher access remains limited to the authenticated room.
- ETag conflicts read the latest Room Stock and recalculate before retry.
- Audit-only recovery never repeats a successful Room Stock mutation.
- Firebase path `milkApp/retroMilk` remains compatible.
- Queue storage key remains `tc_pending_saves_v1`.
- Legacy entries without operation metadata default to `ATTENDANCE`.
- Negative Room Stock is not silently clamped.
- Legacy files remain available until explicit production-cutover approval.
