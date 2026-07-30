# Sprint 4.8 — Attendance History, Report and A4 Print UI

Date: 2026-07-29

Branch: `feature/sprint-4.8-report-print-ui`

Status: **COMPLETE — AUTOMATED, DESKTOP, 820 x 1180 AND A4 PRINT GATES PASS**

## Goal

Complete the next Teacher parity slice after Sprint 4.7 by adding authenticated-room Attendance history, summary, and printable A4 report workflows to the modular V2 Teacher interface.

Sprint 4.8 is read-only at the report boundary. It must not change Attendance records, Room Stock, Main Stock, Queue entries, ledger records, stock logs, or transaction history.

## Accepted Foundation

Sprint 4.7 was fast-forward integrated into `develop` at:

```text
0ed9bc52e26bdf715240be72a84a220771068947
```

Accepted foundation includes:

- Attendance, Pending, Retroactive, and Vacation operational UIs;
- photo and signature capture boundaries;
- lazy IndexedDB evidence payload storage;
- Queue redaction and duplicate prevention;
- desktop and Chrome `820 x 1180` browser validation;
- GET-only browser validation traffic;
- empty Queue before login and after Logout;
- 43 complete regression checks.

Protected `index.html` and `teacher.html` remain unchanged.

## In Scope

### 1. Attendance History Query Boundary

Implement an authenticated-room history boundary that:

- accepts exactly one Teacher room from the active session;
- loads history only when the user opens the history area;
- supports one selected date or an explicit date range;
- never performs a full-school Attendance read;
- returns normalized records without mutating the source;
- preserves legacy Attendance keys and fields;
- does not hydrate historical media unless explicitly requested for one record.

Expected ownership:

```text
modules/reports/attendanceHistoryService.js
modules/reports/attendanceHistoryManager.js
```

The UI must not call Firebase directly.

### 2. Attendance Summary Model

Build a pure summary model that can derive, for the authenticated room and selected range:

- number of school days represented;
- total student rows represented;
- present count;
- absent count;
- unchecked count when a source record is incomplete;
- daily present and absent totals;
- per-student present and absent totals;
- report metadata for school, room, Teacher, academic year, semester, and date range.

The summary model must not recalculate or repair Room Stock. It reports Attendance facts only.

Expected ownership:

```text
modules/reports/attendanceReportBuilder.js
```

### 3. Teacher History and Summary UI

Add Teacher-only read-only sections for:

```text
ประวัติการเช็ค
สรุปรายงาน
```

Required controls:

- start date;
- end date;
- load button;
- loading, empty, success, and error states;
- daily summary table;
- per-student summary table;
- explicit selected-room identity;
- no write controls inside the report layer.

The view must remain usable on desktop and Chrome `820 x 1180`.

### 4. A4 Print Model and Print View

Add a print-specific model and view for:

```text
พิมพ์รายงาน A4
```

The A4 output must include:

- school name;
- room name;
- Teacher name;
- academic year and semester;
- selected date or range;
- present, absent, and total summaries;
- student detail rows;
- page title and print timestamp;
- deterministic page breaks;
- page-safe table headers;
- print-only styling that does not alter the normal Teacher screen.

Printing must use the already loaded report model. Opening print preview must not trigger a Firebase write or a full historical media download.

Expected ownership:

```text
modules/reports/attendancePrintView.js
```

### 5. Optional Evidence-on-Demand Boundary

A report may show that evidence exists, but Sprint 4.8 must not download all historical photos or signatures automatically.

Allowed behavior:

- show evidence counts or availability from record metadata;
- load one selected record's evidence only after an explicit user action;
- keep Queue summaries free of photo, signature, receiver identity, and source filename payloads.

## Protected Business Rules

- Main Stock decreases only when Admin distributes milk to classrooms.
- Attendance, Pending, Retroactive, and Vacation workflows affect Room Stock only.
- Sprint 4.8 report and print modules are read-only and affect no stock.
- Attendance edits still apply only the present-count difference.
- Attendance deletion still restores the previously consumed quantity.
- Negative Room Stock remains visible and is not silently clamped.
- Teacher access remains limited to the authenticated room.
- Queue key remains `tc_pending_saves_v1`.
- Protected legacy files remain available.

