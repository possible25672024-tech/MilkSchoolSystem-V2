# MilkSchoolSystem-V2

# Sprint Status

Last Update: 2026-07-29

Current Branch: `feature/sprint-4.6-vacation-milk-ui`

Current Version: V2

## Current Sprint

Sprint 4.6 — Vacation Milk Operational UI

Status: **100% — COMPLETE / APPROVED FOR FAST-FORWARD INTEGRATION INTO `develop`**

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
- Sprint 4.6 Vacation Milk Operational UI completed all acceptance gates.

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

Photos, signatures, visible and printable student detail, history, summaries, printing, student reports, Room Stock view, settings, and final navigation parity remain mandatory future work.

Artifact:

- `docs/TEACHER_LEGACY_PARITY_CONTRACT.md`

## Sprint 4.6 Runtime — COMPLETE

Implemented:

```text
modules/repositories/vacationMilkRepository.js
modules/services/vacationMilkService.js
modules/vacation/vacationMilkManager.js
modules/vacation/vacationMilkView.js
modules/sync/vacationSyncAdapter.js
```

Integrated through:

```text
modules/core/app.js
```

Protected behavior:

- Teacher authenticated-room enforcement;
- room-scoped Vacation Milk history;
- default 30-day vacation period;
- visible student roster and per-student box count;
- `totalBoxes = student count × vacation days`;
- exact duplicate guard;
- Room Stock-only issue and rollback;
- ledger `VACATION` and `ROLLBACK`;
- stockLog `OUT` and `IN`;
- typed Queue recovery;
- audit-only retry without repeated stock mutation;
- compatible `signature`, `signatures`, and `photos` fields;
- Main Stock delta zero;
- no direct Firebase or stock ownership in the View.

## Sprint-Specific Automated Gates — PASS

Confirmed locally:

```text
Vacation Milk module checks passed.
Vacation Milk recovery routing checks passed.
Vacation Milk UI checks passed.
Vacation Milk isolated write checks passed.
Cutover documentation checks passed.
```

Validated isolated behavior:

```text
Issue:    Room Stock 200 → 110
Rollback: Room Stock 110 → 200
Main Stock remained 999
```

Partial-save recovery:

```text
VACATION difference 30
ROLLBACK difference -30
```

No Firebase or real-classroom write was performed by the isolated tests.

## Full Regression Gate — PASS

Confirmed:

```text
ALL 30 REGRESSION CHECKS PASSED
```

Repository state at acceptance:

```text
On branch feature/sprint-4.6-vacation-milk-ui
Your branch is up to date with 'origin/feature/sprint-4.6-vacation-milk-ui'.
nothing to commit, working tree clean
```

## Firebase Realtime Database Index — PASS

Published Rules preserve:

```text
/milkApp/absentMilk   → .indexOn ["roomId"]
/milkApp/retroMilk    → .indexOn ["roomId"]
/milkApp/vacationMilk → .indexOn ["roomId"]
```

Read-only browser result:

```text
Method GET
Status 200
16 students × 30 days = 480 boxes
Room Stock = 476
History records = 0
```

The previous Firebase HTTP 400 index blocker is closed.

Root-level public `.read` and `.write` remain a production-security blocker.

## Browser, Console, and Responsive Gates — PASS

Accepted evidence:

- Admin authenticated shell rendered normally;
- Vacation Milk Teacher panel rendered for a non-quarantined room;
- 16 student names visible;
- 30 boxes shown for each student;
- Shared Media & Signature handoff visible;
- indexed room-scoped history GET returned HTTP 200;
- no POST, PUT, PATCH, or DELETE during read-only validation;
- Console contained no JavaScript or Firebase error;
- normal `MilkSchoolSystem V2 Started` message remained visible;
- desktop layout passed;
- responsive `820 x 1180` layout passed;
- no abnormal horizontal overflow;
- action and Logout controls remained reachable.

Artifacts:

- `docs/VACATION_MILK_LEGACY_AUDIT.md`
- `docs/VACATION_MILK_RECOVERY_ROUTING_GATE.md`
- `docs/VACATION_MILK_ISOLATED_WRITE_GATE.md`
- `docs/FIREBASE_RULES_VACATION_MILK_INDEX.md`
- `docs/VACATION_MILK_BROWSER_VALIDATION_REPORT.md`
- `docs/SPRINT_4_6_PLAN.md`

## Integration Decision

Sprint 4.6 is approved for fast-forward integration into `develop`.

This does not authorize:

- merge to `main`;
- production deployment;
- real-classroom writes;
- replacement of `teacher.html`;
- Media and Signature completion;
- report or A4 completion;
- Firebase security sign-off;
- physical iPad sign-off;
- closure of the deferred real-data incident.

## Next Sprint

Sprint 4.7 — Shared Media and Signature Workflow

Planned scope:

- shared photo selection and capture boundary;
- image type, count, and size validation;
- client-side compression and preview;
- Teacher signature capture;
- recipient or parent signature capture;
- Attendance daily evidence;
- Pending, Retroactive, and Vacation Milk evidence;
- lazy room/date/record media loading;
- Queue-safe metadata that does not expose or duplicate evidence payloads;
- legacy-compatible `photos`, `signature`, and `signatures` fields;
- isolated tests only before any browser write consideration.

## Safety Boundary

Do not use:

- room `อ.3-3`;
- room ID `mqn0z13eyx5b`;
- date `2026-07-28`;
- any real-classroom write;
- direct Firebase Console mutation of operational records;
- manual Queue, Room Stock, Main Stock, ledger, stockLog, or transaction-history repair.

## Production Blockers — OPEN

- deferred real-classroom incident;
- public Firebase root `.read` and `.write` rules;
- physical iPad validation;
- Media and Signature parity;
- report and print parity;
- remaining Teacher navigation parity;
- explicit `main` and production approval.

## Protected Business Rules

- Main Stock decreases only on classroom distribution.
- Attendance, Pending, Retroactive, and Vacation Milk change Room Stock only.
- Delete restores exactly the quantity previously deducted.
- Teacher access remains limited to the authenticated room.
- ETag conflicts read the latest Room Stock and recalculate before retry.
- Audit-only recovery never repeats a successful Room Stock mutation.
- Queue storage key remains `tc_pending_saves_v1`.
- Negative Room Stock is not silently clamped.
- Legacy files remain available until explicit production-cutover approval.
