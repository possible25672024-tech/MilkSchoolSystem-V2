# Sprint 4.8 — Pure Attendance Summary Builder Gate

Date: 2026-07-30

Branch: `feature/sprint-4.8-report-print-ui`

Status: **PASS — LOCAL ISOLATED VALIDATION AND REGRESSION COMPLETE**

## Purpose

Convert the authenticated-room, evidence-free Attendance history result into deterministic daily, selected-range, and per-student report models without network access, browser storage, Queue ownership, Attendance writes, or stock arithmetic.

## Implemented files

```text
modules/reports/attendanceReportBuilder.js
tests/attendance-report-builder-check.mjs
```

Input boundary:

```text
AttendanceHistoryService normalized result
    + authenticated-room roster and school metadata
    -> AttendanceReportBuilder
    -> pure report model
```

## Accepted local result

The submitted PowerShell sequence completed through the remaining checks, `git status`, and `git log` without entering a failure `throw`.

Accepted result:

```text
Attendance report builder checks passed.
Attendance history query checks passed.
Sprint 4.8 plan checks passed.
Cutover documentation checks passed.
ALL 46 REGRESSION CHECKS PASSED
On branch feature/sprint-4.8-report-print-ui
Your branch is up to date with 'origin/feature/sprint-4.8-report-print-ui'.
nothing to commit, working tree clean
HEAD 729347c
```

The reported regression count may be greater than 46 when additional checks exist.

## Input and roster contract

`AttendanceReportBuilder.build(history, context)` consumes only in-memory normalized history and optional authenticated-room context.

Roster students support:

```text
id / studentId / รหัส / รหัสประจำตัว
num / no / order / เลขที่
name / ชื่อ-นามสกุล / ชื่อ + นามสกุล
gender / sex / เพศ
```

Attendance-only student IDs that are absent from the current roster remain in the report after roster students so historical facts are not silently discarded.

Output sorting is deterministic:

1. current-roster students;
2. numeric student number;
3. textual student number;
4. student name;
5. student ID.

Duplicate roster IDs are represented once.

## Status and total rules

Recognized values:

```text
present
absent
```

Missing or unsupported values are counted as:

```text
unchecked
```

The model reports:

- school days represented by existing Attendance records;
- complete and incomplete days;
- represented students and student rows;
- present, absent, unchecked, and checked totals;
- daily totals;
- per-student totals and note counts;
- attendance rate calculated as `present / checked`;
- school, room, Teacher, date range, year, and semester metadata.

Unchecked rows remain visible and are not converted to absences.

When source records contain multiple academic years or semesters without an explicit override, the metadata value is `mixed` while the source values remain available in sorted arrays.

## Purity and payload boundary

The builder:

- performs no network request;
- reads no Local Storage, Session Storage, or IndexedDB;
- creates or replays no Queue item;
- mutates no history, roster, or context input;
- recalculates or repairs no Room Stock or Main Stock;
- emits no browser event;
- includes no photo or signature Data URL;
- hydrates no historical evidence.

## Accepted isolated checks

The passing gate verifies:

- browser-safe syntax;
- prohibited ownership is absent;
- deterministic date and student ordering;
- duplicate roster handling;
- daily and selected-range totals;
- per-student totals and note counts;
- attendance-rate calculation;
- incomplete-record handling;
- mixed metadata and explicit override behavior;
- empty-history behavior;
- evidence payload exclusion;
- input immutability;
- Node VM cross-realm output normalization.

## Safety boundary

This gate used generated in-memory fixtures only. It did not load a real classroom, request Firebase data, write Attendance, change Room Stock or Main Stock, create or replay Queue entries, or modify protected `index.html` and `teacher.html`.

Do not use quarantined room `อ.3-3`, room ID `mqn0z13eyx5b`, or date `2026-07-28` in later browser validation.

## Next gate

```text
Gate C — A4 Attendance Print Model
```

The print model consumes the already-built report model and must not trigger another history read or automatic evidence download.
