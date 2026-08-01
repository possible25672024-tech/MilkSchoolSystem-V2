# Changelog

## Sprint 6.5 — External UAT and deployment closure gates

- add one-command external Rules/project/incident/regression gate;
- add read-only forensic audit for room `mqn0z13eyx5b` on `2026-07-28`;
- add commit-bound Production approval template and verifier;
- preserve all Production, `main`, tag, Restore, and cutover blocks until
  external evidence and explicit authorization exist.

## Sprint 6.4 — Firebase Authentication, Security Rules and UAT

- replaced browser password comparison with Firebase Email/Password ID-token
  authentication, refresh, restore, and sign-out;
- bound compatible sessions to Firebase UID authorization profiles;
- removed static database-secret loading and plaintext Admin/Teacher password
  checks from V2 runtime;
- changed Teacher collection reads to room-scoped queries;
- added deny-by-default active Rules and freeze-writes rollback Rules;
- added official Emulator and real isolated-project allow/deny plus
  Backup/Restore UAT programs;
- raised automated regression to 100/100;
- recorded Emulator artifact download, real test project, Live Browser, data
  incident, and explicit Production approval as remaining blockers;
- changed no protected legacy page and performed no deployment or Production
  request.
- added Git attributes that preserve byte-exact vendored PDF/XLSX libraries on
  Windows checkouts and prevent the prior LF-to-CRLF integrity mismatch.

## Sprint 6.3 — UAT, Security and Isolated Restore Readiness

- added a disposable Firebase REST-compatible Backup/Restore rehearsal with
  SHA-256, root ETag, Restore audit, safety confirmation, and stale-write
  conflict evidence;
- added Live HTTP asset, Responsive contract, unique-ID, and local dependency
  gates without contacting Production;
- recorded that real Live Browser and real isolated Google Firebase evidence
  remain pending because those environments are not available here;
- recorded client-side password/session handling and missing server-enforced
  Firebase authorization evidence as a critical Production blocker;
- retained the quarantined room/date incident and blocked Production, `main`,
  tag, deployment, Restore, and cutover pending explicit acceptance.

## Sprint 6.2 — Safe PDF Upload Optimization

- added browser-side lossless PDF structural compression with local pdf-lib;
- reopens compressed output and requires the original page count;
- accepts compressed bytes only when at least 4 KB and 1% smaller;
- preserves original signed, encrypted, non-beneficial, or failed-validation PDFs;
- shows PDF page count and original-to-saved byte size before upload;
- added one acceptance gate and raised regression to 92 checks;
- kept historical files, protected legacy pages, Stock rules, Backup/Restore,
  Production, main, tag, and cutover unchanged.

## Sprint 6.1 — Image Upload Optimization and Storage Control

- applied the accepted 1,000 px, JPEG 0.70, 400 KB image pipeline to new
  Admin JPG/PNG document uploads;
- displayed source and optimized size before upload;
- preserved PDF source files during Sprint 6.1;
- kept all historical images and documents unchanged;
- added one acceptance gate and raised regression to 91 checks;
- kept protected legacy pages, Stock rules, Production, main, tag, and cutover
  unchanged.

## Sprint 6.0 — Production Readiness and Release

- fixed classroom selection so the saved student count remains visible when
  Main Stock is zero or insufficient;
- kept the students × manually entered days preview available for total boxes,
  crate/remainder, Main Stock before/after, and Room Stock before/after;
- added an exact shortage warning and blocked submission while retaining the
  guarded Stock Service latest-balance check;
- started the final release-readiness sprint without authorizing Production
  Restore, `main`, tag, deployment, cutover, or incident closure.

## Sprint 5.9.3 — Receipt A4, Distribution Summary and Backup Profiles

- added A4 portrait printing to the explicitly viewed receipt detail;
- exposed students, manually entered days, total boxes, crate remainder, and
  Main Stock before/after in the classroom distribution preview;
- added a fast legacy-like core backup that skips Teacher operation history and
  document file bodies;
- retained complete evidence backup as a separate explicit action;
- marked core files reference-only and blocked them from whole-root Restore;
- added one acceptance gate and raised regression to 88 checks;
- kept protected legacy pages, Stock ownership, and Production Restore unchanged.

## Sprint 5.9.1 — Admin Parity Corrections

- added up to five processed distribution photos and separate receiver/sender
  signatures to the guarded classroom distribution record;
