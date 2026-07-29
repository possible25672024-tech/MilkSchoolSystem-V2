# Sprint 4.7 — Media Processor Isolated Gate

Date: 2026-07-29

Branch: `feature/sprint-4.7-media-signature-ui`

Status: IMPLEMENTED / LOCAL VALIDATION PENDING

## Purpose

Validate deterministic image resize, compression-output boundaries, thumbnail generation, resource cleanup, and safe metadata without Firebase, browser storage, real classroom evidence, stock mutation, or Queue mutation.

## Runtime

```text
modules/media/mediaProcessor.js
```

The processor owns only:

- source validation through `MediaPolicy`;
- orientation-aware browser decode where supported;
- aspect-ratio-preserving target dimensions;
- bounded main image encoding;
- bounded thumbnail generation;
- deterministic path-safe media identifiers;
- processed payload validation;
- decoded-resource cleanup;
- metadata-only safe summaries.

It does not own:

- Firebase reads or writes;
- Local Storage or Session Storage;
- Teacher authentication;
- Attendance, Pending, Retroactive, or Vacation business logic;
- Room Stock or Main Stock;
- Queue persistence or replay;
- ledger or stockLog records.

## Browser Adapter

The default browser adapter prefers:

```text
createImageBitmap(file, { imageOrientation: "from-image" })
```

When unavailable it falls back to an object URL and browser `Image` decode. The adapter releases the decoded bitmap or object URL after processing.

## Main Image Contract

Default output:

- MIME: `image/jpeg`;
- longest edge: at most 1,000 px from `MediaPolicy`;
- JPEG quality: 0.7 from `MediaPolicy`;
- byte limit: at most 400 KB from `MediaPolicy`;
- no upscaling for source images already within bounds.

Examples validated by the isolated gate:

```text
2000 × 1000 → 1000 × 500
600 × 900   → 600 × 900
1200 × 1800 → 667 × 1000
```

## Thumbnail Contract

Default thumbnail:

- longest edge: 320 px;
- JPEG quality: 0.6;
- same aspect ratio as the main image;
- validated by the same processed-photo MIME, dimension, and byte rules.

## Deterministic Identifier

The processor creates an identifier shaped as:

```text
media-<16 lowercase hexadecimal characters>
```

The fingerprint includes safe source metadata, final dimensions, and encoded content. The same input produces the same identifier; changed source metadata or content produces a different identifier.

This identifier is deterministic for retry and replacement planning. It is not an authentication token and must not be treated as a cryptographic integrity proof.

## Safe Summary

Operational summaries contain only:

- ID;
- MIME;
- byte size;
- dimensions;
- thumbnail byte size;
- orientation-adjusted flag.

They exclude:

- full Data URLs;
- image payloads;
- source file names;
- Teacher, student, or recipient identity;
- signature payloads.

## Automated Gate

```text
tests/media-processor-check.mjs
```

Coverage:

- syntax and responsibility boundary;
- no Firebase, network, browser storage, stock, audit, or Queue ownership;
- landscape, portrait, and no-upscale calculations;
- main image and thumbnail generation;
- policy quality and size enforcement;
- deterministic safe IDs;
- metadata-only summaries;
- unsupported MIME rejection before decode;
- more than five images rejected before decode;
- oversized processed output rejection;
- decoded resource cleanup.

Expected output:

```text
Media processor checks passed.
```

## Safety Boundary

The test uses generated in-memory Data URLs and an injected fake image adapter. It:

- does not read a real photo;
- does not create a real signature;
- does not call Firebase;
- does not call `fetch`;
- does not use Local Storage or Session Storage;
- does not write Attendance or milk-distribution records;
- does not mutate Room Stock or Main Stock;
- does not use room `อ.3-3`;
- does not use room ID `mqn0z13eyx5b`;
- does not use date `2026-07-28`;
- does not modify protected `index.html` or `teacher.html`.

## Next Gate

After local policy and processor tests pass:

1. implement isolated pointer/touch/mouse Signature Pad;
2. validate empty, clear, redraw, bounded canvas, deterministic PNG, and safe summary behavior;
3. implement lazy evidence storage and Queue-redaction tests;
4. integrate workflows only after all shared gates pass.
