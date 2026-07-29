# Media Storage and Queue Redaction Isolated Gate

Date: 2026-07-29

Branch: `feature/sprint-4.7-media-signature-ui`

Status: IMPLEMENTED / LOCAL VALIDATION PENDING

## Objective

Keep photo and signature payloads outside login-blocking records and Queue UI while preserving stable references for Attendance, Pending Milk, Retroactive Milk, and Vacation Milk workflows.

## Runtime Boundaries

### `modules/media/mediaStore.js`

Provides:

- IndexedDB-backed payload storage;
- delayed database opening;
- payload records keyed by safe media ID;
- separate metadata-only reads;
- explicit payload hydration only when requested;
- record-key and media-kind filtering;
- isolated remove and clear operations;
- photo and signature validation through `MediaPolicy`;
- no Firebase, Room Stock, Main Stock, Queue, report, or print ownership.

Payload records contain the Data URL only inside the isolated IndexedDB store. Metadata references contain:

```text
mediaId
kind
mime
size
width
height
recordKey
ownerKey
createdAt
```

Metadata references do not contain:

```text
dataUrl
payload
fileName
originalName
```

### `modules/media/mediaEnvelope.js`

Provides:

- evidence validation before persistence;
- separate persistence of each photo and signature;
- reference-only evidence manifests;
- selective/lazy hydration by photo, record signature, or per-student signatures;
- Queue-safe evidence summaries;
- recursive removal of Data URLs, payload fields, blobs, and source file names;
- sensitive-payload detection for isolated validation.

## Queue Boundary

Sprint 4.7 does not place binary or Data URL payloads into Queue UI summaries.

The Queue-safe manifest contains only references and counts. Existing `QueueStorage` remains compatible until workflow integration is completed. It does not become the owner of IndexedDB media payloads.

Before a future workflow queues a record containing evidence, it must:

1. validate and process the image/signature;
2. persist payloads through `MediaStore`;
3. attach a reference-only Media Envelope to the operational record;
4. remove raw evidence fields from the Queue value;
5. render only counts and reviewed labels in Queue UI.

## Added Automated Gates

```text
tests/media-store-check.mjs
tests/media-queue-redaction-check.mjs
```

Expected output:

```text
Media store checks passed.
Media Queue redaction checks passed.
```

## Media Store Coverage

- three independent payloads stored separately;
- manifest creation does not reload payloads;
- metadata lists contain no Data URL or payload;
- photo-only hydration reads only the requested photo;
- full hydration restores photo, Teacher signature, and parent signature;
- record-key metadata filtering;
- exact remove and clear behavior;
- invalid media ID and media kind rejection;
- no Firebase or real file access.

## Queue Redaction Coverage

- raw Data URLs are detected as sensitive;
- pre-persistence summaries contain counts only;
- persisted manifests contain safe media IDs only;
- raw payload, Data URL, source file name, and original file name are removed;
- ordinary operational notes remain visible;
- SyncManager and SyncView do not expose media payload properties;
- QueueStorage does not own `MediaStore` or `MediaEnvelope`;
- no Firebase or real classroom Queue writes.

## Security and Privacy Notes

IndexedDB separation reduces login and Queue payload growth but is not a complete production security boundary by itself.

Remaining mandatory work includes:

- workflow-level integration;
- storage quota handling;
- orphan cleanup;
- backup and restore behavior;
- record-delete cleanup policy;
- Firebase compatibility decision for synchronized media;
- App Check and Firebase Rules hardening;
- physical iPad validation.

## Safety Restrictions

Do not:

- select real student photos;
- draw a real Teacher or parent signature;
- press Attendance, Pending, Retroactive, or Vacation save/delete buttons;
- create a real Queue entry;
- modify Firebase media records;
- use room `อ.3-3`, room ID `mqn0z13eyx5b`, or date `2026-07-28`.

The current gate uses generated in-memory Data URLs and an in-memory storage adapter only.
