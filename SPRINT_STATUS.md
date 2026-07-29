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

55% — Sprint 4.4 is complete and merged into `develop`. Retroactive Milk legacy audit, Repository, Service, Manager, Teacher View, App integration, Sprint plan, and module test are implemented. Local module validation and typed `RETRO` Queue recovery are the next gates. Browser issue/delete actions remain prohibited.

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

Sprint 4.5 Legacy Compatibility Audit — PASS

Protected `teacher.html` was inspected read-only.

Confirmed:

✓ Firebase path `milkApp/retroMilk`

✓ Firebase push-ID record keys

✓ authenticated Teacher room only

✓ academic year and semester fields

✓ issue date

✓ inclusive retroactive start/end range

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

✓ UTC-safe calendar validation

✓ inclusive weekday calculation

✓ Saturday/Sunday exclusion

✓ reversed-range rejection

✓ zero-weekday rejection

✓ academic year and semester validation

✓ authenticated-room roster normalization

✓ quantity and debt preview

✓ exact duplicate academic-period/range protection

✓ compatible debt-record construction

✓ record-first issue workflow

✓ ETag-protected Room Stock deduction through the shared Attendance stock boundary

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

✓ App loads Retroactive Repository, Service, Manager, and View after Pending Milk

✓ `index.html` unchanged

✓ `teacher.html` unchanged

---

Module Gate — IMPLEMENTED / LOCAL RUN PENDING

Added:

- `tests/retroactive-milk-module-check.mjs`

Coverage:

✓ valid JavaScript for all four modules

✓ preserved Firebase path and room query

✓ protected View boundary

✓ weekday calculation across a weekend

✓ reversed-range rejection

✓ weekend-only rejection

✓ three students × two weekdays = six boxes

✓ compatible debt record

✓ exact duplicate range protection

✓ issue changes Room Stock `100 → 94`

✓ delete restores Room Stock `94 → 100`

✓ `RETRO`/`ROLLBACK` ledger routing

✓ `OUT`/`IN` stockLog routing

✓ Main Stock remains 999

✓ cross-room access rejected

Local command:

```powershell
node tests/retroactive-milk-module-check.mjs
```

Expected:

```text
Retroactive Milk module checks passed.
```

---

Recovery Routing Gate — PENDING

Current partial-save Manager metadata requests:

```text
RETRO    → issue Room Stock deduction
ROLLBACK → delete Room Stock restoration
```

Pending changes:

□ QueueStorage accepts and preserves `RETRO`

□ SyncService accepts and replays `RETRO`

□ SyncManager safe summaries expose `RETRO`

□ SyncView labels Retroactive Milk retry safely

□ legacy entries without operation metadata still default to `ATTENDANCE`

□ `RETRO` retry creates ledger type `RETRO` and stockLog type `OUT`

□ audit-only retry never repeats Room Stock mutation

Until this gate passes:

- do not click Retroactive Milk issue;
- do not click Retroactive Milk delete/rollback;
- do not create a real Queue entry;
- use Mock/In-memory validation only.

---

Remaining Sprint-Specific Tests

```text
tests/retroactive-milk-recovery-routing-check.mjs
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

□ room-scoped history request

□ required Firebase `.indexOn: ["roomId"]` at `/milkApp/retroMilk`, when needed

□ no `POST`, `PUT`, `PATCH`, or `DELETE`

□ no real issue or delete action pressed

□ Console clean

□ 820 x 1180 layout contained

□ Logout and Queue panel reachable

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

This remains acceptable only for the current controlled development environment. It blocks production cutover and is not resolved by adding query indexes.

---

Out of Scope / Not Authorized

- debt settlement by the local authority
- Vacation Milk UI
- new photo/signature capture
- Retroactive print/report changes
- Admin operational UI
- replacement or removal of `teacher.html`
- merge to `main`
- production deployment
- real-classroom write tests

---

Protected Business Rules

- Main Stock decreases only on classroom distribution.
- Retroactive Milk deducts Room Stock only.
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