## Read Contract

The preferred report read path is:

```text
Teacher session
    -> AttendanceHistoryManager
    -> AttendanceHistoryService
    -> AttendanceRepository / scoped Firebase read
    -> pure AttendanceReportBuilder
    -> history, summary, or print view
```

Forbidden ownership in report views:

```text
FirebaseService writes
fetch PUT/PATCH/POST/DELETE
Room Stock mutation
Main Stock mutation
Queue creation or replay
ledger or stockLog repair
```

## Events

Planned read-only events:

```text
milkapp:attendance-history-loading
milkapp:attendance-history-loaded
milkapp:attendance-history-empty
milkapp:attendance-history-error
milkapp:attendance-report-built
milkapp:attendance-print-opened
```

Event payloads must be metadata-safe and must not expose historical photo or signature Data URLs.

## Isolated Gates

### Gate A — History Query Contract

Confirm:

- authenticated-room ownership;
- selected date/range normalization;
- no full-school reads;
- deterministic record ordering;
- empty and partial records handled safely;
- no Firebase writes or stock ownership.

### Gate B — Pure Summary Builder

Confirm:

- daily totals;
- range totals;
- per-student totals;
- incomplete-record handling;
- stable sorting;
- input records remain unchanged.

### Gate C — A4 Print Model

Confirm:

- required school and room metadata;
- deterministic table rows;
- page-break markers;
- print timestamp formatting;
- no media hydration by default;
- no browser storage or Firebase mutation.

### Gate D — UI and Browser Read-only Validation

Confirm:

- desktop layout;
- Chrome `820 x 1180` layout;
- clean Console;
- GET/OPTIONS-only Network;
- Queue remains empty;
- no real operational write;
- protected files unchanged.

### Gate E — Full Regression

Run every repository `tests/*-check.mjs` file in isolated Node processes and require all checks to pass before develop integration.

## Non-Goals

Sprint 4.8 does not complete:

- operational Attendance write changes;
- student report as a separate cross-period product;
- remaining Room Stock report UI;
- Teacher settings;
- final navigation parity;
- Firebase security hardening;
- physical iPad sign-off;
- production cutover;
- the deferred real-data incident recovery.

## Safety Boundary

Do not use:

- room `อ.3-3`;
- room ID `mqn0z13eyx5b`;
- date `2026-07-28`;
- a real-classroom write;
- direct Firebase Console mutation;
- manual Queue, Room Stock, Main Stock, ledger, stockLog, or transaction-history repair.

No merge to `main` is authorized.

## Completion Decision

Sprint 4.8 may be accepted for fast-forward integration into `develop` only when:

- history query, summary builder, and A4 print isolated gates pass;
- authenticated-room ownership is proven;
- desktop and `820 x 1180` browser gates pass;
- Console remains clean;
- Network remains GET/OPTIONS-only;
- Queue remains empty;
- full regression passes;
- branch matches Origin;
- working tree is clean.

## 2026-07-30 Implementation Checkpoint

Completed on `feature/sprint-4.8.1-report-print-ui-integration`:

- authenticated-room history query;
- pure Attendance summary builder;
- deterministic A4 print model;
- Teacher history, daily summary, per-student summary, and A4 print UI;
- dynamic App loading and initialization;
- metadata-only report and print events;
- isolated UI validation;
- all 48 discovered regression checks.

Local Chrome browser validation passed on desktop and Responsive `820 x 1180`. The accepted report loaded 19 days for 16 students with 300 present, 4 absent, and 0 unchecked; Console remained clean, visible report traffic was GET-only, and the A4 preview fit all 16 rows on one portrait sheet.

The Work Mode cloud browser remained unable to access the workspace-local URL. Sprint 4.8 PASS is based on the product owner's local Chrome evidence.

Evidence:

```text
docs/ATTENDANCE_HISTORY_QUERY_GATE.md
docs/ATTENDANCE_REPORT_BUILDER_GATE.md
docs/ATTENDANCE_PRINT_MODEL_GATE.md
docs/ATTENDANCE_REPORT_PRINT_UI_GATE.md
docs/SPRINT_4_8_BROWSER_VALIDATION_REPORT.md
```
