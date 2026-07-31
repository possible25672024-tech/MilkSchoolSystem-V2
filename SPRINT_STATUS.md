# MilkSchoolSystem-V2

# Sprint Status

Last Update: 2026-07-31

Current Branch: `feature/sprint-5.7-operational-reports`

Current Version: V2

## Current Sprint

Sprint 5.7 — Operational Summaries and Period Reports

Status: **AUTOMATED PASS — 73/73 / LIVE SERVER BROWSER GATE PENDING**

Approved predecessor: Sprint 5.6 — Classroom Distribution and Distribution History

## Sprint 5.7 Current Boundary

- separate Admin management-summary and distribution-report screens;
- day, Monday-Sunday week, half-month, month, and explicit-semester ranges;
- received, distributed, Attendance, Pending, Retroactive, Vacation, used, and
  period-net totals by room, grade, and school;
- current Main Stock and Room Stock are labeled as current balances only;
- scalable shallow discovery with out-of-range detail hydration blocked;
- no media, photo, signature, evidence, Stock write, or history mutation;
- A4 landscape and UTF-8 BOM CSV output;
- all 73 discovered regression checks pass;
- Live Server browser acceptance remains pending.

## Sprint 5.6 Current Boundary

- calculate classroom distribution from actual students × days;
- decrease Main Stock and increase only the selected Room Stock;
- persist distribution, `DISTRIBUTE` ledger, and operation completion marker in
  the same multi-location update;
- use ETag/If-Match lock plus stable operation id to prevent double deduction;
- block a live second Admin writer and reject mismatched operation reuse;
- load history through shallow keys and media-free summary fields;
- keep the quarantined room/date blocked;
- leave distribution edit/delete differential outside this Sprint;
- all 69 discovered regression checks pass;
- Live Server controlled-write acceptance is pending.

## Sprint 5.5 Current Boundary

- local `.xlsx`, `.xls`, and `.csv` parsing without a CDN;
- validated headers and complete multi-room preview before write;
- duplicate student protection within and across imported rooms;
- ETag-bound confirmation that blocks stale-preview overwrites;
- repeated imports preserve existing `roomId` and Room Stock;
- Admin V2 room creation/edit/dependency-protected deletion;
- real-student room/gender/roster report with A4 and UTF-8 CSV;
- Main Stock, Room Stock, ledger, Queue, and milk records remain untouched;
- all 67 discovered regression checks pass;
- Live Server browser acceptance is pending.

## Sprint 5.4 Current Boundary

- Admin receipt form calculates crates × per-crate + extra boxes.
- receipt increases Main Stock only.
- Room Stock remains unchanged.
- receipt and `RECEIVE` ledger share the accepted multi-location update.
- receipt history uses shallow key discovery and media-free summaries.
- Dashboard shows the end-to-end stock path.
- room trace includes a read-only opening-balance/legacy-history candidate.
- real data remains 26 history-complete, 54 opening-balance candidates, and
  three negative rooms pending explicit reconciliation.
- all 64 discovered regression checks pass.
- Live Server browser acceptance is pending.

## Sprint 5.3 Current Boundary

- Admin opens on a read-only whole-system Dashboard.
- Main Stock and Room Stock are read as actual balances.
- Room Stock is compared with the accepted Report history model per room.
- zero, mismatch, and negative rooms remain visible and are not repaired.
- Thai roster fields are normalized before Attendance detail/edit rendering.
- generated `student_*` rows are excluded when a real roster exists.
- no full historical media collection is loaded.
- no stock, Queue, ledger, stockLog, schema, or legacy file is written.
- all 63 discovered regression checks pass.
- Live Server browser acceptance is pending.

## Completed Foundation