- routed Admin Pending, Retroactive, and Vacation menus to the full selected
  Teacher-room workflow with an explicit return-to-Admin action;
- added school-wide drinking metrics, latest checks, per-room daily status, and
  room/month Attendance history with selected-record detail hydration;
- changed anomaly output to show the calculated Main Stock result and retain the
  original stored result separately for audit;
- fixed Backup root consistency reads by using ETag plus `print=silent` and a
  separate shallow key request, eliminating Firebase's unsupported mixed mode;
- added three corrective acceptance gates and raised regression to 84 checks;
- kept protected legacy pages, historical Stock, and Production Restore unchanged.

## Sprint 5.9 — Integration, Security and UAT

- fixed room-management `ดูรายชื่อ` so the selected roster opens visibly in
  the student-report section;
- regrouped all 19 Admin menus into the eight reference sidebar categories;
- replaced oversized root backup reads with shallow root discovery, recursive
  chunk hydration, and before/after root ETag consistency checks;
- kept full-data SHA-256 backup integrity while making restore previews use
  compact current summaries;
- added read-only per-distribution Main Stock formula diagnostics and exports;
- added three Sprint 5.9 gates and raised complete regression to 81 checks;
- kept Production restore, rule deployment, stock auto-repair, `main`, and
  protected legacy replacement blocked pending live/isolated UAT.

## Sprint 5.8 — Admin System Tools

- added Admin document metadata listing with on-demand file download;
- added guarded PDF/JPG/PNG upload and atomic metadata/file deletion;
- added general settings editing with ETag conflict protection while preserving
  Firebase connection values;
- added full `milkApp` JSON backup envelopes with SHA-256 integrity;
- added preview-only restore inspection, mandatory current backup, typed
  confirmation, ETag-protected root replacement, and restore audit;
- added explicit manual Google Drive export/import transfer without storing
  Google credentials;
- added four Sprint 5.8 gates and raised complete regression to 78 checks;
- kept stock formulas and protected legacy files unchanged.

## Sprint 5.7.1 — Report Ordering Correction

- sorted classroom reports by Thai education level from kindergarten upward;
- added natural room-number ordering within each grade;
- changed distribution reports to oldest-first saved chronology;
- added stock-before/stock-after chain fallback for legacy untimed records;
- added a dedicated ordering gate and raised complete regression to 74 checks;
- kept all reports read-only and protected stock/legacy files unchanged.

## Sprint 5.7 — Operational Summaries and Period Reports

- added separate Admin management-summary and distribution-report screens;
- added day, week, half-month, month, and explicit-semester period contracts;
- summarized receipts, distributions, Attendance, Pending, Retroactive, and
  Vacation operations by room, grade, and whole school;
- added scalable shallow key discovery and blocked out-of-range detail reads;
- excluded photos, media, signatures, and evidence from report hydration;
- added landscape A4 and Thai UTF-8 BOM CSV exports;
- added four Sprint 5.7 gates and raised complete regression to 73 checks;
- kept reports read-only and protected legacy files unchanged.

## Sprint 5.6 — Classroom Distribution and Distribution History

- added Admin V2 classroom distribution using actual roster count × days;
- added separate distribution and scalable history screens;
- added ETag/If-Match distribution locking and stable operation idempotency;
- persisted Main Stock, Room Stock, distribution, `DISTRIBUTE` ledger, and
  completion marker in one multi-location update;
- blocked reuse of one operation id for a different distribution;
- excluded generated `student_*` rows and preserved the quarantined room/date;
- added two Sprint 5.6 gates and raised complete regression to 69 checks;
- kept protected legacy files unchanged and left differential edit/delete
  outside this Sprint.

## Sprint 5.5 — Student Import, Room Management and Student Report

- added a local vendored XLSX/XLS/CSV reader with Thai school-header handling;
- added complete import preview, header validation, and duplicate-student gates;
- added ETag-bound confirmation with explicit stale-preview conflict handling;
- preserved immutable room IDs and Room Stock across repeated imports;
- added Admin V2 room creation, metadata edit, and dependency-protected delete;
- added room/gender/student report, A4 print, and UTF-8 CSV export;
- added three Sprint 5.5 gates and raised complete regression to 67 checks;
- kept Main Stock, Room Stock, Queue, ledger, milk history, and protected legacy
  files unchanged.

All notable modular migration changes are recorded here.

## 2026-07-31 — Sprint 5.4 Milk Receipt and Stock Trace

### Added

