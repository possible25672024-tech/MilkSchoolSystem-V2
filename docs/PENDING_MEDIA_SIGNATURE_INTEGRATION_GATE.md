# Sprint 4.7 — Pending Milk Media and Signature Integration Gate

Date: 2026-07-29

Branch: `feature/sprint-4.7-media-signature-ui`

Status: **IMPLEMENTED / LOCAL ISOLATED VALIDATION PENDING**

## Purpose

Integrate record photos and one recipient signature per selected student-and-absence-date entitlement into Pending Milk while preserving the protected Firebase shape, Room Stock-only behavior, safe partial-stock Queue entries, and lazy local payload storage.

## Added Runtime

```text
modules/media/pendingEvidenceManager.js
modules/media/pendingEvidenceAdapter.js
modules/media/pendingEvidenceView.js
modules/core/app.js
```

## Legacy Ownership

Pending Milk keeps:

```text
milkApp/absentMilk/{pushId}
```

Evidence fields remain:

```js
{
  signature: "",
  signatures: {
    [studentId + "_" + absentDate]: {
      sig: dataUrl | "",
      receiverName: string
    }
  },
  photos: [dataUrl, ...]
}
```

One signature belongs to one selected student-and-date entitlement. Photos belong to the whole weekly distribution record.

## UI Boundary

The Pending Milk panel receives:

- JPEG, PNG, and WebP photo selector;
- maximum five-photo counter;
- local compressed previews;
- exact draft photo removal;
- selected entitlement selector;
- receiver-name input;
- bounded signature canvas;
- use-signature and clear-signature actions;
- signature count for selected entitlements;
- explicit statement that draft actions have not written Firebase;
- responsive two-column to one-column layout.

## Save Boundary

The adapter hydrates local references immediately before `PendingMilkManager.issue`, then patches the Service record boundary so the existing protected fields receive Data URLs and receiver names.

The evidence layer does not alter:

- selected-pair eligibility;
- `totalBoxes`;
- Room Stock arithmetic;
- ledger or stockLog creation;
- Main Stock.

## Queue Boundary

Pending Milk currently saves the record before Room Stock adjustment. If the stock mutation requires retry, the existing typed `PENDING` Queue entry contains only stock metadata and the saved record ID.

The Queue entry must not contain:

- photo Data URLs;
- signature Data URLs;
- receiver names;
- original file names;
- IndexedDB payloads.

The evidence record is already stored through the protected Repository before the stock-only retry is queued.

## Automated Gate

Added:

```text
tests/pending-media-signature-integration-check.mjs
```

Coverage:

- runtime syntax and responsibility boundaries;
- photo, receiver, signature, and lazy-load controls;
- App module loading;
- two generated photos;
- two generated recipient signatures;
- exact owner keys `studentId_absentDate`;
- receiver-name preservation;
- legacy-compatible protected record fields;
- safe state excludes Data URLs and original file names;
- typed stock Queue entry excludes evidence and receiver identity;
- successful or partial-stock save accepts the local draft;
- Logout/context cleanup removes unsaved local payloads;
- no Firebase, network, browser Local Storage, Room Stock, Main Stock, ledger, or stockLog ownership in Manager/View.

Expected output:

```text
Pending Milk Media and Signature integration checks passed.
```

## Current Restriction

Do not select a real classroom photo, collect a real recipient signature, press Pending Milk issue/delete for evidence testing, or create/replay real Queue work until this isolated gate and the later regression/browser gates pass.

## Next Sequence

After this gate passes:

1. Retroactive Milk recipient signatures and photos;
2. Vacation Milk parent/recipient signatures and photos;
3. complete evidence recovery and duplicate-prevention gates;
4. full regression;
5. desktop and 820 x 1180 read-only browser validation.
