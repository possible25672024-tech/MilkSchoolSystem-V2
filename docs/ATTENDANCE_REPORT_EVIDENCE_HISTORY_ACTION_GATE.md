# Sprint 4.9 — Attendance Report Evidence and History Action Gate

Date: 2026-07-30

Branch: `feature/sprint-4.9-teacher-parity-cutover`

Status: **AUTOMATED GATE PASS / LOCAL BROWSER VALIDATION PENDING**

## Purpose

Bring the modular V2 Attendance reports and History actions to Teacher parity while preserving the accepted room, stock, Queue, and Lazy Historical Media boundaries.

## Implemented behavior

### Explicit report evidence

Normal history/report loading remains media-free. It reads Attendance facts and metadata without requesting `photos` or `signature`.

Only an explicit Print command calls:

```text
AttendancePrintView / TeacherParityView
    -> AttendanceHistoryManager.hydrateCurrentEvidence()
    -> AttendanceHistoryService.loadEvidence()
    -> AttendanceRepository.loadAttendanceRecord()
```

The evidence request is limited to:

- the authenticated Teacher room;
- dates already present in the selected report;
- at most five image Data URLs per Attendance record;
- one homeroom Teacher signature per record.

Room A4 uses the accepted reference-style matrix: every date in the selected range is a column in one landscape table, statuses render as ✓ / ✕ / —, and each student row includes a drinking total and percentage. Room A4 evidence starts on the following page and is grouped at up to five dates per evidence page. Each date has one photo row with at most five images, its signature image, and the homeroom Teacher name. Student A4 retains its selected-student inline evidence layout.

No photo/signature payload is placed in browser events.

### Pending, Retroactive and Vacation report parity

Every saved history record in:

- นมค้างรายสัปดาห์;
- จ่ายนมย้อนหลัง;
- จ่ายนมช่วงปิดเทอม;

now exposes `พิมพ์รายงาน A4`.

All three delegate to the shared read-only `MilkOperationPrintView`. The renderer creates:

- the same school, room, Teacher, period, total, and A4 structure;
- an operation-specific student and quantity table;
- photos directly after the table in one row, limited to five images;
- available receiver signatures;
- a homeroom Teacher approval line.

The print renderer receives only the already-loaded authenticated-room record and current room roster. It performs no Firebase read or write and owns no stock, Queue, ledger, or stockLog logic.

### History Edit

Every daily History row includes `แก้ไข`.

The action emits only:

```js
{
  roomId,
  date
}
```

`TeacherParityView` opens the Daily Attendance panel and `AttendanceView` loads that exact date through `AttendanceManager.loadDay(date)`. The existing Daily Attendance and Evidence Views then show statuses, notes, photos, and signature for editing.

### History Delete

Every daily History row includes `ลบ`.

Delete:

1. requires explicit confirmation;
2. delegates to `AttendanceManager.remove({ roomId, date })`;
3. reuses `AttendanceService.deleteAttendance()`;
4. refreshes the loaded History after the delete event.

The report View owns no Room Stock arithmetic. The existing Attendance Service restores the deleted record's previous `present` count and retains its ETag retry, audit retry, and persistent Queue recovery behavior.

Deleting a History date that is not currently open in Daily Attendance does not clear another date's local evidence context.

## Safety boundaries

- Main Stock is never changed.
- Attendance edit changes Room Stock by present-count difference only.
- Attendance delete restores the previous present count.
- Queue key remains `tc_pending_saves_v1`.
- Events remain metadata-only.
- No automatic evidence hydration occurs at login or report load.
- `index.html` and `teacher.html` remain unchanged.
- Firebase schema and security rules remain unchanged.
- No `main` merge or production deployment is authorized.

Do not validate operational writes against room `อ.3-3`, room ID `mqn0z13eyx5b`, or date `2026-07-28`.

## Automated coverage

Updated isolated checks verify:

- media-free History remains the default;
- explicit hydration reads only dates already loaded in the report;
- evidence results are defensive copies;
- evidence events contain no Data URLs;
- room A4 includes daily photos and Teacher signature;
- room A4 keeps all selected date columns in one landscape matrix with status marks, totals, and percentages;
- Student A4 includes daily photos and Teacher signature;
- Room A4 starts evidence on the following page and groups six evidence dates into pages of five plus one;
- Student A4 does not contain forced per-date evidence-page breaks;
- every evidence gallery uses one five-photo row;
- Pending, Retroactive, and Vacation history expose A4 print actions;
- the shared operational renderer builds all three report types and emits metadata-only print events;
- History renders Edit/Delete controls;
- Edit routes the exact selected date to Daily Attendance;
- Delete delegates room/date to the existing Attendance Manager;
- deleting a different date does not clean the active evidence context;
- legacy visible attendance labels remain `ดื่มนม` and `ไม่ดื่มนม`;
- View and Manager layers do not gain direct Firebase, Queue, ledger, or stock-calculation ownership.

## Pending local browser acceptance

Use a non-quarantined room and non-operational test date to confirm:

- History Edit opens the intended date;
- saved photos and signature can be explicitly loaded in the Daily Attendance editor;
- History Delete confirmation appears, but do not complete a real-classroom delete;
- one-day Room A4 shows the table, photos, and signature;
- multi-day Room A4 keeps all date columns in one landscape matrix and places dated evidence on following pages at up to five dates per page;
- Student A4 keeps matching evidence inline after its timeline;
- Pending, Retroactive, and Vacation history records each open their matching A4 report;
- each operational report shows its student/quantity table, one-row photos, available receiver signatures, and Teacher approval line;
- desktop and Responsive `820 x 1180` remain usable;
- Console is clean;
- ordinary report load stays media-free and Print performs only scoped authenticated reads.
