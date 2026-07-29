# Sprint 4.7 — Attendance Media and Signature Integration Gate

Date: 2026-07-29

Branch: `feature/sprint-4.7-media-signature-ui`

Status: **PASS — LOCAL ISOLATED INTEGRATION CONFIRMED**

## Purpose

Integrate daily Attendance photos and one Teacher signature while preserving legacy-compatible online records, reference-only Queue storage, lazy selected-date loading, and stock ownership boundaries.

## Runtime

```text
modules/media/attendanceEvidenceManager.js
modules/media/attendanceEvidenceView.js
modules/media/attendanceEvidenceAdapter.js
modules/core/app.js
```

## Confirmed Local Output

```text
Media policy checks passed.
Attendance Media and Signature integration checks passed.
Attendance UI checks passed.
Sync UI checks passed.
Cutover documentation checks passed.
```

At the reported validation point the feature branch was synchronized with origin and the working tree was clean.

## UI Boundary — PASS

- JPEG, PNG, and WebP selector;
- maximum five-photo feedback;
- compressed local previews;
- exact draft-photo removal;
- bounded Teacher signature canvas;
- explicit use-signature and clear actions;
- selected-date lazy evidence load;
- responsive layout;
- selecting or signing creates a local draft only and does not write Firebase.

## Online Compatibility — PASS

Immediately before `AttendanceManager.save`, local references hydrate into the protected fields:

```js
{
  photos: [dataUrl, ...],
  signature: dataUrl | ""
}
```

No new field is written to:

```text
milkApp/mcAttendance/{roomId}_{YYYY-MM-DD}
```

The evidence layer does not calculate Attendance counts, Room Stock differences, ledgers, stock logs, or Main Stock changes.

## Queue Boundary — PASS

- queued Attendance records contain media references only;
- full payloads remain in IndexedDB;
- Queue JSON excludes Data URLs and original file names;
- replay hydrates payloads only immediately before Attendance Service;
- the internal evidence manifest is removed before Firebase write;
- legacy inline evidence is blocked from Queue with `MEDIA_LEGACY_QUEUE_REQUIRES_ONLINE`;
- evidence retry does not own Room Stock or audit recovery.

## Draft Cleanup — PASS

Unsaved drafts are removed when the selected date changes, Logout occurs, or the workflow is cleared. Saved references remain available for replay. Attendance deletion removes referenced evidence without performing an additional stock mutation.

## Safety Boundary

The isolated gate used generated Data URLs and a simulated signature only. It did not use real classroom photos, real signatures, Firebase writes, real Queue replay, Room Stock mutation, Main Stock mutation, or the quarantined room/date.

## Decision

Attendance media and Teacher signature integration is accepted for Sprint 4.7. The next workflow is Pending Milk recipient signatures and record photos.