- Sprint 3.4.2 Recovery merged into `develop`.
- Sprint 3.4.3 Stock Module merged into `develop`.
- Sprint 3.4.4 Report Module merged into `develop`.
- Sprint 3.5 Room Module merged into `develop`.
- Sprint 3.6 Teacher Service Foundation merged into `develop`.
- Sprint 3.7 Attendance Service Foundation merged into `develop`.
- Sprint 3.8 Offline Queue and Sync Module merged into `develop`.
- Sprint 3.9 Performance and Payload Optimization merged into `develop`.
- Sprint 4.0 Cutover Readiness and Compatibility merged into `develop`.
- Sprint 4.1 Teacher UI Shell and Read-Only State merged into `develop`.
- Sprint 4.2 Teacher Daily Attendance CRUD UI merged into `develop`.
- Sprint 4.3 Offline Queue Operational UI merged into `develop`.
- Sprint 4.4 Pending Milk Operational UI merged into `develop`.
- Sprint 4.5 Retroactive Milk Operational UI merged into `develop`.
- Sprint 4.6 Vacation Milk Operational UI merged into `develop` at `5e462c9bb80f0f991045ff80ccd294d4240421cd`.
- Sprint 4.7 — Shared Media and Signature Workflow merged into `develop` at `0ed9bc52e26bdf715240be72a84a220771068947`.
- Sprint 4.8 Attendance History, Summary and A4 Print UI merged into `develop` at `5436f255f57a1f925d02b28f906da7f85cb9e3d7`.

Protected `index.html` and `teacher.html` remain unchanged and operational.

Physical iPad remains deferred and must not be represented as PASS.

## Sprint 4.7 Final Acceptance — PASS

Accepted local result:

```text
Media policy checks passed.
Media processor checks passed.
Signature Pad checks passed.
Media store checks passed.
Media Queue redaction checks passed.
Teacher session roster fallback checks passed.
Attendance Media and Signature integration checks passed.
Pending Milk Media and Signature integration checks passed.
Retroactive Milk Media and Signature integration checks passed.
Vacation Milk Media and Signature integration checks passed.
Vacation evidence login replay checks passed.
Vacation live Teacher stock refresh checks passed.
Media evidence recovery and duplicate prevention checks passed.
Attendance UI checks passed.
Pending Milk UI checks passed.
Pending Milk isolated write checks passed.
Retroactive Milk UI checks passed.
Retroactive Milk isolated write checks passed.
Vacation Milk UI checks passed.
Vacation Milk isolated write checks passed.
Sync UI checks passed.
Cutover documentation checks passed.
ALL 43 REGRESSION CHECKS PASSED (6.2s)
nothing to commit, working tree clean
```

Accepted browser result:

- Admin responsive shell passed;
- Teacher dashboard showed authenticated-room ownership;
- Attendance, Pending, Retroactive, and Vacation evidence panels passed;
- desktop and Chrome `820 x 1180` layouts passed;
- Console remained clean;
- visible Network methods were GET-only;
- Queue was `null` before login and after Logout;
- no real evidence, Firebase write, stock mutation, or Queue replay occurred;
- Teacher dashboard Room Stock and Vacation Milk Room Stock both displayed `476`.

Artifacts:

```text
docs/SPRINT_4_7_PLAN.md
docs/SPRINT_4_7_FULL_REGRESSION_GATE.md
docs/SPRINT_4_7_BROWSER_VALIDATION_REPORT.md
```

## Sprint 4.8 Goal

Complete the next Teacher parity slice with authenticated-room read-only Attendance history, summary, and printable A4 report workflows.

Artifact:

```text
docs/SPRINT_4_8_PLAN.md
```

## Sprint 4.8 Planned Scope

### Attendance History

- load only when opened;
- authenticated-room only;
- one selected date or explicit date range;
- deterministic record ordering;
- no full-school Attendance read;
- no historical media hydration unless one record is explicitly requested.

### Attendance Summary

- daily present, absent, and unchecked totals;
- selected-range totals;
- per-student present and absent totals;
- school, room, Teacher, academic year, semester, and date-range metadata;
- pure calculation without source-record mutation.

### A4 Report and Print

- school and room identity;
- Teacher identity;
- academic year and semester;
- selected date or range;
- student detail table;
- present and absent totals;
- deterministic print rows and page breaks;
- print-only styling;
- no Firebase write or automatic full-media download.

Expected module boundary:

```text
modules/reports/attendanceHistoryService.js
modules/reports/attendanceHistoryManager.js
modules/reports/attendanceReportBuilder.js
modules/reports/attendancePrintView.js
```

## Sprint 4.8 Initial Gates

1. History Query Contract — **PASS**;
2. Pure Summary Builder — **PASS**;
3. A4 Print Model — **PASS**;
4. Teacher History, Summary, and Print UI automated gate — **PASS**;
5. desktop and `820 x 1180` read-only browser validation — **PASS**;
6. GET-only visible report Network, no write method, and no Queue ownership/action — **PASS**;
7. complete regression suite — **PASS, 48/48**;
8. synchronized branch and clean working tree — **PASS AT ACCEPTANCE**.