- Admin `รับนมจาก อบต.` form and media-free receipt history
- Main Stock receipt preview using crates × per-crate count + extra boxes
- receipt persistence through the accepted Stock Service `RECEIVE` workflow
- complete system stock-path explanation and per-room trace
- read-only opening-balance candidate for legacy-history reconciliation
- real-data audit report for 83 rooms

### Changed

- the Dashboard no longer labels every pre-V2 opening balance as an ordinary
  stock mismatch
- rooms are classified as history-complete, empty, opening-balance required, or
  negative
- receipt history uses shallow key discovery and selected summary fields

### Validation

- all 64 discovered regression checks pass
- receipt increases Main Stock and never changes Room Stock
- stock trace and opening-balance calculation remain read-only
- `rebuildAndPersist` remains blocked for the real dataset
- `index.html` and `teacher.html` remain unchanged

## 2026-07-31 — Sprint 5.3 Admin System and Stock Dashboard

### Added

- read-only Admin `ภาพรวมระบบ` as the default Admin workspace
- Main Stock, combined Room Stock, total system stock, rooms, students, and
  used-milk metrics
- per-room actual-versus-history stock comparison
- ready, empty, mismatch, and negative Room Stock status groups
- Admin Dashboard Service, Manager, View, plan, and automated gate

### Fixed

- Thai student roster fields are normalized before Admin history and inline
  Attendance rendering.
- generated `student_*` identities are no longer merged with the real roster,
  preventing a 32-student room from rendering approximately 64 rows.
- Attendance detail totals are scoped to the actual current roster.

### Validation

- all 63 discovered regression checks pass
- Dashboard reads Main Stock and Room Stock without write ownership
- `index.html` and `teacher.html` remain unchanged
- Live Server desktop, responsive, Network, Console, and real-value comparison
  remain pending

## 2026-07-30 — Sprint 5.2 Admin Inline Attendance Edit

### Added

- Admin-owned exact-date Attendance editor inside the selected-room workspace
- explicit one-record evidence hydration after the edit action
- full saved-record detail pages for Attendance, Pending, Retroactive, and
  Vacation Admin histories
- read-only student status, notes, photos, teacher signature, and
  per-student receiver signature rendering
- Sprint 5.2 plan, parity roadmap, and automated gate

### Changed

- Attendance `เปิดแก้ไข` no longer changes the active Admin session or opens
  the Teacher shell.
- Admin may edit `ดื่มนม`, `ไม่ดื่มนม`, and per-student notes in place.
- Attendance Service still owns present-count difference, Room Stock ETag,
  audit, and Queue recovery.
- Existing photos, signature, academic metadata, and original saved timestamp
  are preserved by AdminRoomService rather than accepted from the View.
- Protected quarantine, Main Stock isolation, `index.html`, and `teacher.html`
  remain unchanged.
- Recorded Admin parity delivery order for Sprints 5.3–5.8.
- History `ดู` actions now hydrate only the selected record and render it
  inside the Admin workspace instead of showing a short browser alert.
- Full-record reads verify selected-room ownership while room history tables
  remain summary-only to preserve the Sprint 5.1 Firebase 413 boundary.

### Validation

- Admin room operations and Sprint 5.2 plan checks pass.
- All 62 discovered regression checks pass.
- Live Server browser acceptance remains pending.

## 2026-07-30 — Sprint 5.1 Large Attendance Payload Resilience

### Added

- shallow Attendance key discovery and bounded selected-room `/data` hydration
- Firebase 413 scalable-query regression gate
- Sprint 5.1 plan and browser acceptance criteria

### Changed

- Admin room loading explicitly defers the media-bearing Attendance collection.
- Admin Attendance history no longer downloads historical photos or signatures.
- Pending, Retroactive, and Vacation Admin histories load through room-scoped
  Repository queries.
- Whole-school Admin reports no longer compose the full Stock snapshot.
- Report aggregation reads only required compact fields and excludes photos
  and signatures.
- Teacher Dashboard totals normalize both Firebase objects and arrays.
- Admin operation tables use fitted columns and wrapped action controls so
  View/Edit/Delete remain inside the content panel.
- Admin operation rows become labeled cards on narrow screens.
- The authenticated Admin workspace now uses the full desktop viewport with a
  fixed-width navigation column and a fluid report column, matching the
  operational legacy report proportions without changing Login or Teacher
  layout.
