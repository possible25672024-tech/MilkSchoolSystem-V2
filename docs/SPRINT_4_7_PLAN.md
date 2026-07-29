# Sprint 4.7 — Shared Media and Signature Workflow Plan

Date: 2026-07-29

Branch: `feature/sprint-4.7-media-signature-ui`

Status: ACTIVE / POLICY, PROCESSOR, AND SIGNATURE GATES PASSED / LAZY STORAGE AND QUEUE REDACTION PENDING LOCAL VALIDATION

## Objective

Implement one shared, safe Media and Signature workflow for modular Teacher V2 while preserving legacy-compatible fields and preventing login-blocking payload growth, unrestricted base64 accumulation, Queue payload exposure, duplicate evidence uploads, and real-classroom write risk.

## Required Legacy Parity

Sprint 4.7 must support evidence for:

- Attendance daily photo;
- Attendance Teacher signature;
- Pending Milk recipient or student signature and photo evidence;
- Retroactive Milk recipient or student signature and photo evidence;
- Vacation Milk parent or recipient signature and photo evidence.

Protected `teacher.html` remains the source of truth for behavior and field compatibility. Protected `index.html` and `teacher.html` must remain unchanged.

## Implemented Shared Modules

```text
modules/media/mediaPolicy.js
modules/media/mediaProcessor.js
modules/media/mediaStore.js
modules/media/mediaEnvelope.js
modules/signature/signaturePad.js
```

Planned workflow-level modules remain:

```text
modules/media/mediaManager.js
modules/media/mediaView.js
modules/signature/signatureManager.js
modules/signature/signatureView.js
```

Responsibilities remain separated between policy, processing, storage, payload envelopes, capture, management, and views.

## Phase A — Legacy and Payload Audit — PASS

Completed:

1. inspected protected `teacher.html` photo and signature workflows;
2. documented exact legacy field shapes for Attendance, Pending, Retroactive, and Vacation Milk;
3. identified current Firebase paths and record ownership;
4. identified login-blocking and history-loading risks;
5. defined maximum file count, input size, output size, pixel dimensions, and MIME types;
6. defined thumbnail and original-evidence policy;
7. defined cleanup, replacement, delete, backup, restore, and rollback requirements;
8. defined Queue-safe metadata excluding full evidence payloads.

Artifact:

```text
docs/MEDIA_SIGNATURE_LEGACY_AUDIT.md
```

## Phase B — Media Policy and Processing — PASS

Implemented and locally accepted:

```text
tests/media-policy-check.mjs
tests/media-processor-check.mjs
```

Confirmed:

- supported MIME types;
- source and processed byte limits;
- maximum five photos per record;
- maximum 1,000-pixel longest edge;
- JPEG quality 0.7;
- thumbnail generation;
- deterministic safe media identifiers;
- generated-fixture processing only;
- no Firebase write.

## Phase C — Signature Capture — PASS

Implemented and locally accepted:

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
- PNG validation through Media Policy;
- safe summary without PNG Data URL;
- event-listener cleanup;
- generated in-memory signature fixture only.

## Phase D — Lazy Storage and Queue Redaction — IMPLEMENTED / LOCAL VALIDATION PENDING

Added:

```text
modules/media/mediaStore.js
modules/media/mediaEnvelope.js
tests/media-store-check.mjs
tests/media-queue-redaction-check.mjs
docs/MEDIA_STORAGE_QUEUE_REDACTION_GATE.md
```

The storage boundary provides:

- delayed IndexedDB opening;
- payload storage by safe media ID;
- metadata-only reads;
- selective photo/signature hydration;
- record-key and media-kind filtering;
- exact remove and clear operations;
- no Firebase, stock, Queue, report, or print ownership.

The envelope boundary provides:

- validation before persistence;
- separate persistence for every photo and signature;
- reference-only manifests;
- Queue-safe evidence counts and references;
- recursive Data URL, payload, blob, and file-name redaction;
- sensitive-payload detection.

Expected local output:

```text
Media store checks passed.
Media Queue redaction checks passed.
```

## Phase E — Workflow Integration Order

Integrate only after lazy storage and Queue-redaction tests pass:

1. Attendance daily photo and Teacher signature;
2. Pending Milk evidence;
3. Retroactive Milk evidence;
4. Vacation Milk evidence.

Each integration requires separate UI, isolated write, recovery, browser read-only, and responsive gates.

## Queue Boundary

Queue behavior must:

- keep key `tc_pending_saves_v1`;
- preserve operation type and record reference;
- avoid exposing base64, full photos, full signatures, or original file names;
- persist media payloads before queuing reference-only records;
- avoid duplicating evidence during retry;
- distinguish record mutation from evidence upload state;
- preserve audit-only retry rules;
- never repeat a successful Room Stock mutation;
- never change Main Stock.

Existing `QueueStorage` remains compatible during the isolated storage gate and does not own IndexedDB media payloads.

## Current Automated Gates

```text
tests/media-policy-check.mjs
tests/media-processor-check.mjs
tests/signature-pad-check.mjs
tests/media-store-check.mjs
tests/media-queue-redaction-check.mjs
tests/teacher-session-roster-fallback-check.mjs
```

All gates use generated in-memory fixtures and remain isolated from Firebase.

## Browser Safety

Until workflow integration and isolated write gates pass:

- do not attach a real classroom photo;
- do not save a real signature;
- do not press Attendance, Pending, Retroactive, or Vacation save/delete actions for evidence testing;
- do not replay a browser Queue containing evidence;
- do not change Firebase records manually;
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

## Production Blockers Still Open

- deferred real-classroom incident;
- public Firebase root `.read` and `.write` rules;
- physical iPad validation;
- report and print parity;
- remaining Teacher navigation parity;
- explicit `main` and production approval.

## Completion Decision

Sprint 4.7 may be accepted only after:

- legacy and payload audit complete;
- shared policy and processing tests pass;
- signature touch/mouse tests pass;
- storage compatibility, lazy-loading, and Queue-redaction tests pass;
- all four Teacher workflows preserve existing stock rules;
- complete regression gate passes;
- desktop and 820 x 1180 responsive browser gates pass;
- branch synchronized with origin;
- working tree clean.

Completion may authorize only fast-forward integration into `develop`.
