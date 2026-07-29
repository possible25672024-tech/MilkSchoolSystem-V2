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

98% — Runtime, legacy compatibility, typed recovery, all 22 automated tests, Firebase `roomId` index, desktop Admin/Teacher read-only browser gate, exact five-day Attendance reads, indexed room-scoped `absentMilk` read, eligibility/history rendering, read-only Network boundary, clean Console, and prior responsive layout checks passed. One final 820 x 1180 completed-data screenshot remains before Sprint closure.

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

✓ Protected `index.html` and `teacher.html` remain unchanged and operational

✓ Physical iPad remains deferred and must not be represented as PASS

---

Sprint 4.4 Runtime — IMPLEMENTED

✓ `modules/repositories/pendingMilkRepository.js`

✓ `modules/services/pendingMilkService.js`

✓ `modules/pending/pendingMilkManager.js`

✓ `modules/pending/pendingMilkView.js`

✓ App integration after the completed Queue UI

✓ exact Monday–Friday Attendance reads

✓ room-scoped `absentMilk` history query

✓ one absent student/date pair equals one box

✓ already-issued exclusion

✓ Service-level duplicate recheck

✓ compatible `absentMilk` record fields

✓ Room Stock-only issue and rollback

✓ `PENDING`/`ROLLBACK` ledger routing

✓ `OUT`/`IN` stockLog routing

✓ typed partial-save Queue recovery

✓ Main Stock delta remains zero

---

Sprint-Specific Automated Gates — PASS

✓ `tests/pending-milk-module-check.mjs`

✓ `Pending Milk module checks passed.`

✓ `tests/pending-milk-recovery-routing-check.mjs`

✓ `Pending Milk recovery routing checks passed.`

✓ `tests/pending-milk-ui-check.mjs`

✓ `Pending Milk UI checks passed.`

✓ `tests/pending-milk-isolated-write-check.mjs`

✓ `Pending Milk isolated write checks passed.`

Confirmed isolated behavior:

- successful two-box issue changes Room Stock `50 → 48`;
- duplicate student/date issue is blocked;
- successful delete restores Room Stock `48 → 50`;
- partial issue queues typed `PENDING` difference `1`;
- partial delete queues typed `ROLLBACK` difference `-1`;
- audit-only retry never repeats Room Stock mutation;
- Main Stock remains 999 throughout.

---

Automated Regression Gate — PASS

Existing Sprint 4.3 tests: 18

Sprint 4.4 tests: 4

Total: 22

✓ `ALL 22 REGRESSION CHECKS PASSED`

✓ feature branch synchronized with origin at the reported test point

✓ working tree clean at the reported test point

---

Firebase Realtime Database Index — PUBLISHED / VALIDATED

Published under the existing Rules document:

```json
{
  "rules": {
    ".read": true,
    ".write": true,
    "milkApp": {
      "absentMilk": {
        ".indexOn": ["roomId"]
      }
    }
  }
}
```

✓ room-scoped `absentMilk` REST query changed from HTTP 400 to HTTP 200

✓ existing root permissions were preserved

⚠ Root-level public `.read` and `.write` remain a separate production-security blocker

Artifact:

- `docs/FIREBASE_RULES_PENDING_MILK_INDEX.md`

---

Desktop Browser Read-Only Gate — PASS

Safety:

✓ Queue safety checked before Teacher validation

✓ no Pending Milk issue action pressed

✓ no Pending Milk delete/rollback action pressed

✓ no real Queue entry created or replayed

✓ quarantined room/date excluded

Admin:

✓ Admin shell rendered unchanged

✓ Teacher Queue and Pending Milk panels did not activate for Admin

✓ no JavaScript Console error

Teacher:

✓ Pending Milk panel rendered

✓ week selector and Load button rendered

✓ four summary cards rendered

✓ note, history, issue action, Queue panel, and Logout remained reachable

✓ selected week issued exactly five date-scoped Attendance reads

✓ room-scoped `absentMilk` query returned HTTP 200

✓ UI rendered `มีสิทธิ์รับ 0`, `เคยรับแล้ว 4`, `เลือกแล้ว 0`, and `กล่องที่จะหัก 0`

✓ correct no-eligible-item message rendered

✓ room history rendered an existing four-box record

✓ issue action remained disabled/unpressed

✓ visible delete/rollback action remained unpressed

✓ no `POST`, `PUT`, `PATCH`, or `DELETE` appeared

✓ Console contained only the normal startup message

Artifact:

- `docs/PENDING_MILK_BROWSER_VALIDATION_REPORT.md`

---

Responsive Gate at 820 x 1180 — FINAL EVIDENCE PENDING

Previously passed:

✓ week selector and Load button reachable

✓ four summary cards readable

✓ Attendance and Pending Milk areas contained

✓ note and disabled issue action reachable

✓ history area and Logout contained

✓ Queue panel reachable

✓ no abnormal horizontal overflow

Final evidence required after successful indexed data load:

□ loaded summary and empty state remain contained

□ rendered history record and unpressed delete action remain contained

□ Queue panel and Logout remain reachable

□ Console remains clean

□ no mutation request appears

Physical iPad remains deferred and must not be represented as PASS.

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

- do not use the quarantined room/date for Pending Milk or Queue tests;
- do not use its values as trusted operational evidence;
- do not manually edit Attendance, Room Stock, Main Stock, queue, ledger, stockLog, or transaction history;
- recovery remains mandatory before `main` or production cutover.

---

Out of Scope / Not Authorized

- Retroactive Milk UI
- Vacation Milk UI
- photos and signatures capture
- Attendance history and printing
- Report UI
- Admin operational UI
- Firebase schema migration
- replacement or removal of `teacher.html`
- merge to `main`
- production deployment
- real-classroom write tests

---

Protected Business Rules

- Main Stock decreases only on classroom distribution.
- Pending Milk deducts Room Stock only.
- One eligible student/date pair equals one box.
- Quantity is deducted exactly once.
- Duplicate issue is blocked by Service logic.
- Teacher access remains limited to the authenticated room.
- ETag conflicts read the latest Room Stock and recalculate before retry.
- Audit-only recovery never repeats a successful Room Stock mutation.
- Existing Attendance records are read-only eligibility sources.
- Firebase path `milkApp/absentMilk` remains compatible.
- Queue storage key remains `tc_pending_saves_v1`.
- Negative Room Stock is not silently clamped.
- Legacy files remain available until explicit production-cutover approval.
