# MilkSchoolSystem-V2

# Sprint Status

Last Update: 2026-07-29

Current Branch: `feature/sprint-4.7-media-signature-ui`

Current Version: V2

## Current Sprint

Sprint 4.7 — Shared Media and Signature Workflow

Status: **30% — LEGACY AUDIT AND PURE MEDIA POLICY IMPLEMENTED / LOCAL VALIDATION PENDING**

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
- Sprint 4.6 Vacation Milk Operational UI merged into `develop` at `5e462c9bb80f0f991045ff80ccd294d4240421cd`.

Protected `index.html` and `teacher.html` remain unchanged and operational.

Physical iPad remains deferred and must not be represented as PASS.

## Sprint 4.6 Acceptance Record

Confirmed before integration:

```text
Vacation Milk module checks passed.
Vacation Milk recovery routing checks passed.
Vacation Milk UI checks passed.
Vacation Milk isolated write checks passed.
Cutover documentation checks passed.
ALL 30 REGRESSION CHECKS PASSED
```

Browser evidence passed:

- indexed `vacationMilk` room GET returned HTTP 200;
- no POST, PUT, PATCH, or DELETE during read-only validation;
- Console clean;
- 16 students × 30 days = 480 boxes;
- Room Stock 476 visible;
- desktop and 820 x 1180 responsive layouts passed;
- working tree clean and branch synchronized with origin.

Artifacts:

- `docs/SPRINT_4_6_PLAN.md`
- `docs/VACATION_MILK_BROWSER_VALIDATION_REPORT.md`
- `docs/FIREBASE_RULES_VACATION_MILK_INDEX.md`

## Sprint 4.7 Progress Record

Teacher-session roster race condition fixed and locally accepted:

```text
Teacher session roster fallback checks passed.
Vacation Milk UI checks passed.
nothing to commit, working tree clean
```

Browser evidence after the fix:

- authenticated room roster visible with 16 students;
- Vacation preview calculated 16 × 30 = 480 boxes;
- live Room Stock 1,040 visible;
- no real evidence write performed.

Current Sprint artifacts:

- `docs/MEDIA_SIGNATURE_LEGACY_AUDIT.md`
- `modules/media/mediaPolicy.js`
- `tests/media-policy-check.mjs`

The legacy field and ownership audit is complete. Generated-fixture size measurement, processor, signature pad, storage, Queue redaction, and workflow integration remain pending.

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

Photos, signatures, visible and printable student detail, history, summaries, printing, student reports, Room Stock view, settings, and final navigation parity remain mandatory.

Artifact:

- `docs/TEACHER_LEGACY_PARITY_CONTRACT.md`

## Sprint 4.7 Objective

Implement one shared, safe Media and Signature workflow for:

- Attendance daily photo evidence;
- Attendance Teacher signature;
- Pending Milk recipient or student signature and photos;
- Retroactive Milk recipient or student signature and photos;
- Vacation Milk parent or recipient signature and photos.

The workflow must preserve legacy-compatible `photos`, `signature`, and `signatures` fields without adding unrestricted login-blocking payloads.

## First Required Gate — Legacy and Payload Audit

Completed:

1. inspected protected `teacher.html` evidence workflows;
2. documented exact field shapes by workflow;
3. identified Firebase paths and record ownership;
4. documented legacy image-count, dimension, quality, and signature-canvas behavior;
5. defined thumbnail, lazy-loading, replacement, cleanup, rollback, backup, restore, and Queue-redaction contracts;
6. proved the policy boundary contains no stock mutation logic.

Still pending:

1. measure generated representative image and signature payload sizes;
2. validate final source-size, compressed-size, signature-size, and aggregate limits;
3. run the pure Media Policy gate locally;
4. implement and validate processor, signature pad, storage, and workflow integration.

Required artifact:

```text
docs/MEDIA_SIGNATURE_LEGACY_AUDIT.md
```

## Planned Shared Boundaries

Target responsibilities:

```text
modules/media/mediaPolicy.js
modules/media/mediaProcessor.js
modules/media/mediaStorage.js
modules/media/mediaManager.js
modules/media/mediaView.js
modules/signature/signaturePad.js
modules/signature/signatureManager.js
modules/signature/signatureView.js
```

Exact names may change after the audit, but policy, processing, storage, manager, and view responsibilities must remain separated.

## Planned Automated Gates

```text
tests/media-policy-check.mjs
tests/media-processor-check.mjs
tests/signature-pad-check.mjs
tests/media-storage-check.mjs
tests/media-signature-integration-check.mjs
```

The first tests must be pure and isolated from Firebase.

## Queue and Payload Rules

- Queue storage key remains `tc_pending_saves_v1`.
- Queue UI must never show full photo or signature payloads.
- Retries must not duplicate evidence.
- Evidence retry must not repeat a successful Room Stock mutation.
- Audit-only recovery remains audit-only.
- Main Stock remains unchanged.
- Teacher Login must not download all historical evidence.
- Evidence loads only for the selected room, date, or record.

## Browser Restriction

Until isolated gates pass:

- do not attach a real classroom photo;
- do not save a real signature;
- do not press Attendance, Pending, Retroactive, or Vacation save/delete for evidence testing;
- do not replay a browser Queue containing evidence;
- do not manually change Firebase evidence records;
- use generated in-memory fixtures only.

## Sprint 4.7 Non-Goals

- Attendance history and summaries;
- A4 report assembly and printing;
- student report;
- remaining Room Stock view;
- Teacher settings;
- final navigation parity;
- Firebase security hardening;
- physical iPad sign-off;
- production cutover;
- incident recovery.

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
- Negative Room Stock is not silently clamped.
- Legacy files remain available until explicit production-cutover approval.

## Sprint Plan

- `docs/SPRINT_4_7_PLAN.md`
