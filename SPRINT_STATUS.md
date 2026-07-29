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

82% — Legacy audit, Repository, Service, Manager, Teacher View, App integration, Firebase room index, binding Teacher parity contract, Module Gate, Cutover Documentation Gate, and typed RETRO Recovery Gate passed. Operational UI and isolated issue/delete/partial-save tests are implemented and await local execution. Browser issue/delete actions remain prohibited.

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

---

Sprint 4.5 Legacy Compatibility Audit — PASS

Confirmed from protected `teacher.html`:

✓ Firebase path `milkApp/retroMilk`

✓ Firebase push-ID record keys

✓ authenticated Teacher room only

✓ academic year, semester, issue date, and inclusive date range

✓ Monday–Friday calculation

✓ `totalBoxes = weekday count × authenticated-room student count`

✓ `debtBoxes = totalBoxes`

✓ initial status `debt`

✓ compatible `note`, `signature`, `signatures`, `photos`, and `savedAt`

✓ record saved before Room Stock deduction

✓ issue ledger type `RETRO`, stockLog type `OUT`

✓ delete removes record before Room Stock restoration

✓ delete ledger type `ROLLBACK`, stockLog type `IN`

✓ overlapping delete/rollback guard

✓ Main Stock remains unchanged

Artifact:

- `docs/RETROACTIVE_MILK_LEGACY_AUDIT.md`

---

Sprint 4.5 Runtime — IMPLEMENTED

Repository:

- `modules/repositories/retroactiveMilkRepository.js`
- room-scoped indexed history query
- exact record load/create/delete

Service:

- `modules/services/retroactiveMilkService.js`
- Teacher room enforcement
- UTC-safe inclusive weekday calculation
- reversed/weekend-only rejection
- roster normalization
- total and debt preview
- exact duplicate range protection
- compatible record-first issue/delete
- Room Stock-only mutation
- `RETRO`/`ROLLBACK` ledger routing
- `OUT`/`IN` stockLog routing
- explicit partial-stock details
- Main Stock delta zero

Manager:

- `modules/retroactive/retroactiveMilkManager.js`
- UI-safe preview/history/issue/remove
- stable Teacher roster snapshot
- partial stock and audit-only Queue delegation
- overlapping delete guard
- lifecycle events and cleanup

View:

- `modules/retroactive/retroactiveMilkView.js`
- Teacher-only panel
- academic period, issue date, range, room, and note fields
- student/day/box/debt summaries
- explicit issue/delete confirmations
- Room Stock and Queue feedback
- room history and rollback actions
- responsive layout
- no direct Firebase, Repository, QueueStorage, stock, ledger, or retry ownership

App and Sync:

- `modules/core/app.js`
- `modules/sync/retroactiveSyncAdapter.js`
- adapter installs before startup Queue replay
- protected legacy files unchanged

---

Confirmed Local Gates — PASS

```text
Retroactive Milk module checks passed.
Retroactive Milk recovery routing checks passed.
Cutover documentation checks passed.
```

At the reported validation point:

✓ branch synchronized with origin

✓ working tree clean

Recovery coverage:

✓ legacy Queue entries default to `ATTENDANCE`

✓ QueueStorage, SyncService, SyncManager, and SyncView preserve `RETRO`

✓ RETRO replay changes Room Stock once

✓ ledger `RETRO` / stockLog `OUT`

✓ ROLLBACK restores exact quantity

✓ failed audit becomes audit-only work

✓ audit-only replay never repeats Room Stock mutation

✓ Main Stock remains 999

Artifacts:

- `docs/RETROACTIVE_MILK_RECOVERY_ROUTING_GATE.md`
- `tests/retroactive-milk-recovery-routing-check.mjs`

---

Operational UI and Isolated Write Gates — IMPLEMENTED / LOCAL RUN PENDING

Added:

- `tests/retroactive-milk-ui-check.mjs`
- `tests/retroactive-milk-isolated-write-check.mjs`
- `docs/RETROACTIVE_MILK_ISOLATED_WRITE_GATE.md`

UI coverage:

✓ Teacher-only activation and Admin rejection

✓ authenticated room and form fields

✓ three students × two weekdays = six boxes

✓ student/day/box/debt summaries

✓ explicit issue and delete confirmation

✓ Room Stock `100 → 94 → 100` feedback

✓ room history and debt badge

✓ partial-save Queue warning

✓ Teacher refresh and Logout cleanup

✓ parity contract retains future roster/photo/signature work

Isolated write coverage:

✓ successful six-box issue

✓ duplicate range rejection

✓ successful exact rollback

✓ partial issue queues `RETRO` difference `3`

✓ partial delete queues `ROLLBACK` difference `-3`

✓ failed stock mutation leaves Room Stock unchanged before retry

✓ compatible media/signature fields remain present

✓ Main Stock remains 999

Pending local commands:

```powershell
node tests/retroactive-milk-ui-check.mjs
node tests/retroactive-milk-isolated-write-check.mjs
```

Expected:

```text
Retroactive Milk UI checks passed.
Retroactive Milk isolated write checks passed.
```

---

Firebase Realtime Database Index — PUBLISHED

```text
/milkApp/absentMilk → .indexOn ["roomId"]
/milkApp/retroMilk  → .indexOn ["roomId"]
```

The final read-only browser gate must confirm the indexed Retroactive Milk history request returns HTTP 200.

Root-level public `.read` and `.write` remain a production-security blocker.

---

Automated Regression Target

Existing tests before Sprint 4.5: 22

Sprint 4.5 tests: 4

Expected final total:

```text
26
```

After the two new tests pass, run all 26 regression checks.

---

Browser Gate — NOT STARTED

Read-only only after all automated and isolated gates pass.

Required:

- Queue key absent or `[]` before Teacher Login
- Admin Login/Logout unchanged
- Retroactive Milk panel renders for Teacher only
- room-scoped history request returns HTTP 200
- no `POST`, `PUT`, `PATCH`, or `DELETE`
- no real issue or delete action pressed
- Console clean
- 820 x 1180 layout contained
- Logout and Queue panel reachable

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
- complete navigation and final legacy parity matrix.

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