## Sprint 4.8 Current Implementation

- `AttendanceHistoryService` and `AttendanceHistoryManager` load only the authenticated room and explicit date/range;
- `AttendanceReportBuilder` produces pure daily, range, and per-student totals;
- `AttendancePrintModel` produces deterministic A4 portrait pages;
- `AttendancePrintView` renders history, summary, student detail, and A4 print actions;
- `MilkSchoolApplication` dynamically loads and initializes the report path;
- report and print events contain metadata only;
- no report View owns Firebase, storage, Queue, stock, ledger, or stockLog work;
- `index.html` and `teacher.html` remain unchanged;
- local Chrome desktop and Responsive `820 x 1180` report validation passed;
- accepted local report totals were 19 days, 16 students, 300 present, 4 absent, and 0 unchecked;
- Console remained clean and visible report Network methods were GET-only;
- A4 preview contained all 16 student rows on one portrait sheet;
- Work Mode cloud-browser access remained blocked, so browser PASS is based on the product owner's local Chrome evidence.

Artifact:

```text
docs/ATTENDANCE_REPORT_PRINT_UI_GATE.md
docs/SPRINT_4_8_BROWSER_VALIDATION_REPORT.md
```

## Sprint 4.9 Goal

Complete the remaining modular Teacher parity slice with:

- authenticated-room Student Report and A4 print;
- actual read-only Room Stock and last-updated view;
- safe room-isolated device display preferences;
- the complete 12-item Teacher navigation;
- a final non-destructive cutover rehearsal document.

Artifacts:

```text
docs/SPRINT_4_9_PLAN.md
docs/TEACHER_PARITY_CUTOVER_GATE.md
docs/SPRINT_4_9_CUTOVER_REHEARSAL.md
```

## Sprint 4.9 Current Implementation

- `TeacherParityService` builds pure overview, Room Stock, student-report, monthly paper-roster, range, and preference models;
- `TeacherPreferenceStore` persists only allowlisted UI preferences under `milkapp_teacher_preferences_v1`;
- `TeacherParityManager` delegates scoped history/report/Teacher reads and emits metadata-only events;
- `TeacherParityView` provides all 12 required Teacher navigation items;
- desktop Teacher navigation is a full-height dark-blue sidebar on the left with grouped menus, active highlight, and Teacher footer;
- narrower widths retain the compact horizontal navigation fallback;
- daily, history, student-report, Pending, and A4 views display `ดื่มนม` / `ไม่ดื่มนม` while storage remains `present` / `absent`;
- Student Report supports selected student/date range, notes, totals, timeline, and deterministic A4 pages;
- Student Report includes a month picker for a whole-room paper roster with Monday-Friday columns, blank manual ✓/✕ cells, totals, and a Teacher signature line;
- Room A4 and Student A4 explicitly hydrate only the already-selected dates at Print time and render available daily photos plus the homeroom Teacher signature;
- Room A4 renders the whole selected range in one landscape matrix with ✓/✕/— status, per-student totals, and drinking percentages;
- Room A4 starts evidence on the following page and groups up to five dates on each evidence page;
- each Room evidence date uses one row of at most five photos plus its homeroom Teacher signature, while Student A4 retains its inline evidence layout;
- Pending, Retroactive, and Vacation history records expose matching A4 report actions through one shared read-only print renderer;
- operational A4 reports include the student/quantity table, one-row photos, available receiver signatures, and the homeroom Teacher approval line;
- ordinary History and report loading remains media-free;
- each History date exposes confirmed `แก้ไข` and `ลบ` actions;
- History Edit opens and loads the exact date in Daily Attendance;
- History Delete reuses the existing Attendance Manager/Service stock-difference, ETag, audit, and Queue recovery path;
- Room Stock view displays the actual authenticated-room balance without rebuild or mutation;
- safe settings never write Firebase or operational data;
- the Settings screen now separately allows an authenticated Teacher to update only their room's `teacher` leaf;
- desktop uses a fixed blue Teacher header and a dark-blue left sidebar beginning below the header;
- App dynamically loads and initializes the Sprint 4.9 path after accepted operational panels;
- isolated Service, Store, Manager, and UI gates pass;
- all 54 discovered regression checks pass;
- local desktop/Responsive Live Server browser gates passed by product-owner
  acceptance on 2026-07-30.

## Sprint 4.9 Gates

