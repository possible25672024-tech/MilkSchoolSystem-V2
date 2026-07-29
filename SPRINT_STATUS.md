# MilkSchoolSystem-V2

# Sprint Status

Last Update: 2026-07-29

Current Branch: `feature/sprint-4.7-media-signature-ui`

Current Version: V2

## Current Sprint

Sprint 4.7 — Shared Media and Signature Workflow

Status: **93% — ALL FOUR EVIDENCE WORKFLOW GATES PASSED / RECOVERY AND DUPLICATE PREVENTION IMPLEMENTED / LOCAL ISOLATED VALIDATION PENDING**

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

## Sprint 4.7 Accepted Local Gates

Confirmed locally:

```text
Media policy checks passed.
Media processor checks passed.
Signature Pad checks passed.
Media store checks passed.
Media Queue redaction checks passed.
Teacher session roster fallback checks passed.
Attendance Media and Signature integration checks passed.
Pending Milk Media and Signature integration checks passed.
Retroactive Milk Media and Signature integration checks passed.
Vacation Milk Media and Signature integration checks passed.
Vacation evidence login replay checks passed.
Attendance UI checks passed.
Pending Milk UI checks passed.
Pending Milk isolated write checks passed.
Retroactive Milk UI checks passed.
Retroactive Milk isolated write checks passed.
Vacation Milk UI checks passed.
Vacation Milk isolated write checks passed.
Sync UI checks passed.
Cutover documentation checks passed.
nothing to commit, working tree clean
```

## Shared Media Policy and Processor — PASS

Implemented:

```text
modules/media/mediaPolicy.js
modules/media/mediaProcessor.js
modules/media/mediaStore.js
modules/media/mediaEnvelope.js
modules/signature/signaturePad.js
```

Confirmed:

- maximum five photos per record;
- JPEG, PNG, and WebP source support;
- 8 MB source limit;
- longest edge 1,000 px;
- JPEG quality 0.7;
- 400 KB processed-photo limit;
- 120 KB signature limit;
- 2.25 MB aggregate evidence limit;
- generated 320-pixel thumbnails;
- Pointer, Touch, and Mouse signature input;
- empty-signature rejection;
- lazy IndexedDB payload storage;
- reference-only manifests;
- Data URL, blob, payload, and source-file-name redaction;
- Queue key remains `tc_pending_saves_v1`;
- no Firebase or stock ownership.

## Attendance Daily Photo and Teacher Signature — PASS

```text
modules/media/attendanceEvidenceManager.js
modules/media/attendanceEvidenceView.js
modules/media/attendanceEvidenceAdapter.js
tests/attendance-media-signature-integration-check.mjs
docs/ATTENDANCE_MEDIA_SIGNATURE_INTEGRATION_GATE.md
```

Confirmed:

- selected-date photo and Teacher-signature draft;
- local draft does not write Firebase;
- online save hydrates protected `photos` and `signature` fields;
- Queue keeps references only;
- replay hydrates immediately before Attendance Service;
- legacy inline evidence is blocked from Queue;
- deletion cleanup does not own stock mutation;
- Main Stock remains unchanged.

## Pending Milk Photos and Recipient Signatures — PASS

```text
modules/media/pendingEvidenceManager.js
modules/media/pendingEvidenceAdapter.js
modules/media/pendingEvidenceView.js
tests/pending-media-signature-integration-check.mjs
docs/PENDING_MEDIA_SIGNATURE_INTEGRATION_GATE.md
```

Confirmed:

- weekly photo draft and previews;
- one signature for each exact `studentId_absentDate` entitlement;
- receiver-name compatibility at the protected write boundary;
- safe state and Queue exclude receiver identity;
- protected `photos`, `signature`, and `signatures` fields;
- partial-stock Queue entries remain stock-only;
- Queue excludes evidence payloads and source file names;
- Main Stock remains unchanged.

## Retroactive Milk Photos and Recipient Signatures — PASS

```text
modules/media/retroactiveEvidenceManager.js
modules/media/retroactiveEvidenceAdapter.js
modules/media/retroactiveEvidenceView.js
tests/retroactive-media-signature-integration-check.mjs
docs/RETROACTIVE_MEDIA_SIGNATURE_INTEGRATION_GATE.md
```

