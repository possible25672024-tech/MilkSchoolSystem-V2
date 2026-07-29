# Sprint 4.7 — Vacation Milk Media and Signature Integration Gate

Date: 2026-07-29

Branch: `feature/sprint-4.7-media-signature-ui`

Status: PASS — LOCAL ISOLATED VALIDATION CONFIRMED

## Purpose

Integrate shared Media and Signature handling into the modular Vacation Milk workflow while preserving the protected record contract, authenticated-room ownership, and Room Stock-only arithmetic.

## Added Runtime

```text
modules/media/vacationEvidenceManager.js
modules/media/vacationEvidenceAdapter.js
modules/media/vacationEvidenceView.js
```

App integration:

```text
modules/core/app.js
modules/vacation/vacationMilkManager.js
```

The Vacation manager publishes `milkapp:vacation-preview-changed`. Evidence ownership follows the authenticated room, academic year, semester, exact issue date, and day count.

## UI Capability

The Vacation Milk form receives an evidence section containing:

- JPEG, PNG, and WebP photo selection;
- maximum five-photo feedback;
- compressed draft previews;
- exact draft-photo removal;
- authenticated-room student selector;
- parent or recipient name input;
- one signature per student ID;
- explicit use-signature and clear actions;
- selected-record lazy evidence loading;
- responsive single-column layout below 760 px.

Selecting a photo or signing creates only a local IndexedDB draft. It does not write Firebase.

## Legacy Record Compatibility

Immediately before Vacation Milk issue, references are hydrated into:

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
milkApp/vacationMilk/{pushId}
```

No new evidence field is written to Firebase.

## Context and Draft Rules

An unchanged Vacation record context preserves the active draft:

```text
roomId + academicYear + semester + issueDate + days
```

Changing any record-identity field removes only unsaved local evidence belonging to the old context. A successful issue marks evidence as saved.

After Teacher Login, the adapter republishes the active preview in a microtask so the Evidence View receives the authenticated roster even when Login event handlers initialize concurrently.

## Stock and Queue Boundary

The evidence layer does not calculate or mutate:

- student count;
- day count;
- total boxes;
- Room Stock;
- Main Stock;
- ledger;
- stockLog.

If the record is saved but Room Stock requires retry, the existing `roomStockAdjust` Queue entry remains stock-only. It must not contain photos, signatures, receiver names, Data URLs, or source file names.

Evidence retry must never repeat a successful Room Stock mutation. Main Stock remains unchanged.

## Automated Gate

Added:

```text
tests/vacation-media-signature-integration-check.mjs
tests/vacation-evidence-login-replay-check.mjs
```

Coverage:

- runtime syntax and responsibility boundaries;
- photo and signature controls;
- preview-event integration and initial-preview republish;
- two generated photos and two generated signatures;
- unchanged-context draft preservation;
- safe state excludes Data URLs, original file names, and receiver identities;
- protected `photos`, `signature`, and `signatures` hydration;
- stock-only partial-failure Queue payload;
- draft cleanup on clear;
- no Firebase, network, browser storage, Room Stock, Main Stock, ledger, or stockLog ownership in Manager/View.

Confirmed local output:

```text
Vacation Milk Media and Signature integration checks passed.
Vacation evidence login replay checks passed.
Vacation Milk UI checks passed.
Vacation Milk isolated write checks passed.
nothing to commit, working tree clean
```

## Current Browser Restriction

Do not yet:

- choose a real classroom photo;
- save a real parent, student, or recipient signature;
- press Vacation Milk issue or delete for evidence testing;
- create or replay a real evidence Queue entry;
- manually modify Firebase evidence fields.

Use generated in-memory fixtures until the recovery gate and full regression suite pass.

## Next Gate

1. run evidence recovery and duplicate-prevention checks;
2. run the complete expanded regression suite;
3. validate desktop read-only rendering;
4. validate 820 x 1180 responsive read-only rendering;
5. close Sprint 4.7 only with a synchronized branch and clean working tree.