- Existing View/Edit/Delete, Room Stock rollback, audit, Queue recovery, and
  Main Stock isolation remain unchanged.

### Validation

- scalable-query, Admin operations, and Performance checks passed.
- all 60 discovered regression checks passed.
- product-owner Live Server confirmed selected-room and whole-school data load
  without the previous 413/reduce failures.
- responsive table browser retry remains pending.

## 2026-07-30 — Sprint 5.0 Admin Room Operations

### Added

- `modules/admin/adminRoomService.js`
- `modules/admin/adminRoomManager.js`
- `modules/admin/adminRoomView.js`
- Admin room operations isolated gate
- Admin left menu, room selector, selected-room Dashboard, and four operation
  history tables

### Changed

- Admin can open the complete Teacher workspace for a selected room through an
  explicit delegated room context and return to the original Admin session.
- Attendance rows can be opened for full exact-date editing.
- Pending, Retroactive, and Vacation rows support safe descriptive-note edits.
- All four history types expose View and Delete; deletes continue through the
  accepted Service rollback, audit, ETag, and Queue recovery paths.
- Repository metadata updates remain room-checked and do not alter quantity,
  Room Stock, Main Stock, ledger, or stockLog.
- Protected `index.html` and `teacher.html` remain unchanged.

### Validation

- Admin room operations isolated check passed.
- All 58 discovered regression checks passed.
- Product-owner Live Server browser gate remains pending.

## 2026-07-30 — Sprint 4.9 Teacher Student Report and Navigation Parity

### Added

- `modules/services/teacherParityService.js`
- `modules/storage/teacherPreferenceStore.js`
- `modules/teacher/teacherParityManager.js`
- `modules/teacher/teacherParityView.js`
- Sprint 4.9 Service, Store, Manager, UI, plan, and full-regression gates
- Sprint 4.9 plan, Teacher parity gate, and non-destructive cutover rehearsal
- Attendance report-evidence and History-action gate
- Shared Pending/Retroactive/Vacation A4 print renderer and automated gate

### Changed

- Added authenticated-room one-student selected-range reports with notes, totals, and deterministic A4 print pages.
- Added explicit Print-time daily photos and homeroom Teacher signatures to Room A4 and Student A4 reports.
- Added a monthly paper-roster form inside Student Report: whole authenticated-room roster, Monday-Friday date columns, blank ✓/✕ cells, manual totals, and a homeroom Teacher signature line.
- Changed Room A4 to one landscape date-column matrix for the whole selected range, with daily ✓/✕/— status, row totals, and drinking percentages.
- Moved Room A4 evidence to the following pages, grouped at up to five dates per page; every date retains one row of at most five photos and its homeroom Teacher signature.
- Added matching A4 report actions to Pending Milk, Retroactive Milk, and Vacation Milk history using one shared read-only renderer.
- Added operation-specific student/quantity tables, one-row photo evidence, receiver signatures, and the homeroom Teacher approval line.
- Kept ordinary History and report loading media-free; evidence reads are limited to dates already selected in the report.
- Added per-date History `แก้ไข` and `ลบ` actions.
- History Edit opens and loads the exact selected date in Daily Attendance, including the existing selected-date evidence workflow.
- History Delete delegates to the accepted Attendance Manager/Service path so present-count restoration, ETag retry, audit retry, and Queue recovery remain unchanged.
- Added an actual read-only Room Stock and compatible last-updated view.
- Added safe room-isolated device preferences for default range, compact mode, and remembered navigation.
- Added all 12 required Teacher navigation items and reused the accepted Sprint 4.1–4.8 operational panels.
- Reworked the 12-item Teacher menu into a full-height dark-blue left desktop sidebar matching the accepted reference structure.
- Added grouped menu headings, icons, amber active-item marker, scrollable menu area, system/school header, and Teacher/room footer.
- Matched the supplied Teacher reference more closely with a fixed blue top header and a left sidebar that begins below the header.
- Moved authenticated room and Teacher identity into the upper sidebar while retaining the identity footer.
- Added editable homeroom Teacher information in Settings: room is read-only and the Teacher name writes only the authenticated room's `teacher` leaf.
- Added validation, session/cache refresh, and metadata-only Teacher-profile events without changing students, Attendance, Queue, Room Stock, Main Stock, ledger, or stockLog.
- Retained the compact horizontal navigation fallback on narrower screens.
- Changed user-facing Attendance wording from `มาเรียน` / `ขาดเรียน` to `ดื่มนม` / `ไม่ดื่มนม` across daily controls, summaries, reports, Pending rows, and A4 print.
- Preserved internal `present` / `absent` values, stock calculations, Queue compatibility, and existing data.
- Dynamically loaded the Sprint 4.9 boundary from `MilkSchoolApplication`.
- Kept Firebase schema, stock rules, Queue compatibility, and protected legacy pages unchanged.
- Kept monthly paper-roster generation read-only; it uses the already-loaded room roster and performs no Attendance, stock, Queue, or Firebase write.

