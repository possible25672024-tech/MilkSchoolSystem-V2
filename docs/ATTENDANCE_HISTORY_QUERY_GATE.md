# Sprint 4.8 — Attendance History Query Gate

Date: 2026-07-30

Branch: `feature/sprint-4.8-report-print-ui`

Status: **IMPLEMENTED / LOCAL ISOLATED VALIDATION PENDING**

## Purpose

Provide the first Sprint 4.8 read-only boundary for Teacher Attendance history without granting the report layer ownership of Attendance writes, Room Stock, Main Stock, Queue, ledger, stockLog, or historical evidence payloads.

## Implemented files

```text
modules/repositories/attendanceRepository.js
modules/reports/attendanceHistoryService.js
modules/reports/attendanceHistoryManager.js
tests/attendance-history-query-check.mjs
```

## Authenticated-room ownership

`AttendanceHistoryService.loadRange(session, input)` delegates room authorization to `TeacherService.assertRoomAccess()` before any repository read.

Accepted inputs:

```js
"2026-07-01"
```

or:

```js
{
  startDate: "2026-07-01",
  endDate: "2026-07-31"
}
```

An optional `roomId` must equal the room in the active Teacher session. Admin sessions, missing room IDs, and cross-room requests remain rejected by the existing Teacher Service boundary.

## Date-range contract

The service:

- requires real calendar dates in `YYYY-MM-DD` format;
- normalizes one selected date to an inclusive one-day range;
- rejects a reversed range;
- limits one request to 93 inclusive days;
- enumerates only the selected dates;
- sorts returned records deterministically by date.

The 93-day limit is a request-safety boundary, not a retention limit. Another explicit request can load a different period.

## Media-free repository read

Legacy Attendance records store `photos` and `signature` inside:

```text
milkApp/mcAttendance/{roomId}_{YYYY-MM-DD}
```

Loading the complete record would therefore download historical evidence even when the report does not need it.

`AttendanceRepository.loadAttendanceHistoryRecord(roomId, date)` avoids that behavior. It first reads only:

```text
/data
```

A missing `data` child ends the request for that date. For an existing Attendance day, it reads only these additional report fields:

```text
/notes
/year
/term
/roomName
/teacher
/savedAt
```

It never requests:

```text
/photos
/signature
/signatures
```

This is intentionally a bounded series of child GET requests. It preserves the Sprint 4.8 Lazy Historical Media contract without adding a Firebase schema migration or a write-side report index.

## Normalized output

The service returns:

```js
{
  roomId,
  roomName,
  teacher,
  startDate,
  endDate,
  requestedDays,
  recordCount,
  records: [
    {
      key,
      clsId,
      roomName,
      date,
      year,
      term,
      teacher,
      data,
      notes,
      savedAt,
      evidence: {
        loaded: false,
        photoCount: null,
        hasSignature: null
      }
    }
  ]
}
```

The result omits `photos`, `signature`, Data URLs, blobs, source filenames, recipient identity, stock arithmetic, and Queue state.

`photoCount` and `hasSignature` remain `null`, rather than falsely reporting that no evidence exists. Evidence availability and payload loading remain a separate explicit on-demand boundary.

## Manager events

The manager emits:

```text
milkapp:attendance-history-loading
milkapp:attendance-history-loaded
milkapp:attendance-history-empty
milkapp:attendance-history-error
```

Loading and error events contain room/range metadata only. Loaded records use the evidence-free normalized result. `getSnapshot()` returns defensive copies so a report view cannot mutate Manager state.

## Isolated checks

`tests/attendance-history-query-check.mjs` verifies:

- syntax of Service and Manager files;
- no Firebase write, fetch write, browser storage, stock, ledger, or Queue ownership;
- one-room and selected-date-only repository calls;
- single-date and explicit-range normalization;
- deterministic ordering;
- invalid date, reversed range, oversized range, and cross-room rejection;
- source records remain unchanged;
- Data URLs, `photos`, and `signature` do not enter results or events;
- loading, loaded, and empty event behavior;
- defensive Manager snapshots;
- the production repository never requests `/photos` or `/signature`;
- a missing Attendance day stops after one `/data` GET.

Expected output:

```text
Attendance history query checks passed.
```

## Safety boundary

This gate does not:

- load real classroom history in the browser;
- write Attendance;
- change Room Stock or Main Stock;
- create or replay Queue entries;
- read historical photos or signatures;
- change Firebase rules or schema;
- modify protected `index.html` or `teacher.html`;
- authorize merge to `main` or production cutover.

Do not use quarantined room `อ.3-3`, room ID `mqn0z13eyx5b`, or date `2026-07-28` in later browser validation.

## Next gate

After local validation passes:

```text
Gate B — Pure Attendance Summary Builder
```

The Summary Builder will consume only the normalized evidence-free history result and must remain pure and stock-independent.