# Sprint 4.7 — Media Evidence Recovery and Duplicate Prevention Gate

Date: 2026-07-29

Branch: `feature/sprint-4.7-media-signature-ui`

Status: IMPLEMENTED / LOCAL ISOLATED VALIDATION PENDING

## Purpose

Validate the shared evidence lifecycle after Attendance, Pending, Retroactive, and Vacation integrations are present.

This gate proves that generated photo and signature payloads are neither lost on harmless repeated UI events nor duplicated or removed more than once during replacement, context change, Logout, or successful-save recovery.

## Runtime Corrections

### Attendance unchanged-date preservation

`AttendanceEvidenceManager.setRecordContext()` now preserves the active draft when the authenticated room and selected date are unchanged and no persisted record replacement was supplied.

This prevents repeated Login, date, or load events from silently clearing:

- generated photo references;
- the active Teacher signature;
- the dirty state;
- the local preview cache.

A real date or room change still removes only unsaved payloads owned by the previous context.

### Pending safe-state receiver redaction

`PendingEvidenceManager.buildSafeSummary()` no longer exposes `receiverName`.

The receiver name remains available only inside the protected legacy write boundary:

```js
signatures[studentId + "_" + absentDate] = {
  sig: dataUrl,
  receiverName: string
};
```

Queue UI, debug state, and safe summaries must not reveal the receiver identity.

## Automated Gate

Added:

```text
tests/media-evidence-recovery-duplicate-check.mjs
```

Coverage:

- Attendance repeated room-and-date context preserves the unsaved photo and signature;
- Attendance signature replacement creates the new payload before removing the prior draft;
- replaced payload removal occurs exactly once;
- date change removes each unsaved Attendance payload exactly once;
- successful-save ownership is not later treated as an unsaved draft;
- Pending safe state excludes Data URLs and receiver identity;
- Pending legacy hydration retains receiver identity only at the write boundary;
- Pending signature replacement removes the previous draft exactly once;
- removing an owner removes only that owner's unsaved signature;
- record-level Pending photos remain until record cleanup;
- Retroactive unchanged context preserves active evidence;
- Vacation unchanged context preserves active evidence;
- Retroactive and Vacation context changes clean each unsaved payload exactly once;
- Pending, Retroactive, and Vacation adapters retain idempotent patch markers.

Expected output:

```text
Media evidence recovery and duplicate prevention checks passed.
```

## Stock and Queue Boundary

This gate does not call repositories, Firebase, network APIs, or browser Queue storage.

It does not calculate or mutate:

- Attendance present count;
- Pending entitlement count;
- Retroactive weekday or debt count;
- Vacation day or student count;
- Room Stock;
- Main Stock;
- ledger;
- stockLog.

Evidence cleanup must never repeat a successful Room Stock deduction or rollback.

## Browser Restriction

Until this gate and the full regression suite pass, do not:

- attach real classroom photos;
- enter real Teacher, parent, student, or recipient signatures;
- press Attendance, Pending, Retroactive, or Vacation save/delete for evidence testing;
- create or replay a browser Queue containing evidence;
- modify Firebase evidence fields manually.

Use generated in-memory fixtures only.

## Next Gate

After this test passes:

1. run the complete expanded regression suite;
2. perform desktop read-only rendering validation;
3. perform 820 x 1180 responsive read-only validation;
4. close Sprint 4.7 only when the branch is synchronized and the working tree is clean.