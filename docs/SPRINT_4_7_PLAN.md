# Sprint 4.7 — Shared Media and Signature Workflow Plan

Date: 2026-07-29

Branch: `feature/sprint-4.7-media-signature-ui`

Status: ACTIVE / LEGACY AUDIT AND STORAGE BOUNDARY FIRST

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

## Planned Shared Modules

Target module boundary:

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

Exact file names may be adjusted after the legacy and Firebase payload audit, but responsibilities must remain separated.

## Phase A — Legacy and Payload Audit

Before implementation:

1. inspect protected `teacher.html` photo and signature workflows;
2. document exact legacy field shapes for Attendance, Pending, Retroactive, and Vacation Milk;
3. identify current Firebase paths and record ownership;
4. measure representative photo and signature payload sizes;
5. identify login-blocking and history-loading risks;
6. define maximum file count, input size, output size, pixel dimensions, and MIME types;
7. define thumbnail and original-evidence policy;
8. define cleanup, replacement, delete, backup, restore, and rollback behavior;
9. define Queue-safe metadata that excludes full evidence payloads from operational Queue summaries.

Required artifact:

```text
docs/MEDIA_SIGNATURE_LEGACY_AUDIT.md
```

## Phase B — Media Policy and Processing

The shared policy must enforce:

- accepted image MIME types;
- maximum source file size;
- maximum image count by workflow;
- orientation correction where browser APIs allow;
- maximum pixel dimensions;
- client-side compression;
- thumbnail generation;
- deterministic safe file identifiers;
- no executable or unsupported file content;
- no silent unlimited base64 storage;
- clear validation messages in Thai;
- testable pure processing functions.

No Firebase write is allowed in the first processing gate.

## Phase C — Signature Capture

The signature workflow must support:

- pointer, touch, and mouse input;
- clear and redraw;
- empty-signature rejection where required;
- bounded canvas dimensions;
- deterministic PNG or approved compact output;
- Teacher signature for Attendance;
- per-recipient signature mapping where required;
- responsive 820 x 1180 interaction;
- no signature payload in Queue operational summaries.

## Phase D — Storage and Record Compatibility

The storage layer must:

- preserve legacy `photos`, `signature`, and `signatures` fields;
- load evidence lazily by selected room/date/record;
- avoid loading all historical evidence at Teacher Login;
- separate evidence metadata from preview thumbnails when appropriate;
- support replacement and deletion without orphan accumulation;
- keep record and evidence ownership explicit;
- preserve backup and restore compatibility;
- avoid Main Stock mutation;
- avoid changing Attendance, Pending, Retroactive, or Vacation quantity calculations.

Any Firebase schema extension requires a written compatibility decision before implementation.

## Phase E — Workflow Integration Order

Integrate only after shared policy, processor, storage, and isolated tests pass:

1. Attendance daily photo and Teacher signature;
2. Pending Milk evidence;
3. Retroactive Milk evidence;
4. Vacation Milk evidence.

Each integration requires separate UI, isolated write, recovery, browser read-only, and responsive gates.

## Queue Boundary

Queue behavior must:

- keep key `tc_pending_saves_v1`;
- preserve operation type and record reference;
- avoid exposing base64, full photos, or full signatures in SyncView;
- avoid duplicating evidence during retry;
- distinguish record mutation from evidence upload state;
- preserve audit-only retry rules;
- never repeat a successful Room Stock mutation;
- never change Main Stock.

## Initial Automated Gates

Planned tests:

```text
tests/media-policy-check.mjs
tests/media-processor-check.mjs
tests/signature-pad-check.mjs
tests/media-storage-check.mjs
tests/media-signature-integration-check.mjs
```

The first gate must remain pure and isolated from Firebase.

## Browser Safety

Until isolated gates pass:

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
- storage compatibility and lazy-loading tests pass;
- all four Teacher workflows preserve existing stock rules;
- complete regression gate passes;
- desktop and 820 x 1180 responsive browser gates pass;
- branch synchronized with origin;
- working tree clean.

Completion may authorize only fast-forward integration into `develop`.
