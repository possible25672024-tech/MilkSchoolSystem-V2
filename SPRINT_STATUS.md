# MilkSchoolSystem-V2

# Sprint Status

Last Update: 2026-07-29

Current Branch: `feature/sprint-4.7-media-signature-ui`

Current Version: V2

## Current Sprint

Sprint 4.7 — Shared Media and Signature Workflow

Status: **55% — POLICY, PROCESSOR, SIGNATURE, AND ROSTER GATES PASSED / LAZY STORAGE AND QUEUE REDACTION IMPLEMENTED / LOCAL VALIDATION PENDING**

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

## Sprint 4.7 Accepted Local Gates

Confirmed locally:

```text
Media policy checks passed.
Media processor checks passed.
Signature Pad checks passed.
Teacher session roster fallback checks passed.
Vacation Milk UI checks passed.
nothing to commit, working tree clean
```

Teacher-session roster race condition acceptance:

- authenticated room roster visible with 16 students;
- Vacation preview calculated 16 × 30 = 480 boxes;
- live Room Stock 1,040 visible;
- no real evidence write performed.

## Sprint 4.7 Implemented Shared Boundaries

### Legacy and Policy

```text
docs/MEDIA_SIGNATURE_LEGACY_AUDIT.md
modules/media/mediaPolicy.js
tests/media-policy-check.mjs
```

Policy limits:

- maximum five photos per record;
- maximum 1,000-pixel longest edge;
- JPEG quality 0.7;
- maximum source size 8 MB;
- maximum processed photo size 400 KB;
- maximum signature size 120 KB;
- maximum aggregate evidence size 2.25 MB;
- JPEG, PNG, and WebP source support;
- PNG signature output.

### Processor

```text
modules/media/mediaProcessor.js
tests/media-processor-check.mjs
docs/MEDIA_PROCESSOR_ISOLATED_GATE.md
```

Confirmed:

- proportional resize;
- no enlargement of smaller images;
- generated thumbnail;
- safe media ID;
- resource cleanup;
- safe summary without Data URL or original file name;
- generated in-memory fixture only.

### Signature Pad

```text
modules/signature/signaturePad.js
tests/signature-pad-check.mjs
docs/SIGNATURE_PAD_ISOLATED_GATE.md
```

Confirmed:

- Pointer Events;
- Mouse and Touch fallback;
- clear and redraw;
- empty-signature rejection;
- bounded 640 x 240 canvas;
- PNG validation;
- safe summary without PNG payload;
- event-listener cleanup.

### Lazy Media Storage and Queue Redaction — IMPLEMENTED / LOCAL VALIDATION PENDING

```text
modules/media/mediaStore.js
modules/media/mediaEnvelope.js
tests/media-store-check.mjs
tests/media-queue-redaction-check.mjs
docs/MEDIA_STORAGE_QUEUE_REDACTION_GATE.md
```

Storage boundary:

- delayed IndexedDB opening;
- payload records stored separately by safe media ID;
- metadata-only listing;
- selective photo/signature hydration;
- record-key and media-kind filtering;
- exact remove and clear operations;
- no Firebase, stock, Queue, report, or print ownership.

Envelope boundary:

- evidence validation before persistence;
- separate persistence for every photo and signature;
- reference-only manifests;
- Queue-safe counts and media references;
- Data URL, payload, blob, and source-file-name redaction;
- sensitive-payload detection.

Expected local output:

```text
Media store checks passed.
Media Queue redaction checks passed.
```

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

The workflow must preserve legacy-compatible `photos`, `signature`, and `signatures` behavior without adding unrestricted login-blocking payloads.

## Next Integration Sequence

After Lazy Storage and Queue-redaction gates pass:

1. Attendance daily photo and Teacher signature;
2. Pending Milk evidence;
3. Retroactive Milk evidence;
4. Vacation Milk evidence.

Each workflow requires its own UI, isolated write, recovery, browser read-only, and responsive gates.

## Queue and Payload Rules

- Queue storage key remains `tc_pending_saves_v1`.
- Queue UI must never show full photo or signature payloads.
- Media payloads must be persisted before a reference-only record is queued.
- Retries must not duplicate evidence.
- Evidence retry must not repeat a successful Room Stock mutation.
- Audit-only recovery remains audit-only.
- Main Stock remains unchanged.
- Teacher Login must not download all historical evidence.
- Evidence loads only for the selected room, date, or record.
- Existing `QueueStorage` does not own IndexedDB media payloads.

## Browser Restriction

Until workflow integration and isolated write gates pass:

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
- Media and Signature workflow integration;
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
