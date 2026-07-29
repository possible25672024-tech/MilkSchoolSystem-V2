# Sprint 4.7 — Attendance Media and Signature Integration Gate

Date: 2026-07-29

Branch: `feature/sprint-4.7-media-signature-ui`

Status: IMPLEMENTED / LOCAL ISOLATED VALIDATION PENDING

## Purpose

Integrate the first Teacher evidence workflow into modular V2:

- daily Attendance photos;
- one Teacher signature for the selected Attendance date;
- legacy-compatible online Attendance record fields;
- reference-only persistent Queue payloads;
- lazy selected-record evidence loading;
- no stock arithmetic ownership in the evidence layer.

## Added Runtime

```text
modules/media/attendanceEvidenceManager.js
modules/media/attendanceEvidenceView.js
modules/media/attendanceEvidenceAdapter.js
```

App integration:

```text
modules/core/app.js
```

The evidence adapter installs before SyncView starts Queue replay.

## Attendance UI

The Attendance form receives one evidence section containing:

- image selector for JPEG, PNG, and WebP;
- maximum five-photo count;
- compressed draft previews;
- exact photo removal from the draft;
- bounded Teacher signature canvas;
- explicit `ใช้ลายเซ็นนี้` action;
- clear-signature action;
- explicit lazy load of evidence for the selected date;
- Thai status and validation feedback;
- responsive single-column layout below 760 px.

Selecting or signing creates only a local draft. It does not write Firebase.

## Online Save Compatibility

Before `AttendanceManager.save` reaches `AttendanceService`, the adapter hydrates local references into the existing protected record fields:

```js
{
  photos: [dataUrl, ...],
  signature: dataUrl | ""
}
```

No new field is written to the legacy Attendance record.

This preserves compatibility with:

```text
milkApp/mcAttendance/{roomId}_{YYYY-MM-DD}
```

The evidence layer does not calculate present counts, Room Stock differences, ledgers, stock logs, or Main Stock changes.

## Queue Boundary

When an Attendance record is queued:

- `photos` contains media references only;
- `signature` contains one media reference or an empty string;
- an internal metadata-only `evidence` summary may exist in Queue storage;
- Data URLs are excluded;
- original file names are excluded;
- full image and signature payloads remain in IndexedDB;
- replay hydrates payloads only immediately before Attendance Service replay;
- the internal evidence manifest is removed before the Firebase record write.

Existing legacy inline evidence is not silently copied into Queue. It is blocked with:

```text
MEDIA_LEGACY_QUEUE_REQUIRES_ONLINE
```

This prevents sensitive payload leakage until a dedicated legacy-data reprocessing path is accepted.

## Draft Cleanup

Unsaved media drafts are removed when:

- the user changes to another Attendance date;
- Logout occurs;
- the evidence workflow is cleared.

Saved local evidence remains available for Queue replay. Attendance record deletion removes referenced local payloads without performing stock mutation.

## Automated Gate

Added:

```text
tests/attendance-media-signature-integration-check.mjs
```

Coverage:

- runtime syntax and responsibility boundaries;
- photo and signature controls present;
- App loads evidence modules before Queue UI startup;
- two generated photos and one generated signature;
- safe state excludes Data URLs;
- online save hydrates legacy-compatible fields;
- Queue contains references only;
- Queue JSON excludes Data URLs and original file names;
- replay hydrates payloads immediately before Attendance Service;
- internal manifest is removed before record replay;
- legacy inline evidence is blocked from Queue;
- Logout removes unsaved drafts;
- no Firebase, network, browser Local Storage, Room Stock, Main Stock, ledger, or stockLog ownership in Manager/View.

Expected output:

```text
Attendance Media and Signature integration checks passed.
```

## Current Browser Restriction

Do not yet:

- choose a real classroom photo;
- sign with a real Teacher signature;
- press Attendance Save/Delete for evidence testing;
- create or replay a real evidence Queue entry;
- manually change Firebase evidence fields.

Use generated in-memory fixtures only until the isolated gate and full regression suite pass.

## Next Integration Order

After this gate passes:

1. Pending Milk recipient signatures and photos;
2. Retroactive Milk recipient signatures and photos;
3. Vacation Milk parent/recipient signatures and photos;
4. complete evidence recovery, browser, responsive, and full-regression gates.
