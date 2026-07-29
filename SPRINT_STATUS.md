# MilkSchoolSystem-V2

# Sprint Status

Last Update

2026-07-29

---

Current Branch

feature/sprint-4.4-pending-milk-ui

---

Current Version

V2

---

Current Sprint

Sprint 4.4 — Pending Milk Operational UI

Status

100% — Runtime, legacy compatibility, typed recovery, all 22 automated regression checks, Firebase `roomId` index, desktop Admin/Teacher read-only browser validation, exact five-day Attendance reads, indexed room-scoped `absentMilk` read, eligibility/history rendering, read-only Network boundary, clean Console, completed-data responsive validation at 820 x 1180, and clean synchronized Git state passed.

---

Completed Runtime

✓ `modules/repositories/pendingMilkRepository.js`

✓ `modules/services/pendingMilkService.js`

✓ `modules/pending/pendingMilkManager.js`

✓ `modules/pending/pendingMilkView.js`

✓ App integration after Offline Queue UI

✓ exact Monday–Friday Attendance reads

✓ authenticated-room `absentMilk` query

✓ absent-only eligibility

✓ already-issued exclusion

✓ Service-level duplicate recheck

✓ compatible `absentMilk` record fields

✓ Room Stock-only issue and rollback

✓ `PENDING` / `ROLLBACK` ledger routing

✓ `OUT` / `IN` stockLog routing

✓ typed partial-save Queue recovery

✓ Main Stock delta remains zero

✓ protected `index.html` and `teacher.html` unchanged

---

Automated Gates — PASS

Existing Sprint 4.3 tests: 18

Sprint 4.4 tests: 4

Total: 22

✓ `tests/pending-milk-module-check.mjs`

✓ `tests/pending-milk-recovery-routing-check.mjs`

✓ `tests/pending-milk-ui-check.mjs`

✓ `tests/pending-milk-isolated-write-check.mjs`

✓ successful two-box issue changed Room Stock `50 → 48`

✓ duplicate student/date issue blocked

✓ successful delete restored Room Stock `48 → 50`

✓ partial issue queued typed `PENDING` difference `1`

✓ partial delete queued typed `ROLLBACK` difference `-1`

✓ audit-only retry never repeated Room Stock mutation

✓ Main Stock remained 999 throughout

✓ `ALL 22 REGRESSION CHECKS PASSED`

---

Firebase Index Gate — PASS

Published under `/milkApp/absentMilk`:

```json
{
  ".indexOn": ["roomId"]
}
```

✓ room-scoped query changed from HTTP 400 to HTTP 200

✓ existing permission structure preserved

⚠ root-level public `.read` and `.write` remain a separate production-security blocker

---

Desktop Browser Read-Only Gate — PASS

✓ Queue safety checked before Teacher Login

✓ Admin shell rendered unchanged

✓ Pending Milk panel rendered for Teacher only

✓ exact five date-scoped Attendance reads

✓ indexed room-scoped `absentMilk` read returned HTTP 200

✓ summary rendered `มีสิทธิ์รับ 0`, `เคยรับแล้ว 4`, `เลือกแล้ว 0`, `กล่องที่จะหัก 0`

✓ correct no-eligible-item message rendered

✓ existing four-box room history rendered

✓ issue and delete/rollback actions remained unpressed

✓ no `POST`, `PUT`, `PATCH`, or `DELETE`

✓ Console contained only `MilkSchoolSystem V2 Started`

---

Responsive Gate at 820 x 1180 — PASS

✓ loaded summary and empty state remained contained

✓ existing four-box history and unpressed rollback action remained contained

✓ Logout remained reachable

✓ Queue panel and Queue summary remained reachable

✓ no abnormal horizontal overflow

✓ Console remained clean

---

Git Gate — PASS

✓ feature branch synchronized with origin

✓ `develop` synchronized at the recorded integration point

✓ working tree clean

✓ local and origin commit matched at `7a5539a` before closeout documentation

---

Integration Decision

✓ Sprint 4.4 approved for fast-forward integration into `develop`

✗ no merge or deployment to `main`

✗ no production cutover

✗ no replacement or removal of `teacher.html`

✗ no real-classroom write validation

---

Next Sprint

Sprint 4.5 — Retroactive Milk Operational UI

Planned branch:

```text
feature/sprint-4.5-retroactive-milk-ui
```

Initial boundary:

- inspect protected Retroactive Milk behavior read-only;
- preserve `milkApp/retroMilk` schema;
- calculate Monday–Friday range only;
- quantity equals weekday count multiplied by authenticated-room student count;
- create compatible debt record before Room Stock deduction;
- deduct Room Stock only;
- use ledger type `RETRO`;
- delete record before Room Stock restoration;
- use ledger type `ROLLBACK`;
- prevent duplicate delete/rollback execution;
- add typed Queue recovery for partial issue/delete stock work;
- validate writes only with in-memory or isolated services;
- preserve protected legacy files.

---

Deferred Real-Classroom Incident — OPEN

Quarantined:

- room `อ.3-3`
- room ID `mqn0z13eyx5b`
- date `2026-07-28`
- Attendance 22 present / 3 absent
- Room Stock 1,253 versus recorded pre-test 1,275
- known discrepancy -22

Recovery and explicit incident closure remain mandatory before `main`, production cutover, or official operational acceptance.

---

Protected Business Rules

- Main Stock decreases only on classroom distribution.
- Pending, Retroactive, Vacation, Attendance, and Sync operations change Room Stock only.
- One Pending Milk student/date pair equals one box.
- Retroactive quantity equals weekday count multiplied by authenticated-room student count.
- Quantity is deducted exactly once.
- Duplicate operations are blocked by Service/Manager logic.
- Teacher access remains limited to the authenticated room.
- ETag conflicts read the latest Room Stock and recalculate before retry.
- Audit-only recovery never repeats a successful Room Stock mutation.
- Queue storage key remains `tc_pending_saves_v1`.
- Negative Room Stock is not silently clamped.
- Legacy files remain available until explicit production-cutover approval.
