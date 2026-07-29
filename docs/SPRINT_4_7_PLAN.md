# Sprint 4.7 — Shared Media and Signature Workflow Plan

Date: 2026-07-29

Branch: `feature/sprint-4.7-media-signature-ui`

Status: ACTIVE / SHARED POLICY, PROCESSOR, SIGNATURE, STORAGE, AND QUEUE REDACTION GATES PASSED / ATTENDANCE INTEGRATION PENDING LOCAL VALIDATION

## Objective

Implement one shared, safe Media and Signature workflow for modular Teacher V2 while preserving legacy-compatible fields and preventing login-blocking payload growth, unrestricted base64 accumulation, Queue payload exposure, duplicate evidence uploads, and real-classroom write risk.

## Required Legacy Parity

Sprint 4.7 must support evidence for:

- Attendance daily photo;
- Attendance Teacher signature;
- Pending Milk recipient or student signature and photo evidence;
- Retroactive Milk recipient or student signature and photo evidence;
- Vacation Milk parent or recipient signature and photo evidence.

Protected `teacher.html` remains the source of truth. Protected `index.html` and `teacher.html` remain unchanged.

## Implemented Shared Modules

```text
modules/media/mediaPolicy.js
modules/media/mediaProcessor.js
modules/media/mediaStore.js
modules/media/mediaEnvelope.js
modules/signature/signaturePad.js
```

Confirmed locally:

```text
Media policy checks passed.
Media processor checks passed.
Signature Pad checks passed.
Media store checks passed.
Media Queue redaction checks passed.
Teacher session roster fallback checks passed.
```

The branch was synchronized with origin and the working tree was clean at the reported validation point.

## Phase A — Legacy and Payload Audit — PASS

Artifact:

```text
docs/MEDIA_SIGNATURE_LEGACY_AUDIT.md
```

Confirmed:

- exact legacy field shapes for Attendance, Pending, Retroactive, and Vacation Milk;
- authenticated-room and selected-record ownership;
- five-photo legacy limit;
- 1,000-pixel and JPEG 0.7 compatibility;
- Attendance record-level Teacher signature;
- per-recipient signatures for milk-distribution workflows;
- selected-record lazy-loading requirement;
- cleanup, backup, restore, rollback, and Queue-redaction contracts.

## Phase B — Media Policy and Processing — PASS

Confirmed:

- JPEG, PNG, and WebP source allowlist;
- 8 MB source limit;
- 400 KB processed-photo limit;
- 120 KB signature limit;
- 2.25 MB aggregate record limit;
- maximum five photos;
- 1,000-pixel longest edge;
- JPEG quality 0.7;
- 320-pixel thumbnail generation;
- orientation-aware decode where available;
- deterministic safe media IDs;
- generated in-memory fixtures only;
- no Firebase write.

## Phase C — Signature Capture — PASS

Confirmed:

- Pointer Events;
- Mouse and Touch fallback;
- clear and redraw;
- empty-signature rejection;
- bounded 640 x 240 canvas;
- PNG validation through Media Policy;
- safe summary without PNG Data URL;
- listener cleanup;
- generated signature fixtures only.

Artifact:

```text
docs/SIGNATURE_PAD_ISOLATED_GATE.md
```

## Phase D — Lazy Storage and Queue Redaction — PASS

Implemented:

```text
modules/media/mediaStore.js
modules/media/mediaEnvelope.js
tests/media-store-check.mjs
tests/media-queue-redaction-check.mjs
```

Confirmed:

- delayed IndexedDB opening;
- payload storage by safe media ID;
- metadata-only list/read operations;
- selective hydration;
- exact remove and clear;
- reference-only manifests;
- Data URL, payload, blob, and file-name redaction;
- safe Queue counts and references;
- no Firebase, stock, report, or print ownership.

Artifact:

```text
docs/MEDIA_STORAGE_QUEUE_REDACTION_GATE.md
```

## Phase E1 — Attendance Photo and Teacher Signature — IMPLEMENTED / LOCAL VALIDATION PENDING

Added:

```text
modules/media/attendanceEvidenceManager.js
modules/media/attendanceEvidenceView.js
modules/media/attendanceEvidenceAdapter.js
tests/attendance-media-signature-integration-check.mjs
docs/ATTENDANCE_MEDIA_SIGNATURE_INTEGRATION_GATE.md
```

The Attendance evidence section provides:

- JPEG/PNG/WebP multiple-photo selection;
- maximum five-photo feedback;
- compressed draft previews;
- exact draft photo removal;
- Teacher signature canvas;
- explicit signature confirmation and clear action;
- selected-date lazy evidence load;
- responsive layout;
- generated-draft status that clearly states no Firebase write has occurred.

Online save compatibility:

```text
local references → hydrate at Attendance save boundary → legacy photos/signature fields
```

Queue compatibility:

```text
inline payload → prohibited
reference-only record → QueueStorage
reference-only record → hydrate immediately before replay
```

Legacy inline evidence is blocked from Queue with:

```text
MEDIA_LEGACY_QUEUE_REQUIRES_ONLINE
```

This is intentional protection against payload leakage.

Expected local output:

```text
Attendance Media and Signature integration checks passed.
```

## Remaining Workflow Integration Order

After Attendance integration passes:

1. Pending Milk recipient signatures and photos;
2. Retroactive Milk recipient signatures and photos;
3. Vacation Milk parent/recipient signatures and photos.

Each workflow requires isolated UI, save/delete, Queue/recovery, browser, and responsive gates.

## Queue Boundary

- Queue key remains `tc_pending_saves_v1`.
- Queue UI never displays full photo or signature payloads.
- New Attendance evidence is persisted before a reference-only Queue record is created.
- Replay hydrates evidence only immediately before Attendance Service replay.
- Internal evidence metadata is removed before the legacy Firebase record write.
- Retries must not duplicate evidence.
- Evidence retry must not repeat a successful Room Stock mutation.
- Audit-only recovery remains audit-only.
- Main Stock remains unchanged.

## Browser Safety

Until all workflow isolated gates pass:

- do not attach a real classroom photo;
- do not save a real Teacher or recipient signature;
- do not press Attendance, Pending, Retroactive, or Vacation save/delete for evidence testing;
- do not replay a browser Queue containing evidence;
- do not change Firebase evidence fields manually;
- use generated in-memory fixtures only.

## Non-Goals

Sprint 4.7 does not complete:

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

## Completion Decision

Sprint 4.7 may be accepted only after:

- all shared gates pass;
- Attendance, Pending, Retroactive, and Vacation evidence integrations pass;
- complete regression gate passes;
- desktop and 820 x 1180 responsive browser gates pass;
- branch synchronized with origin;
- working tree clean.

Completion may authorize only fast-forward integration into `develop`.