1. Teacher Parity Service — **PASS**;
2. Preference Store safety and room isolation — **PASS**;
3. Manager delegation and metadata-only events — **PASS**;
4. 12-item reference-style top-header/left-sidebar navigation, milk wording, Teacher profile form, and Student Report A4 UI — **PASS**;
5. explicit report evidence and History Edit/Delete automated gate — **PASS**;
6. shared Pending/Retroactive/Vacation A4 parity gate — **PASS**;
7. complete regression suite — **PASS, 54/54**;
8. desktop and Chrome Responsive `820 x 1180` — **PASS**;
9. Console, scoped print-time evidence reads, and scoped Teacher-name behavior — **PASS**;
10. synchronized source tree and Draft PR publication — **PASS** (`PR #3`, remote commit `532302c`, source tree `54bb11b`).

## Read-Only Ownership Contract

Preferred path:

```text
Teacher session
    -> AttendanceHistoryManager
    -> AttendanceHistoryService
    -> scoped AttendanceRepository read
    -> AttendanceReportBuilder
    -> history, summary, or print view
```

Forbidden report ownership:

```text
Firebase writes
POST / PUT / PATCH / DELETE
Room Stock mutation
Main Stock mutation
Queue creation or replay
ledger or stockLog repair
```

## Teacher Legacy Parity Contract — BINDING

V2 must retain:

- ภาพรวมการดื่มนม
- เช็คดื่มนมรายวัน
- ประวัติการเช็ค
- สรุปรายงาน
- พิมพ์รายงาน A4
- นมค้างรายสัปดาห์
- จ่ายนมย้อนหลัง
- จ่ายนมช่วงปิดเทอม
- รายงานนักเรียน
- สต็อกนมคงเหลือ
- ตั้งค่า
- ออกจากระบบ

Photos, signatures, visible and printable student detail, history, summaries, printing, student reports, Room Stock view, settings, and final navigation parity remain mandatory.

Artifact:

```text
docs/TEACHER_LEGACY_PARITY_CONTRACT.md
```

## Sprint 4.8 Non-Goals

Sprint 4.8 does not complete:

- operational Attendance write changes;
- student report as a separate cross-period product;
- remaining Room Stock report UI;
- Teacher settings;
- final navigation parity;
- Firebase security hardening;
- physical iPad sign-off;
- production cutover;
- deferred real-data incident recovery.

## Queue and Payload Rules

- Queue UI must never show photo or signature payloads.
- Media payloads must be persisted before references are used.
- Retries must not duplicate evidence.
- Evidence retry must not repeat a successful Room Stock mutation.
- Audit-only recovery remains audit-only.
- Main Stock remains unchanged.
- Teacher Login must not download historical evidence.
- Report history loads only for the authenticated room and selected date or range.
- Evidence loads only after an explicit user action and only for dates already selected in the current report.

## Safety Boundary

Do not use:

- room `อ.3-3`;
- room ID `mqn0z13eyx5b`;
- date `2026-07-28`;
- a real-classroom write;
- direct Firebase Console mutation of operational records;
- manual Queue, Room Stock, Main Stock, ledger, stockLog, or transaction-history repair.

## Production Blockers — OPEN

- deferred real-classroom incident;
- public Firebase root `.read` and `.write` rules;
- physical iPad validation;
- updated desktop/Responsive browser evidence for Sprint 4.9 report parity;
- remaining Admin/report adapter gaps;
- backup export and isolated restore rehearsal;
- explicit `main` and production approval.

## Protected Business Rules

- Main Stock decreases only on classroom distribution.
- Attendance, Pending, Retroactive, and Vacation Milk change Room Stock only.
- Sprint 4.8 report and print modules are read-only and change no stock.
- Attendance edits apply only the present-count difference.
- Attendance delete restores exactly the quantity previously deducted.
- Teacher access remains limited to the authenticated room.
- Audit-only recovery never repeats a successful stock mutation.
- Negative Room Stock is not silently clamped.
- Legacy files remain available until explicit production-cutover approval.

No merge to `main` is authorized.

## Sprint 5.0 Goal

Close cutover decision D-02 by adding a separate read-only browser-local Report
adapter and an operational Admin report panel without changing Report Service
formulas, protected legacy pages, Firebase schema, or stock rules.

## Sprint 5.0 Current Implementation

- reads only `storedMilkDB_v1`, `backdateDistDB_v1`, and
  `vacationDistDB_v1`;
