# MilkSchoolSystem-V2

# Sprint Status

Last Update: 2026-07-29

Current Branch: `feature/sprint-4.7-media-signature-ui`

Current Version: V2

## Current Sprint

Sprint 4.7 — Shared Media and Signature Workflow

Status: **100% IMPLEMENTED AND BROWSER-ACCEPTED / FINAL CLOSING REGRESSION AND DEVELOP FAST-FORWARD PENDING**

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

## Sprint 4.7 Delivered Scope — PASS

Implemented:

```text
modules/media/mediaPolicy.js
modules/media/mediaProcessor.js
modules/media/mediaStore.js
modules/media/mediaEnvelope.js
modules/signature/signaturePad.js
modules/media/attendanceEvidenceManager.js
modules/media/attendanceEvidenceView.js
modules/media/attendanceEvidenceAdapter.js
modules/media/pendingEvidenceManager.js
modules/media/pendingEvidenceView.js
modules/media/pendingEvidenceAdapter.js
modules/media/retroactiveEvidenceManager.js
modules/media/retroactiveEvidenceView.js
modules/media/retroactiveEvidenceAdapter.js
modules/media/vacationEvidenceManager.js
modules/media/vacationEvidenceView.js
modules/media/vacationEvidenceAdapter.js
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
- 320-pixel thumbnails;
- Pointer, Touch, and Mouse signature input;
- empty-signature rejection;
- lazy IndexedDB payload storage;
- reference-only manifests;
- Data URL, blob, payload, source-file-name, and receiver-identity redaction from safe Queue state;
- Queue key remains `tc_pending_saves_v1`;
- no Media layer ownership of Firebase stock arithmetic.

## Workflow Integration — PASS

### Attendance

- daily photos and Teacher signature;
- unchanged room/date preserves the active draft;
- online save hydrates legacy `photos` and `signature` fields;
- Queue keeps references only and hydrates before Attendance Service;
- Main Stock remains unchanged.

### Pending Milk

- weekly photos and exact `studentId_absentDate` recipient signatures;
- receiver-name compatibility at the protected write boundary;
- safe state and Queue exclude receiver identity and payloads;
- stock-retry Queue remains stock-only;
- Main Stock remains unchanged.

### Retroactive Milk

- selected-range photos and one signature per student ID;
- unchanged range preserves the active draft;
- legacy `photos`, `signature`, and `signatures` compatibility;
- stock-retry Queue remains stock-only;
- Main Stock remains unchanged.

### Vacation Milk

- selected-record photos and one parent/recipient signature per student ID;
- Login replay republishes the preview after Evidence View activation;
- `milkapp:teacher-refreshed` redraws the Vacation preview from the live Teacher snapshot;
- another-room and non-Teacher refreshes are ignored;
- public adapter status contract remains stable;
- Main Stock remains unchanged.

## Accepted Automated Gates

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
Vacation live Teacher stock refresh checks passed.
Media evidence recovery and duplicate prevention checks passed.
Attendance UI checks passed.
Pending Milk UI checks passed.
Pending Milk isolated write checks passed.
Retroactive Milk UI checks passed.
Retroactive Milk isolated write checks passed.
Vacation Milk UI checks passed.
Vacation Milk isolated write checks passed.
Sync UI checks passed.
Cutover documentation checks passed.
ALL 43 REGRESSION CHECKS PASSED (6.2s)
```

The automatic runner discovers every `tests/*-check.mjs` file and rejects any failure.

## Browser Read-Only Validation — PASS

Artifact:

```text
docs/SPRINT_4_7_BROWSER_VALIDATION_REPORT.md
```

Accepted:

- Admin responsive shell;
- Teacher dashboard and authenticated-room ownership;
- Attendance evidence controls with `0 / 5 รูป`;
- Pending evidence controls with the earlier local draft removed and `0 / 5 รูป`;
- Retroactive evidence controls with `0 / 5 รูป`;
- Vacation evidence controls with `0 / 5 รูป`;
- desktop and Chrome `820 x 1180` layouts;
- clean Console;
- visible Network methods were GET-only;
- no visible POST, PUT, PATCH, or DELETE;
- Queue was `null` before login and after Logout;
- no real evidence, Firebase write, stock mutation, or Queue replay.

Live stock consistency accepted:

```text
Teacher dashboard Room Stock = 476
Vacation Milk Room Stock     = 476
Vacation preview             = 16 students x 30 days = 480 boxes
```

The Vacation warning state is expected because the preview requires four more boxes than the live Room Stock.

## Evidence Recovery and Duplicate Prevention — PASS

Confirmed:

- repeated context events do not silently clear valid drafts;
- signature replacement removes the previous draft once;
- context changes remove each unsaved payload once;
- removing a Pending owner removes only that owner's signature draft;
- successful saves are not treated as unsaved drafts;
- safe state excludes payloads and receiver identity;
- adapter patch markers and replay listeners remain idempotent;
- no stock, Firebase, network, or real Queue ownership.

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

```text
docs/TEACHER_LEGACY_PARITY_CONTRACT.md
```

## Final Sprint 4.7 Closure Steps

1. pull the closing documentation commits;
2. run `node tests/run-sprint-4.7-regression.mjs` again;
3. confirm the feature branch matches Origin and the working tree is clean;
4. fast-forward `develop` to the accepted Sprint 4.7 head;
5. create the next feature branch from the integrated `develop` head.

No merge to `main` is authorized.

## Queue and Payload Rules

- Queue UI must never show photo or signature payloads.
- Media payloads must be persisted before references are used.
- Retries must not duplicate evidence.
- Evidence retry must not repeat a successful Room Stock mutation.
- Audit-only recovery remains audit-only.
- Main Stock remains unchanged.
- Teacher Login must not download historical evidence.
- Evidence loads only for the selected room, date, week, range, or record.

## Safety Boundary

Do not use:

- room `อ.3-3`;
- room ID `mqn0z13eyx5b`;
- date `2026-07-28`;
- a real-classroom write;
- direct Firebase Console mutation of operational records;
- manual Queue, Room Stock, Main Stock, ledger, stockLog, or transaction-history repair.

## Production Blockers — OPEN

- deferred real-classroom incident;
- public Firebase root `.read` and `.write` rules;
- physical iPad validation;
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
