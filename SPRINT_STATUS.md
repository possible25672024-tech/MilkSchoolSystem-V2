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

96% — Legacy audit, Repository, Service, Manager, Teacher View, App integration, Firebase room index, binding Teacher legacy parity contract, all four Sprint-specific gates, Cutover Documentation Gate, and all 26 automated regression checks passed locally. Final read-only desktop, indexed Network, clean Console, and 820 x 1180 responsive browser gates remain. Browser issue/delete actions remain prohibited.

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

✓ Pending Milk Firebase room index and browser gates passed

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

Sprint 4.5 Runtime — IMPLEMENTED

Repository:

- `modules/repositories/retroactiveMilkRepository.js`
- authenticated-room indexed `retroMilk` history query
- exact record load/create/delete

Service:

- `modules/services/retroactiveMilkService.js`
- authenticated Teacher-room enforcement
- UTC-safe inclusive Monday–Friday calculation
- reversed and weekend-only rejection
- stable room roster normalization
- `totalBoxes = student count × weekday count`
- `debtBoxes = totalBoxes`
- exact duplicate academic-period/range protection
- compatible record-first issue/delete
- Room Stock-only mutation
- ledger `RETRO` / `ROLLBACK`
- stockLog `OUT` / `IN`
- explicit partial-stock details
- Main Stock delta zero

Manager:

- `modules/retroactive/retroactiveMilkManager.js`
- UI-safe preview/history/issue/remove
- partial stock and audit-only Queue delegation
- overlapping delete guard
- lifecycle events and Logout cleanup

View:

- `modules/retroactive/retroactiveMilkView.js`
- Teacher-only panel
- academic period, issue date, room, date range, summary, note, history, and rollback UI
- explicit issue/delete confirmations
- responsive layout
- no direct Firebase, Repository, QueueStorage, stock, ledger, or retry ownership

App and Sync:

- `modules/core/app.js`
- `modules/sync/retroactiveSyncAdapter.js`
- adapter installs before startup Queue replay
- protected legacy files unchanged

---

Sprint-Specific Gates — PASS

Confirmed locally:

```text
Retroactive Milk module checks passed.
Retroactive Milk recovery routing checks passed.
Retroactive Milk UI checks passed.
Retroactive Milk isolated write checks passed.
Cutover documentation checks passed.
```

Module Gate:

✓ weekday calculation across a weekend

✓ reversed and weekend-only range rejection

✓ three students × two weekdays = six boxes

✓ exact duplicate range protection

✓ issue changes Room Stock `100 → 94`

✓ delete restores Room Stock `94 → 100`

✓ Main Stock remains 999

Recovery Routing Gate:

✓ legacy Queue entries default to `ATTENDANCE`

✓ QueueStorage, SyncService, SyncManager, and SyncView preserve `RETRO`

✓ RETRO replay changes Room Stock once

✓ ledger `RETRO` / stockLog `OUT`

✓ ROLLBACK restores exact quantity

✓ failed audit becomes audit-only work

✓ audit-only replay never repeats Room Stock mutation

✓ Main Stock remains 999

Operational UI Gate:

✓ Teacher-only activation and Admin rejection

✓ authenticated room and form fields

✓ student/day/box/debt summaries

✓ explicit issue and delete confirmation

✓ Room Stock `100 → 94 → 100` feedback

✓ room history and debt badge

✓ partial-save Queue warning

✓ Teacher refresh and Logout cleanup

Isolated Write Gate:

✓ successful six-box issue

✓ duplicate range rejection

✓ successful exact rollback

✓ partial issue queues `RETRO` difference `3`

✓ partial delete queues `ROLLBACK` difference `-3`

✓ failed stock mutation leaves Room Stock unchanged before retry

✓ compatible `signature`, `signatures`, and `photos` fields remain present

✓ Main Stock remains 999

Artifacts:

- `docs/RETROACTIVE_MILK_RECOVERY_ROUTING_GATE.md`
- `docs/RETROACTIVE_MILK_ISOLATED_WRITE_GATE.md`
- `docs/RETROACTIVE_MILK_UI_IMPLEMENTATION_REPORT.md`

---

Automated Regression Gate — PASS

Existing tests before Sprint 4.5: 22

Sprint 4.5 tests: 4

Confirmed locally:

```text
ALL 26 REGRESSION CHECKS PASSED
```

✓ feature branch synchronized with origin

✓ working tree clean

---

Firebase Realtime Database Index — PUBLISHED

```text
/milkApp/absentMilk → .indexOn ["roomId"]
/milkApp/retroMilk  → .indexOn ["roomId"]
```

The final read-only browser gate must confirm the indexed Retroactive Milk history request returns HTTP 200.

Root-level public `.read` and `.write` remain a production-security blocker.

---

Browser Gate — READY / READ-ONLY

Artifact:

- `docs/RETROACTIVE_MILK_BROWSER_VALIDATION_REPORT.md`

Required:

□ Queue key absent or `[]` before Teacher Login

□ Admin Login/Logout unchanged with clean Console

□ Retroactive Milk panel renders for Teacher only

□ valid local preview renders without a write request

□ room-scoped indexed history request returns HTTP 200

□ history or correct empty state renders

□ no `POST`, `PUT`, `PATCH`, or `DELETE`

□ no real issue or delete action pressed

□ Console clean

□ loaded 820 x 1180 layout contained

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