### Validation

- Teacher Parity Service isolated check passed.
- Teacher Preference Store safety and room-isolation check passed.
- Teacher Parity Manager and metadata-only event check passed.
- Teacher navigation, Student Report, and A4 UI check passed.
- Authenticated-room Teacher-profile Repository, Service, Manager, and UI checks passed.
- Explicit report-evidence and History Edit/Delete checks passed.
- All 54 discovered regression checks passed.
- Local browser gate remains pending.

### Integration Decision

- Draft PR only until full regression and local browser acceptance pass.
- Does not authorize `main`, Production, legacy replacement, incident closure, backup/restore execution, or physical iPad PASS.

## 2026-07-30 — Sprint 4.8 Attendance History, Summary and A4 Print UI

### Added

- `modules/reports/attendancePrintView.js`
- `tests/attendance-report-print-ui-check.mjs`
- `tests/run-sprint-4.8-regression.mjs`
- `docs/ATTENDANCE_REPORT_PRINT_UI_GATE.md`

### Changed

- Connected authenticated-room Attendance history, pure summary, and A4 print models to the modular Teacher shell.
- Added explicit date-range loading, daily totals, per-student totals, empty/error states, and print controls.
- Added deterministic print-window HTML generated only from the accepted in-memory print model.
- Added metadata-only report-built and print-opened events.
- Dynamically loaded and initialized the Sprint 4.8 report path from `MilkSchoolApplication`.
- Kept Firebase, browser storage, Queue, stock, ledger, stockLog, and historical evidence payloads out of the View.
- Kept `index.html` and `teacher.html` unchanged.

### Validation

- Attendance report and A4 print UI isolated check passed.
- All 48 discovered regression checks passed locally in 9.6 seconds.
- Desktop and Chrome Responsive `820 x 1180` report layouts passed.
- The accepted range loaded 19 days for 16 students with 300 present, 4 absent, and 0 unchecked.
- Console remained clean and visible report Network methods were GET-only.
- A4 print preview fit all 16 student rows on one portrait sheet.

### Integration Decision

- Accepted for integration into `develop`.
- Does not authorize merge or deployment to `main`.
- Does not replace `teacher.html`.
- Production blockers remain open.

## 2026-07-29 — Sprint 4.3 Offline Queue Operational UI

### Added

- `modules/sync/syncView.js`
- `tests/sync-ui-check.mjs`
- `tests/sync-restart-reconnect-check.mjs`
- `docs/SPRINT_4_3_PLAN.md`
- `docs/SYNC_UI_IMPLEMENTATION_REPORT.md`
- `docs/SYNC_UI_BROWSER_VALIDATION_REPORT.md`

### Changed

- Added operational online, offline, syncing, pending, failed, deferred, and synchronized states.
- Added persistent queue count, maximum attempts, last successful sync time, latest summary, and next retry display.
- Added safe item-level queue summaries without student, photo, signature, ledger, or stockLog payload exposure.
- Added manual retry through `SyncManager.flushNow("manual-ui")`.
- Disabled retry while offline, flushing, or empty.
- Added Teacher-only Sync lifecycle start/stop and event-driven rendering.
- Added safe `queueItems` to `SyncManager.getStatus()`.
- Preserved overlapping-flush protection and Main Stock isolation.
- App initializes SyncView after Login, Teacher, and Attendance Views.
- Kept QueueStorage, SyncService, Firebase, Repository, fetch, Local Storage, and Session Storage out of the View.
- Corrected the Sync UI test to accept programmatic `sync-panel` creation without changing Runtime.

### Validation