Confirmed:

- selected-range photo draft and lazy previews;
- authenticated-room student selector;
- one signature per student ID;
- receiver-name compatibility;
- unchanged range preserves the active draft;
- protected `photos`, `signature`, and `signatures` fields;
- partial-stock Queue remains stock-only;
- Queue excludes evidence payloads and receiver identity;
- Main Stock remains unchanged.

## Vacation Milk Photos and Parent/Recipient Signatures — PASS

```text
modules/media/vacationEvidenceManager.js
modules/media/vacationEvidenceAdapter.js
modules/media/vacationEvidenceView.js
tests/vacation-media-signature-integration-check.mjs
tests/vacation-evidence-login-replay-check.mjs
docs/VACATION_MEDIA_SIGNATURE_INTEGRATION_GATE.md
```

Confirmed:

- selected-record photo draft and lazy previews;
- authenticated-room student selector;
- one signature per student ID;
- parent or recipient name compatibility;
- unchanged record identity preserves the active draft;
- Login replay republishes the active preview after Evidence View activation;
- protected `photos`, `signature`, and `signatures` fields;
- partial-stock Queue remains stock-only;
- Queue excludes evidence payloads and receiver identity;
- Main Stock remains unchanged.

## Evidence Recovery and Duplicate Prevention — IMPLEMENTED / LOCAL TEST PENDING

Added:

```text
tests/media-evidence-recovery-duplicate-check.mjs
docs/MEDIA_EVIDENCE_RECOVERY_DUPLICATE_GATE.md
```

Runtime corrections:

- Attendance keeps the active draft when the room and selected date are unchanged;
- a real room or date change removes only unsaved Attendance payloads;
- Pending safe state no longer exposes `receiverName`;
- receiver identity remains available only at the protected legacy write boundary.

Gate coverage:

- repeated context events do not silently clear valid drafts;
- signature replacement removes the previous draft exactly once;
- context changes remove each unsaved payload exactly once;
- removing a Pending owner removes only that owner's draft signature;
- successful-save ownership is not treated as an unsaved draft;
- Retroactive and Vacation unchanged contexts preserve evidence;
- adapter patch markers remain idempotent;
- no stock, Firebase, network, or real Queue ownership.

Expected local output:

```text
Media evidence recovery and duplicate prevention checks passed.
```

## Teacher Legacy Parity Contract — BINDING

V2 must retain:

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

## Remaining Sprint 4.7 Work

1. pass the Media evidence recovery and duplicate-prevention isolated test;
2. run the complete expanded regression suite;
3. validate desktop read-only rendering;
4. validate 820 x 1180 responsive read-only rendering;
5. synchronize the branch and confirm a clean working tree.

## Queue and Payload Rules

- Queue UI must never show photo or signature payloads.
- Media payloads must be persisted before references are used.
- Retries must not duplicate evidence.
- Evidence retry must not repeat a successful Room Stock mutation.
- Audit-only recovery remains audit-only.
- Main Stock remains unchanged.
- Teacher Login must not download historical evidence.
- Evidence loads only for the selected room, date, week, range, or record.

## Browser Restriction

Until the recovery gate and full regression suite pass:

- do not attach a real classroom photo;
- do not save a real Teacher, parent, student, or recipient signature;
- do not press Attendance, Pending, Retroactive, or Vacation issue/delete for evidence testing;
- do not create or replay a browser Queue containing evidence;
- do not manually change Firebase evidence fields.

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
- Media recovery, full regression, and browser validation gates;
- report and print parity;
- remaining Teacher navigation parity;
- explicit `main` and production approval.

## Protected Business Rules

- Main Stock decreases only on classroom distribution.
- Attendance, Pending, Retroactive, and Vacation Milk change Room Stock only.
- Delete restores exactly the quantity previously deducted.
- Teacher access remains limited to the authenticated room.
- Audit-only recovery never repeats a successful stock mutation.
- Negative Room Stock is not silently clamped.
- Legacy files remain available until explicit production-cutover approval.