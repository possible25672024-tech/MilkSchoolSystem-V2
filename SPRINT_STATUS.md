# MilkSchoolSystem-V2

# Sprint Status

Last Update: 2026-07-30

Current Branch: `feature/sprint-4.9-teacher-parity-cutover`

Current Version: V2

## Current Sprint

Sprint 4.9 — Student Report, Room Stock, Teacher Settings and Navigation Parity

Status: **90% — AUTOMATED UI AND 53-CHECK REGRESSION PASS / LOCAL BROWSER GATE PENDING**

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

- `TeacherParityService` builds pure overview, Room Stock, student-report, range, and preference models;
- `TeacherPreferenceStore` persists only allowlisted UI preferences under `milkapp_teacher_preferences_v1`;
- `TeacherParityManager` delegates scoped history/report/Teacher reads and emits metadata-only events;
- `TeacherParityView` provides all 12 required Teacher navigation items;
- desktop Teacher navigation is a full-height dark-blue sidebar on the left with grouped menus, active highlight, and Teacher footer;
- narrower widths retain the compact horizontal navigation fallback;
- daily, history, student-report, Pending, and A4 views display `ดื่มนม` / `ไม่ดื่มนม` while storage remains `present` / `absent`;
- Student Report supports selected student/date range, notes, totals, timeline, and deterministic A4 pages;
- Room A4 and Student A4 explicitly hydrate only the already-selected dates at Print time and render available daily photos plus the homeroom Teacher signature;
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
- all 53 discovered regression checks pass;
- local desktop/Responsive browser gates remain pending.

## Sprint 4.9 Gates

1. Teacher Parity Service — **PASS**;
2. Preference Store safety and room isolation — **PASS**;
3. Manager delegation and metadata-only events — **PASS**;
4. 12-item reference-style top-header/left-sidebar navigation, milk wording, Teacher profile form, and Student Report A4 UI — **PASS**;
5. explicit report evidence and History Edit/Delete automated gate — **PASS**;
6. complete regression suite — **PASS, 53/53**;
7. desktop and Chrome Responsive `820 x 1180` — **PENDING UPDATED SCREENSHOT EVIDENCE**;
8. Console, scoped print-time evidence reads, and one scoped Teacher-name write — **PENDING LOCAL BROWSER EVIDENCE**;
9. synchronized branch and clean working tree — **PENDING PUBLICATION**.

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
- student report, remaining Room Stock view, settings, and final Teacher navigation parity in Sprint 4.9;
- remaining Teacher navigation parity;
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