- All 18 regression checks passed on Node.js 24.18.0.
- QueueStorage recreation persistence passed.
- Offline startup performed no replay.
- Reconnect replayed isolated entries sequentially.
- Successful entries were removed individually.
- Failed/deferred entries and retry metadata survived restart.
- Attendance partial save converted to Room Stock-only work.
- Main Stock remained 999 throughout isolated replay.
- Browser queue was empty before Teacher Login.
- Offline/reconnect transitions and settled synchronized state passed.
- Network evidence showed read-only GET/fetch traffic with no visible PUT, PATCH, or DELETE.
- Console remained clean.
- Teacher Logout hid Queue UI.
- Admin Login/Logout remained unchanged.
- 820 x 1180 responsive layout passed.
- Feature branch synchronized with origin and working tree clean.
- `index.html` and `teacher.html` remained unchanged.

### Integration Decision

- Approved for fast-forward merge into `develop`.
- Does not replace `teacher.html`.
- Does not authorize merge or deployment to `main`.
- Does not authorize production cutover while the real-data incident remains open.
- Next Sprint: Pending Milk Operational UI.

## 2026-07-28 — Sprint 4.2 Teacher Daily Attendance CRUD UI

### Added

- `modules/attendance/attendanceView.js`
- `tests/attendance-ui-check.mjs`
- `tests/attendance-isolated-write-check.mjs`
- `docs/SPRINT_4_2_PLAN.md`
- `docs/ATTENDANCE_UI_IMPLEMENTATION_REPORT.md`
- `docs/ATTENDANCE_ISOLATED_WRITE_GATE.md`
- `docs/ATTENDANCE_REAL_DATA_TEST_INCIDENT.md`

### Changed

- Added a date-scoped daily Attendance form to the modular Teacher shell.
- Added authenticated-room-only student rendering.
- Added present/absent controls and per-student notes.
- Added checked, present, absent, and unchecked totals.
- Added one-day loading through `AttendanceManager.loadDay()`.
- Added create/edit through `AttendanceManager.save()`.
- Added confirmed delete through `AttendanceManager.remove()`.
- Added Room Stock before/after, ETag conflict, queue, and audit feedback.
- Preserved existing `photos`, `signature`, `year`, `term`, and `savedAt` during edits.
- Kept Firebase, Repository, browser storage, stock calculations, ledger, retry, and ETag ownership out of the View.
- Preserved Main Stock isolation.
- Added responsive desktop and 820 x 1180 Attendance layouts.
- Corrected Node.js 24 cross-VM Array comparison in the UI test.
- Corrected the Cutover documentation test to accept both valid Sprint 4.1 merge phrases.

### Isolated Write Validation

- Create 3 present changed Room Stock `50 → 47`.
- Edit 3 to 5 present deducted only 2: `47 → 45`.
- Edit 5 to 2 present restored only 3: `45 → 48`.
- Delete restored 2: `48 → 50`.
- Main Stock remained 999 throughout.
- Compatible Attendance keys and record fields were preserved.
- Successful operations created compatible ledger and stockLog records.
- Deliberate Room Stock failure after Attendance save queued exactly one Room Stock retry.
- No production Firebase service or repository was loaded by the isolated test.

### Validation

- All 16 regression checks accepted as passed.
- Admin Login and Logout regression passed.
- Desktop exact-date Attendance read passed.
- No full-history, cross-room, Main Stock, or write request occurred during read-only validation.
- Complete 820 x 1180 Attendance interaction passed.
- Save, Delete, and Logout remained reachable.
- Desktop and responsive Console gates passed.
- Feature branch synchronized with origin.
- Working tree clean.
- `index.html` and `teacher.html` unchanged.

### Real-Data Incident

- A development write was confirmed against real room `อ.3-3` / `mqn0z13eyx5b`, date `2026-07-28`.
- The test-created record remains with 22 present and 3 absent.
- Room Stock remains 1,253 versus recorded pre-test 1,275.
- The room/date is quarantined and must not be used for additional tests or trusted operational evidence.
- Room `อ.3-4` / `mqn0z13emyrc` was verified as Attendance `null` and Room Stock 350.
- Recovery was deferred by the product owner so development could continue.
- Recovery and incident closure remain mandatory before `main` or production cutover.

### Integration Decision

- Approved for fast-forward merge into `develop`.
- Does not replace `teacher.html`.
- Does not authorize merge or deployment to `main`.
- Does not authorize production cutover while the incident remains open.
- Next Sprint: Offline Queue Operational UI.

## 2026-07-28 — Sprint 4.1 Teacher UI Shell and Read-Only State

### Added

- `modules/teacher/teacherView.js`
- `tests/teacher-ui-shell-check.mjs`
- `docs/SPRINT_4_1_PLAN.md`
- `docs/TEACHER_UI_SHELL_VALIDATION_REPORT.md`

