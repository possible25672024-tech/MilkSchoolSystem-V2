# MilkSchoolSystem-V2

# Sprint Status

Last Update: 2026-07-29

Current Branch: `feature/sprint-4.7-media-signature-ui`

Current Version: V2

## Current Sprint

Sprint 4.7 — Shared Media and Signature Workflow

Status: **65% — SHARED MEDIA GATES PASSED / ATTENDANCE PHOTO AND TEACHER SIGNATURE INTEGRATION IMPLEMENTED / LOCAL ISOLATED VALIDATION PENDING**

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
- desktop and 820 x 1180 responsive layouts passed;
- working tree clean and branch synchronized with origin.

## Sprint 4.7 Accepted Local Gates

Confirmed locally:

```text
Media policy checks passed.
Media processor checks passed.
Signature Pad checks passed.
Media store checks passed.
Media Queue redaction checks passed.
Teacher session roster fallback checks passed.
nothing to commit, working tree clean
```

Teacher-session roster race condition acceptance:

- authenticated room roster visible with 16 students;
- Vacation preview calculated 16 × 30 = 480 boxes;
- live Room Stock visible;
- no real evidence write performed.

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

## Shared Media Policy and Processor — PASS

Implemented:

```text
docs/MEDIA_SIGNATURE_LEGACY_AUDIT.md
modules/media/mediaPolicy.js
modules/media/mediaProcessor.js
tests/media-policy-check.mjs
tests/media-processor-check.mjs
```

Confirmed boundaries:

- maximum five photos;
- JPEG, PNG, and WebP source allowlist;
- 8 MB source limit;
- longest edge 1,000 px;
- JPEG quality 0.7;
- 400 KB processed-photo limit;
- 320-pixel thumbnail;
- orientation-aware decode;
- deterministic media IDs;
- generated fixtures only;
- no Firebase or stock ownership.

## Signature Pad — PASS

Implemented:

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
- safe summary without PNG Data URL;
- listener cleanup.

## Lazy Media Storage and Queue Redaction — PASS

Implemented:

```text
modules/media/mediaStore.js
modules/media/mediaEnvelope.js
tests/media-store-check.mjs
tests/media-queue-redaction-check.mjs
docs/MEDIA_STORAGE_QUEUE_REDACTION_GATE.md
```

Confirmed:

- IndexedDB opens only when evidence is used;
- payloads are stored by safe media ID;
- metadata lists do not load Data URLs;
- selected-record evidence hydrates lazily;
- Queue manifests contain references and counts only;
- Data URLs, blobs, payload fields, and original file names are excluded;
- Queue key remains `tc_pending_saves_v1`;
- Main Stock remains unchanged.

## Attendance Photo and Teacher Signature — IMPLEMENTED / LOCAL TEST PENDING

Added:

```text
modules/media/attendanceEvidenceManager.js
modules/media/attendanceEvidenceView.js
modules/media/attendanceEvidenceAdapter.js
tests/attendance-media-signature-integration-check.mjs
docs/ATTENDANCE_MEDIA_SIGNATURE_INTEGRATION_GATE.md
```

UI capability:

- JPEG/PNG/WebP daily photo selector;
- maximum five-photo feedback;
- compressed draft previews;
- exact draft photo removal;
- Teacher signature canvas;
- explicit use-signature and clear actions;
- selected-date lazy evidence load;
- responsive layout;
- status explicitly states that selecting/signing has not written Firebase.

Online save boundary:

```text
IndexedDB references → hydrate immediately before AttendanceManager.save → legacy photos/signature fields
```

Queue boundary:

```text
reference-only Attendance record → QueueStorage → hydrate immediately before replay
```

Queue records exclude Data URLs and original file names. Internal evidence metadata is removed before the legacy Firebase record write.

Legacy inline evidence is blocked from Queue with:

```text
MEDIA_LEGACY_QUEUE_REQUIRES_ONLINE
```

Expected isolated output:

```text
Attendance Media and Signature integration checks passed.
```

## Remaining Sprint 4.7 Work

1. pass Attendance evidence isolated integration test;
2. integrate Pending Milk recipient signatures and photos;
3. integrate Retroactive Milk recipient signatures and photos;
4. integrate Vacation Milk parent or recipient signatures and photos;
5. validate evidence recovery and duplicate prevention;
6. run complete regression suite;
7. desktop and 820 x 1180 browser gates;
8. branch synchronized and working tree clean.

## Queue and Payload Rules

- Queue storage key remains `tc_pending_saves_v1`.
- Queue UI must never show full photo or signature payloads.
- New Attendance evidence is persisted before a reference-only Queue record is created.
- Replay hydrates evidence only immediately before Attendance Service replay.
- Retries must not duplicate evidence.
- Evidence retry must not repeat a successful Room Stock mutation.
- Audit-only recovery remains audit-only.
- Main Stock remains unchanged.
- Teacher Login must not download all historical evidence.
- Evidence loads only for the selected room, date, or record.

## Browser Restriction

Until all workflow isolated gates pass:

- do not attach a real classroom photo;
- do not save a real Teacher or recipient signature;
- do not press Attendance, Pending, Retroactive, or Vacation save/delete for evidence testing;
- do not replay a browser Queue containing evidence;
- do not manually change Firebase evidence fields;
- use generated in-memory fixtures only.

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
- remaining Media and Signature integrations;
- report and print parity;
- remaining Teacher navigation parity;
- explicit `main` and production approval.

## Protected Business Rules

- Main Stock decreases only on classroom distribution.
- Attendance, Pending, Retroactive, and Vacation Milk change Room Stock only.
- Delete restores exactly the quantity previously deducted.
- Evidence save/delete never performs an additional stock mutation.
- Teacher access remains limited to the authenticated room.
- ETag conflicts read the latest Room Stock and recalculate before retry.
- Audit-only recovery never repeats a successful Room Stock mutation.
- Negative Room Stock is not silently clamped.
- Legacy files remain available until explicit production-cutover approval.

## Sprint Plan

- `docs/SPRINT_4_7_PLAN.md`
