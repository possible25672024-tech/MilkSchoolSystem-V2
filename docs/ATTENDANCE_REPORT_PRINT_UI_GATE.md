# Sprint 4.8 — Attendance History, Summary and A4 Print UI Gate

Date: 2026-07-30

Branch: `feature/sprint-4.8.1-report-print-ui-integration`

Status: **AUTOMATED PASS / LOCAL BROWSER GATE PENDING**

## Purpose

Connect the accepted authenticated-room Attendance history query, pure summary builder, and deterministic A4 print model to the modular V2 Teacher shell without adding Firebase writes, stock ownership, Queue work, or automatic historical media downloads.

## Implemented files

```text
modules/reports/attendancePrintView.js
modules/core/app.js
tests/attendance-report-print-ui-check.mjs
tests/run-sprint-4.8-regression.mjs
```

## Runtime path

```text
Teacher session
    -> AttendancePrintView
    -> AttendanceHistoryManager
    -> AttendanceHistoryService
    -> scoped AttendanceRepository child reads
    -> AttendanceReportBuilder
    -> AttendancePrintModel
    -> A4 print window
```

`MilkSchoolApplication` dynamically loads and initializes this path after the existing Teacher and Attendance Views.

## Teacher UI

The operational V2 Teacher shell now provides:

- explicit start and end dates;
- load-on-demand history;
- authenticated school, room, and Teacher identity;
- daily present, absent, unchecked, and student totals;
- per-student present, absent, unchecked, and attendance-rate totals;
- loading, empty, success, and error states;
- an A4 print action enabled only after a report is built;
- responsive table containers and controls for narrow layouts.

The UI uses the already-loaded report model for printing. Print preview does not perform another Attendance read.

## Read-only boundary

`AttendancePrintView` contains no:

- Firebase Service or Repository access;
- `fetch` or `XMLHttpRequest`;
- Local Storage, Session Storage, or IndexedDB access;
- Attendance save, edit, or delete command;
- Room Stock or Main Stock calculation;
- Queue creation or replay;
- ledger or stockLog repair;
- photo, signature, blob, or Data URL rendering.

The view emits only metadata-safe events:

```text
milkapp:attendance-report-built
milkapp:attendance-print-opened
```

Neither event contains student rows or historical evidence payloads.

## Automated result

Isolated UI result:

```text
Attendance report and A4 print UI checks passed.
```

Complete regression result:

```text
Discovered 48 regression checks.
ALL 48 REGRESSION CHECKS PASSED (2.8s)
```

The isolated UI test verifies:

- Teacher-only activation and Logout cleanup;
- explicit date-range delegation to `AttendanceHistoryManager`;
- report construction from the authenticated-room snapshot;
- visible daily and per-student details;
- already-built report reuse for printing;
- deterministic A4 document rendering;
- metadata-only events;
- no media payload exposure;
- no direct network, storage, stock, Queue, or audit ownership;
- App dynamic-load and initialization wiring.

## Protected-file verification

```text
index.html   unchanged
teacher.html unchanged
```

No real Firebase data, quarantined room/date, operational Queue, Room Stock, or Main Stock was used by the automated gate.

## Browser gate

The Work Mode cloud browser could not open the workspace-local URL:

```text
http://127.0.0.1:8000/index-v2.html
net::ERR_BLOCKED_BY_CLIENT
```

This is recorded as **PENDING**, not PASS. It does not indicate an application Console or Network failure because the page was not reached.

Required local acceptance remains:

- desktop Teacher login and report load;
- Chrome `820 x 1180`;
- clean Console;
- report traffic limited to GET/OPTIONS;
- Queue remains empty;
- A4 preview and print layout;
- no real operational write;
- protected files unchanged.

## Decision

The Sprint 4.8 runtime and automated code gate are ready for Draft PR review into `develop`.

Sprint 4.8 is not yet eligible for production cutover, `main`, or replacement of `teacher.html`. Local browser evidence, the deferred real-data incident, Firebase security hardening, backup/restore rehearsal, and physical iPad decision remain open.