### Changed

- Added separate Admin and Teacher shell containers.
- Added school, room, teacher, current Room Stock, queue count, and online/offline state.
- Added Teacher Logout and restored-session rendering.
- Preserved Admin role routing.
- Kept Firebase, Repository, Local Storage, Session Storage, and stock calculations out of the View.
- Preserved the four-read Teacher core refresh.

### Validation

- All 14 automated tests passed.
- Desktop Teacher core Network passed at four reads and approximately 1.6 KB.
- Offline/Online, Teacher, Admin, Logout, desktop, 820 x 1180, and Console gates passed.
- Working tree clean.
- `index.html` and `teacher.html` unchanged.

### Integration Decision

- Fast-forward merged into `develop`.
- Did not replace `teacher.html`.
- Did not authorize operational Attendance cutover or `main` deployment.

## 2026-07-28 — Sprint 4.0 Cutover Readiness and Compatibility

### Added

- Cutover parity, readiness, decision, Teacher UI integration, production rollback, concurrency, audit-recovery, and documentation artifacts.

### Changed

- Added Firebase ETag reads and `If-Match` writes.
- Added HTTP 412 conflict retry and latest-value Room Stock recalculation.
- Preserved Attendance-first writes.
- Added persistent Room Stock-only and audit-only recovery.
- Preserved Main Stock isolation.

### Validation and Decision

- Automated, desktop, responsive, Console, and clean-tree gates passed.
- Fast-forward merged into `develop`.
- Production traffic switching and `main` remained blocked.
- `index.html` and `teacher.html` remained protected.
- Physical iPad testing remained deferred.

## 2026-07-28 — Sprint 3.9 Performance and Payload Optimization

### Added

- Performance, Firebase request-header, and Teacher core-payload tests.
- Performance audit report.

### Changed

- Added in-flight GET deduplication.
- Removed unnecessary GET preflight headers.
- Added Login context reuse and Teacher room snapshots.
- Reduced normal Teacher refresh to date-scoped core reads.
- Deferred history and secondary collections.

### Measured Result

- Before: approximately 20.5 MB across 5 requests.
- After: approximately 1.6 KB across 4 requests.

## 2026-07-27 — Sprint 3.8 Offline Queue and Sync

### Added

- `QueueStorage`, `SyncService`, `SyncManager`, Sync tests, plan, and gap report.

### Changed

- Preserved `tc_pending_saves_v1`.
- Added legacy `rec` and `diff` compatibility.
- Added corrupt-entry filtering, duplicate replacement with original baseline preservation, sequential replay, bounded backoff, reconnect/startup flush, Room Stock-only replay, and audit-only recovery.

## 2026-07-27 — Sprint 3.7 Attendance Service Foundation

### Added

- Attendance Repository, Service, Manager, tests, plan, and gap report.

### Changed

- Added room-scoped Attendance keys and queries.
- Added create, edit-by-difference, delete rollback, ledger, stockLog, and Main Stock isolation.

## 2026-07-27 — Sprint 3.6 Teacher Service Foundation

### Added

- Teacher Repository, Service, Manager, tests, plan, and gap report.

### Changed

- Added authenticated-room-only reads, scoped Attendance query, session validation, dashboard calculations, and Room Stock-only commands.

## 2026-07-27 — Sprint 3.5 Room

### Added

- Room Service, Manager, tests, plan, and gap report.

### Changed

- Added stable Room IDs, Room Stock preservation, duplicate validation, parsed-sheet import preparation, and deletion safety.

## 2026-07-27 — Sprint 3.4.4 Report

### Added

- Report Manager, tests, plan, and gap report.

### Changed

- Added read-only classroom, grade, and whole-school aggregation, Thai grade normalization, print/Excel models, and cached view switching.

## 2026-07-27 — Sprint 3.4.3 Stock

### Added

- Stock Service, Manager, tests, plan, and gap report.

### Changed

- Added Main Stock receive/distribution, Room Stock consumption/rollback, rebuild, validation, and compatible ledger calculations.

## 2026-07-27 — Sprint 3.4.2 Recovery Foundation

### Added or Restored

- Runtime Firebase configuration.
- Firebase Realtime Database REST service.
- BaseRepository.
- Admin and Teacher login.
- Compatible `milkApp_loginSession` storage.
- V2 bootstrap and Login foundation tests.
