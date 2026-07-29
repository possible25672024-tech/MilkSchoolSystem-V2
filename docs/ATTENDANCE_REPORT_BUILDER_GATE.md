# Sprint 4.8 — Pure Attendance Summary Builder Gate

Date: 2026-07-30

Branch: `feature/sprint-4.8-report-print-ui`

Status: **IMPLEMENTED / LOCAL ISOLATED VALIDATION PENDING**

## Purpose

Convert the authenticated-room, evidence-free Attendance history result into deterministic daily, range, and per-student report models without giving the report layer ownership of network access, browser storage, Queue state, Attendance writes, or stock arithmetic.

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

## Input contract

`AttendanceReportBuilder.build(history, context)` accepts:

```js
{
  roomId,
  roomName,
  teacher,
  startDate,
  endDate,
  requestedDays,
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
      evidence
    }
  ]
}
```

Optional context may contain:

```js
{
  schoolName,
  year,
  term,
  students,
  room,
  settings
}
```

The preferred roster source is the authenticated Teacher snapshot. Attendance-only student IDs that are absent from the current roster are retained after roster students so historical facts are not silently discarded.

## Student normalization and ordering

Roster students support the existing normalized and legacy-compatible fields:

```text
id / studentId / รหัส / รหัสประจำตัว
num / no / order / เลขที่
name / ชื่อ-นามสกุล / ชื่อ + นามสกุล
gender / sex / เพศ
```

Output sorting is deterministic:

1. current-roster students before Attendance-only IDs;
2. numeric student number;
3. textual student number;
4. student name;
5. student ID.

Duplicate roster IDs are represented once.

## Status rules

Recognized Attendance values:

```text
present
absent
```

A missing or unsupported value is counted as:

```text
unchecked
```

This preserves incomplete-record visibility instead of silently converting unknown values to present or absent.

## Output model

The builder returns:

```js
{
  metadata: {
    schoolName,
    roomId,
    roomName,
    teacher,
    startDate,
    endDate,
    year,
    term,
    yearValues,
    termValues
  },
  totals: {
    requestedDays,
    schoolDays,
    completeDays,
    incompleteDays,
    students,
    studentRows,
    present,
    absent,
    unchecked,
    checked,
    attendanceRate
  },
  daily: [
    {
      key,
      date,
      year,
      term,
      present,
      absent,
      unchecked,
      checked,
      totalStudents,
      complete,
      attendanceRate,
      savedAt,
      evidence
    }
  ],
  students: [
    {
      id,
      num,
      name,
      gender,
      roster,
      present,
      absent,
      unchecked,
      checked,
      totalDays,
      notesCount,
      attendanceRate
    }
  ],
  source: {
    requestedDays,
    recordCount,
    evidenceHydrated
  }
}
```

`schoolDays` counts existing Attendance records in the selected range. `studentRows` is `schoolDays × represented students`. `attendanceRate` uses `present / checked`; unchecked rows are reported separately rather than treated as absences.

When records contain more than one academic year or semester and no explicit context override exists, the corresponding metadata value is `mixed`, while `yearValues` and `termValues` preserve the actual sorted values.

## Purity and payload boundary

The builder:

- performs no network request;
- reads no browser storage;
- creates or replays no Queue item;
- mutates no Attendance source record;
- recalculates or repairs no stock value;
- emits no browser event;
- includes no photo or signature Data URL;
- derives only report facts from supplied in-memory values.

Historical evidence metadata may remain `loaded: false` with unknown count flags. The builder does not hydrate evidence.

## Isolated checks

`tests/attendance-report-builder-check.mjs` verifies:

- browser-safe syntax;
- prohibited ownership is absent;
- deterministic date ordering;
- deterministic roster and Attendance-only student ordering;
- duplicate roster handling;
- daily present, absent, unchecked, and checked totals;
- selected-range totals;
- per-student totals and note counts;
- attendance rate calculation;
- incomplete-day handling;
- mixed academic year and semester metadata;
- explicit metadata override;
- empty-history behavior;
- no evidence payload exposure;
- history and context inputs remain unchanged;
- Node VM cross-realm output is compared through plain JSON values.

Expected output:

```text
Attendance report builder checks passed.
```

## Safety boundary

This gate uses generated in-memory fixtures only. It does not load a real classroom, request Firebase data, write Attendance, change Room Stock or Main Stock, create or replay Queue entries, or modify protected `index.html` and `teacher.html`.

Do not use quarantined room `อ.3-3`, room ID `mqn0z13eyx5b`, or date `2026-07-28` in later browser validation.

## Next gate

After local validation passes:

```text
Gate C — A4 Print Model
```

The print model must consume this already-built report model and must not trigger another history read or automatic evidence download.
