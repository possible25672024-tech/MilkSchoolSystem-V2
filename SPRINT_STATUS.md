# MilkSchoolSystem-V2

# Sprint Status

Last Update

2026-07-27

---

Current Branch

feature/sprint-3.9-performance

---

Current Version

V2

---

Current Sprint

Sprint 3.9 — Performance and Payload Optimization

Status

70% — deterministic request-count optimizations, Teacher core/deferred loading, queue serialization reduction, compatibility fixtures, automated tests, V2 status wiring, and performance audit documentation implemented; local regression, browser Network measurement, responsive/iPad validation, and clean-tree confirmation pending

---

Completed Foundation

✓ Sprint 3.4.2 Recovery merged into `develop` at `648fa6d`

✓ Sprint 3.4.3 Stock Module merged into `develop` at `f56e430`

✓ Sprint 3.4.4 Report Module merged into `develop`

✓ Sprint 3.5 Room Module merged into `develop`

✓ Sprint 3.6 Teacher Module merged into `develop`

✓ Sprint 3.7 Attendance Module merged into `develop`

✓ Sprint 3.8 Offline Queue and Sync Module merged into `develop`

✓ Login, Firebase, Stock, Report, Room, Teacher, Attendance, and Sync rules protected

---

Sprint 3.9 Implemented

✓ Branch created from latest `develop`

✓ Sprint plan created: `docs/SPRINT_3_9_PLAN.md`

✓ No-invented-benchmark rule recorded

✓ Firebase request-count and payload audit targets recorded

✓ Authenticated-room-only attendance verification recorded

✓ Lazy-loading and cache audit targets recorded

✓ Desktop, mobile, and iPad validation matrix recorded

✓ Identical in-flight Firebase GET deduplication implemented

✓ Completed Firebase GETs are not retained as a stale response cache

✓ Login settings and rooms normalized context cache implemented

✓ Login option load followed by immediate credential validation reuses the loaded context

✓ Manual room-list reload bypasses the Login cache

✓ Login cache returns cloned data to avoid consumer mutation

✓ Teacher core snapshot separated from deferred dashboard/history collections

✓ Teacher core snapshot uses five reads

✓ Teacher attendance remains a `{roomId}_` key-prefix query

✓ Teacher normal refresh defaults to core data

✓ Explicit `refreshFull()` loads deferred collections

✓ Full Teacher snapshot keeps core and deferred groups parallel

✓ Queue upsert no longer rereads persistent storage only to return the saved entry

✓ Legacy `rec` and `diff` queue fixtures added

✓ V2 `record` and `difference` queue fixtures added

✓ Mixed valid and corrupt queue fixture added

✓ Repeated queued edit baseline and timestamp preservation checks added

✓ Automated test file added: `tests/performance-module-check.mjs`

✓ Performance audit report added: `docs/PERFORMANCE_AUDIT_REPORT.md`

✓ V2 shell updated to Sprint 3.9 validation status

✓ Legacy `index.html` and `teacher.html` remain unchanged

---

Pending Before Merge

□ Pull `feature/sprint-3.9-performance` to the local workspace

□ Run `node tests/login-foundation-check.mjs`

□ Run `node tests/stock-module-check.mjs`

□ Run `node tests/report-module-check.mjs`

□ Run `node tests/room-module-check.mjs`

□ Run `node tests/teacher-module-check.mjs`

□ Run `node tests/attendance-module-check.mjs`

□ Run `node tests/sync-module-check.mjs`

□ Run `node tests/performance-module-check.mjs`

□ Open `index-v2.html` through Live Server

□ Confirm Admin and Teacher login remain operational

□ Confirm Logout remains operational

□ Confirm Browser Console is clean

□ Confirm immediate login does not redownload settings and rooms

□ Confirm `TeacherManager.refresh()` uses room-scoped attendance and excludes deferred collections

□ Record actual Network request count and transferred sizes

□ Run responsive mobile viewport validation

□ Run iPad-class viewport or physical iPad validation when available

□ Confirm working tree clean

□ Update closeout documentation after validation

□ Merge into `develop` only after all gates pass

---

Known Migration Gaps

The operational attendance form, media capture, signatures, printing, queue badge, and offline banner remain in `teacher.html`.

The modular Attendance and Sync multi-location PATCH still lacks the legacy ETag compare-and-retry protection for simultaneous Room Stock writers.

Production cutover still requires compatibility validation between queues written by legacy `teacher.html` and queues normalized by V2.

Full settings and rooms are still read because the existing rooms collection may be array-shaped and Room ID is not guaranteed to equal the Firebase child key.

Deferred Teacher collections remain full-path reads when explicitly requested; field-query migration requires schema and index compatibility validation.

Real payload bytes and timings remain pending browser measurement on the actual dataset.

---

Protected Business Rules

- Performance work must not change Firebase schema.
- Performance work must not change Main Stock or Room Stock calculations.
- Teacher attendance reads remain scoped to the authenticated room.
- Queue entries survive refresh and browser restart.
- Repeated queued edits preserve the original baseline.
- Main Stock must remain unchanged by Teacher, Attendance, and Sync operations.
- Attendance keys remain `{roomId}_{YYYY-MM-DD}`.
- Reports remain read-only.
- Negative Room Stock is not silently clamped.
- Legacy `index.html` and `teacher.html` remain unchanged during Sprint 3.x migration.
