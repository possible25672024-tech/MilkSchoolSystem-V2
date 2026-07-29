# Sprint 4.7 — Retroactive Milk Media and Signature Integration Gate

Date: 2026-07-29

Branch: `feature/sprint-4.7-media-signature-ui`

Status: IMPLEMENTED / LOCAL ISOLATED VALIDATION PENDING

## Purpose

Integrate shared Media and Signature handling into the modular Retroactive Milk workflow while preserving the protected record contract and stock boundaries.

## Added Runtime

```text
modules/media/retroactiveEvidenceManager.js
modules/media/retroactiveEvidenceAdapter.js
modules/media/retroactiveEvidenceView.js
```

App integration:

```text
modules/core/app.js
modules/retroactive/retroactiveMilkManager.js
```

The Retroactive manager publishes `milkapp:retro-preview-changed` so evidence ownership follows the authenticated room, academic year, semester, and exact retroactive date range.

## UI Capability

The Retroactive Milk form receives an evidence section containing:

- JPEG, PNG, and WebP photo selection;
- maximum five-photo feedback;
- compressed draft previews;
- exact draft-photo removal;
- authenticated-room student selector;
- receiver or parent name input;
- one signature per student ID;
- explicit use-signature and clear actions;
- selected-range lazy evidence loading;
- responsive single-column layout below 760 px.

Selecting a photo or signing creates only a local IndexedDB draft. It does not write Firebase.

## Legacy Record Compatibility

Immediately before Retroactive Milk issue, references are hydrated into:

```js
{
  signature: "",
  signatures: {
    [studentId]: {
      sig: dataUrl | "",
      receiverName: string
    }
  },
  photos: [dataUrl, ...]
}
```

The record remains compatible with:

```text
milkApp/retroMilk/{pushId}
```

No new evidence field is written to Firebase.

## Stock and Queue Boundary

The evidence layer does not calculate or mutate:

- student count;
- weekday count;
- total boxes;
- debt boxes;
- Room Stock;
- Main Stock;
- ledger;
- stockLog.

If the record is saved but Room Stock requires retry, the existing `roomStockAdjust` Queue entry remains stock-only. It must not contain photos, signatures, receiver names, Data URLs, or source file names.

Evidence retry must never repeat a successful Room Stock mutation. Main Stock remains unchanged.

## Draft Cleanup

Unsaved evidence payloads are removed when:

- the retroactive date range or academic context changes;
- the preview becomes invalid;
- Logout occurs;
- the workflow is cleared.

A successful issue marks evidence as saved and prevents draft cleanup from deleting payloads still needed by the saved record.

## Automated Gate

Added:

```text
tests/retroactive-media-signature-integration-check.mjs
```

Coverage:

- runtime syntax and responsibility boundaries;
- photo and signature controls;
- preview event integration;
- two generated photos and two generated signatures;
- safe state excludes Data URLs, original file names, and receiver identities;
- protected `photos`, `signature`, and `signatures` hydration;
- stock-only partial-failure Queue payload;
- draft cleanup on clear;
- no Firebase, network, browser storage, Room Stock, Main Stock, ledger, or stockLog ownership in Manager/View.

Expected output:

```text
Retroactive Milk Media and Signature integration checks passed.
```

## Current Browser Restriction

Do not yet:

- choose a real classroom photo;
- save a real parent, student, or recipient signature;
- press Retroactive Milk issue or delete for evidence testing;
- create or replay a real evidence Queue entry;
- manually modify Firebase evidence fields.

Use generated in-memory fixtures until this gate and the regression suite pass.

## Next Integration

After this gate passes, integrate Vacation Milk parent or recipient signatures and photos, then run evidence recovery, duplicate-prevention, full regression, desktop, and 820 x 1180 responsive gates.