- normalizes Pending, Retroactive, and Vacation records;
- removes records already represented by Firebase using type-specific keys;
- excludes photos and signatures from aggregation payloads;
- reports missing or invalid local JSON without failing the cloud report;
- injects normalized local sources through ReportManager into existing pure
  Report Service formulas;
- adds Admin-only classroom, grade, and whole-school views;
- adds A4 landscape print and UTF-8 CSV export;
- adds an Admin left menu, room selector, selected-room Dashboard, and
  Attendance/Pending/Retroactive/Vacation history tables;
- every Admin history row exposes View, Edit, and Delete actions;
- Attendance Edit opens the exact date in the accepted Teacher Daily workflow;
- Pending, Retroactive, and Vacation Edit changes only safe descriptive
  metadata and never changes quantities or stock;
- operational Delete delegates to the accepted Services so Room Stock rollback,
  audit, ETag, and Queue recovery remain active;
- Admin may open the complete Teacher workspace for the selected room and
  return to Admin without entering credentials again;
- delegated room access is explicit, room-scoped, and cannot broaden an
  ordinary Teacher session;
- performs no Firebase or Storage write, stock mutation, Queue work, ledger
  work, stockLog repair, or media hydration in the read-only report path;
- preserves protected `index.html` and `teacher.html`;
- passes all 58 discovered regression checks.

Artifacts:

```text
docs/SPRINT_5_0_PLAN.md
docs/REPORT_BROWSER_LOCAL_ADAPTER_GATE.md
docs/ADMIN_ROOM_OPERATIONS_GATE.md
docs/SPRINT_5_0_BROWSER_ACCEPTANCE_CHECKLIST.md
```

Pending:

- product-owner Live Server Admin report validation;
- desktop and Chrome Responsive `820 x 1180`;
- accepted legacy/V2 formula comparison on the same browser;
- A4/CSV evidence;
- clean Console and GET-only Network evidence.

## Sprint 5.1 Goal

Remove the observed Admin `413 Request Entity Too Large` failure by preventing
historical Attendance photos and signatures from being hydrated during room
history loading.

## Sprint 5.1 Current Implementation

- discovers Attendance record keys with `shallow=true`;
- filters exact selected-room `{roomId}_{YYYY-MM-DD}` keys;
- hydrates only each matching `/data` child with bounded concurrency;
- explicitly defers Attendance in the Admin Teacher-core snapshot;
- loads Pending, Retroactive, and Vacation histories through room-scoped
  Repository queries;
- builds the whole-school Admin report from compact, media-free fields rather
  than the full Stock snapshot;
- excludes `photos`, `signature`, and `signatures` from report aggregation;
- normalizes Firebase object collections before Dashboard summation;
- keeps evidence hydration behind explicit view/edit/print actions;
- changes no Firebase schema, stock value, Queue, ledger, or stockLog;
- preserves protected `index.html` and `teacher.html`.

Artifact:

```text
docs/SPRINT_5_1_PLAN.md
tests/attendance-scalable-query-check.mjs
```

Pending:

- none; product-owner Live Server accepted the scalable reads and full-width
  Admin layout.

Automated result:

```text
ALL 60 REGRESSION CHECKS PASSED
```

## Sprint 5.2 Goal

Keep exact-date Attendance editing inside the Admin workspace instead of
changing the active session to Teacher, while preserving the accepted
Attendance stock, audit, recovery, media, and quarantine rules.

## Sprint 5.2 Current Implementation

- Attendance `เปิดแก้ไข` opens an inline selected-date form in Admin;
- Admin session, selected room, active menu, and sidebar remain in place;
- the edit form supports `ดื่มนม`, `ไม่ดื่มนม`, and per-student notes;
- full Attendance evidence is loaded only for the explicitly selected date;
- existing photos, signature, year, term, and saved timestamp are preserved by
  AdminRoomService;
- save delegates to Attendance Service for Room Stock difference, ETag, audit,
  and Queue recovery;
- Main Stock and protected legacy pages remain unchanged;
- the protected incident room/date remains blocked;
- Admin parity delivery is recorded for Sprints 5.3–5.8.

Artifact:

```text
docs/SPRINT_5_2_PLAN.md
tests/sprint-5.2-plan-check.mjs
```

Pending:

- desktop and Responsive Live Server edit/save/cancel validation;
- proof that existing report photos and signature remain after an Admin edit.

Automated result:

```text
ALL 61 REGRESSION CHECKS PASSED
```
