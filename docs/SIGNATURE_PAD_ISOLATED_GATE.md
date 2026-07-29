# Sprint 4.7 — Signature Pad Isolated Gate

Date: 2026-07-29

Branch: `feature/sprint-4.7-media-signature-ui`

Status: IMPLEMENTED / LOCAL VALIDATION PENDING

## Purpose

Validate a shared bounded Signature Pad for Teacher V2 without Firebase, browser storage, Queue persistence, real classroom signatures, stock mutation, or protected legacy-file changes.

## Runtime

```text
modules/signature/signaturePad.js
```

The Signature Pad owns only:

- bounded canvas setup;
- Pointer Event input when supported;
- mouse and touch fallbacks;
- coordinate normalization;
- stroke capture and redraw;
- clear and empty-state handling;
- PNG export;
- `MediaPolicy` signature validation;
- deterministic path-safe signature identifiers;
- payload-free safe summaries;
- listener cleanup.

It does not own:

- Firebase reads or writes;
- Local Storage or Session Storage;
- Teacher authentication;
- Attendance, Pending, Retroactive, or Vacation Milk records;
- Room Stock or Main Stock;
- Queue persistence or replay;
- ledger or stockLog entries;
- report or print assembly.

## Canvas Boundary

Default maximum logical dimensions:

```text
640 × 240 px
```

A larger rendered input is reduced to the maximum boundary. Smaller canvases remain at their requested size. Resize redraws retained strokes and does not change business records.

## Input Modes

Preferred mode:

```text
PointerEvent
```

This covers modern mouse, pen, and touch input with pointer capture.

Fallback mode when `PointerEvent` is unavailable:

```text
mousedown / mousemove / mouseup
touchstart / touchmove / touchend
```

Touch handlers are non-passive so drawing can prevent browser scrolling while the user signs.

## Signature Export

Output:

```text
MIME: image/png
Maximum bytes: MediaPolicy.maxSignatureBytes
Default limit: 120 KB
```

Required empty signatures throw:

```text
SIGNATURE_REQUIRED
```

Oversized PNG evidence throws:

```text
SIGNATURE_SIZE_EXCEEDED
```

Optional workflows may explicitly request an empty signature result without creating fake evidence.

## Deterministic Identifier

The identifier shape is:

```text
signature-<16 lowercase hexadecimal characters>
```

The fingerprint includes bounded dimensions, normalized strokes, pressure values, and exported PNG content. The same drawing and PNG output produce the same identifier for retry and replacement planning.

The identifier is not an authentication token and is not a cryptographic proof.

## Safe Summary

Safe summaries include only:

- empty state;
- identifier;
- MIME;
- byte size;
- bounded dimensions;
- stroke count;
- point count.

They exclude:

- PNG Data URL;
- full signature payload;
- Teacher identity;
- student or recipient identity;
- record notes;
- Queue payload content.

## Automated Gate

```text
tests/signature-pad-check.mjs
```

Coverage:

- syntax and responsibility boundary;
- Pointer Event capture and release;
- mouse fallback;
- touch fallback;
- coordinate normalization;
- bounded `640 × 240` canvas;
- clear and redraw;
- required empty rejection;
- optional empty result;
- deterministic PNG identifier;
- `MediaPolicy` byte validation;
- payload-free safe summary;
- oversized signature rejection;
- listener cleanup;
- resize with retained strokes.

Expected output:

```text
Signature Pad checks passed.
```

## Safety Boundary

The test uses a generated in-memory canvas and generated PNG Data URLs. It:

- does not capture a real signature;
- does not read a real photo;
- does not call Firebase;
- does not call `fetch`;
- does not use Local Storage or Session Storage;
- does not create or replay Queue work;
- does not write Attendance or milk-distribution records;
- does not mutate Room Stock or Main Stock;
- does not use room `อ.3-3`;
- does not use room ID `mqn0z13eyx5b`;
- does not use date `2026-07-28`;
- does not modify protected `index.html` or `teacher.html`.

## Next Gate

After policy, processor, and Signature Pad tests pass:

1. implement lazy evidence storage and record ownership;
2. validate replacement, deletion, cleanup, and backup/restore compatibility;
3. implement Queue-safe evidence references and summary redaction;
4. integrate Attendance first only after shared storage gates pass.
