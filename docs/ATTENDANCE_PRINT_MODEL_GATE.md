# Sprint 4.8 — A4 Attendance Print Model Gate

Date: 2026-07-30

Branch: `feature/sprint-4.8-report-print-ui`

Status: **PASS — LOCAL ISOLATED VALIDATION AND REGRESSION COMPLETE**

## Purpose

Convert the already-built Attendance report model into a deterministic A4 portrait print contract without another history read, historical media hydration, browser storage access, Queue operation, Attendance write, or stock mutation.

## Implemented files

```text
modules/reports/attendancePrintModel.js
tests/attendance-print-model-check.mjs
```

Input path:

```text
AttendanceHistoryService
    -> AttendanceReportBuilder
    -> AttendancePrintModel
    -> later AttendancePrintView
```

The print model does not call the history Service or Repository. It consumes only the in-memory report model produced by Gate B.

## A4 contract

Default output:

```text
format      = A4
orientation = portrait
rows/page   = 24
maximum     = 40 rows/page
```

`AttendancePrintModel.build(report, options)` accepts an optional deterministic timestamp and row limit:

```js
{
  printedAt: "2026-07-29T23:45:00.000Z",
  rowsPerPage: 24,
  title: "รายงานการเช็กดื่มนมรายวัน"
}
```

Invalid timestamps are rejected with:

```text
ATTENDANCE_PRINT_TIMESTAMP_INVALID
```

## Output model

The model returns:

```js
{
  format: "A4",
  orientation: "portrait",
  locale,
  timeZone,
  title,
  printedAt,
  printedAtLabel,
  metadata: {
    schoolName,
    roomId,
    roomName,
    teacher,
    startDate,
    endDate,
    year,
    term,
    rangeLabel,
    academicLabel
  },
  totals,
  columns,
  pages: [
    {
      pageNumber,
      totalPages,
      pageBreakAfter,
      title,
      header,
      columns,
      rows,
      footer
    }
  ],
  source: {
    rowsPerPage,
    pageCount,
    studentCount,
    reportRecordCount,
    evidenceHydrated
  }
}
```

## Deterministic page behavior

The model:

- preserves the student order supplied by the pure Summary Builder;
- assigns one-based `rowNumber` values before pagination;
- chunks rows with a fixed bounded `rowsPerPage`;
- emits one empty page when a report has no student rows;
- repeats the title, school, room, Teacher, selected range, academic metadata, and column contract on every page;
- marks every page except the final page with `pageBreakAfter: true`;
- emits stable `หน้า X / Y` footer labels.

A later browser view will translate `pageBreakAfter` into print-only CSS. This isolated gate does not create DOM nodes or call `window.print()`.

## Printed metadata

The print model includes:

- school name;
- room name and room ID;
- Teacher name;
- selected date or range;
- academic year and semester;
- present, absent, unchecked, checked, student, and school-day totals;
- per-student detail rows;
- deterministic print timestamp formatted in the configured timezone.

ISO dates are displayed as `DD/MM/YYYY`. A single selected date is displayed once; a range uses `start ถึง end`.

## Student table columns

The A4 model exposes this repeated header contract:

```text
ลำดับ
เลขที่
รหัสนักเรียน
ชื่อ-นามสกุล
เพศ
มา
ขาด
ยังไม่ตรวจ
อัตรามาเรียน (%)
หมายเหตุ
```

Only whitelisted report fields enter the print output.

## Payload and ownership boundary

The print model:

- performs no network request;
- accesses no Firebase Service or Repository;
- accesses no Local Storage, Session Storage, or IndexedDB;
- creates, edits, replays, or removes no Queue item;
- calls no browser print API;
- emits no browser event;
- recalculates or repairs no Room Stock or Main Stock;
- includes no photo, signature, receiver identity, source filename, blob, or Data URL;
- does not mutate the supplied report model.

The `evidenceHydrated` flag is metadata only. The print model never hydrates evidence.

## Isolated checks

`tests/attendance-print-model-check.mjs` verifies:

- browser-safe syntax;
- prohibited network, storage, Queue, stock, event, and print ownership is absent;
- A4 portrait metadata;
- deterministic Thai report title and repeated headers;
- deterministic selected-range and academic labels;
- timezone-aware print timestamp formatting;
- bounded rows per page;
- stable page count, row numbering, page-break markers, and page labels;
- empty-report behavior;
- invalid timestamp rejection;
- input immutability;
- identical input and timestamp produce identical output;
- evidence payloads and unknown source properties do not enter the print model;
- Node VM cross-realm output is compared through plain JSON values.

Expected output:

```text
Attendance print model checks passed.
```

## Safety boundary

This gate uses generated in-memory fixtures only. It does not load a real classroom, request Firebase data, write Attendance, change Room Stock or Main Stock, create or replay Queue entries, or modify protected `index.html` and `teacher.html`.

Do not use quarantined room `อ.3-3`, room ID `mqn0z13eyx5b`, or date `2026-07-28` in later browser validation.

## Next gate

```text
Gate D — Teacher History, Summary and A4 Print UI
```

The automated UI portion now passes on `feature/sprint-4.8.1-report-print-ui-integration`. Local desktop and `820 x 1180` browser evidence remains pending.
