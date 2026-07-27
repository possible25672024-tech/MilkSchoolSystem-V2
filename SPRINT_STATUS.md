# MilkSchoolSystem-V2

# Sprint Status

Last Update

2026-07-28

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

100% — request and payload optimizations, compatibility fixtures, automated regression tests, desktop browser measurement, Admin/Teacher login, Logout, Network validation, console validation, and clean-tree validation passed

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

Sprint 3.9 Completed

✓ Sprint plan created: `docs/SPRINT_3_9_PLAN.md`

✓ No-invented-benchmark rule followed

✓ Identical in-flight Firebase GET deduplication implemented

✓ Completed GETs are removed from the in-flight map

✓ Body-less Firebase GETs no longer send `Content-Type: application/json`

✓ Unnecessary GET CORS preflight requests removed

✓ Login settings and rooms normalized context cache implemented

✓ Immediate credential validation reuses the loaded login context

✓ Manual room reload bypasses the Login cache

✓ Login cache returns cloned data

✓ Authenticated Teacher session carries the selected room snapshot

✓ Teacher core refresh reuses the session room snapshot

✓ Teacher core refresh no longer downloads or queries the complete rooms collection

✓ Default Teacher refresh reads only today's attendance `/data` child

✓ Explicit `refreshFull()` retains room-history and deferred-data behavior

✓ Teacher deferred collections remain excluded from normal refresh

✓ Queue upsert persistent-storage reads reduced from two to one

✓ Legacy `rec` and `diff` queue fixtures added

✓ V2 `record` and `difference` queue fixtures added

✓ Mixed valid and corrupt queue fixture added

✓ Repeated queued edit baseline and timestamp preservation verified

✓ `tests/performance-module-check.mjs` added

✓ `tests/firebase-request-header-check.mjs` added

✓ `tests/teacher-core-payload-check.mjs` added

✓ Performance audit report added and updated with actual browser measurements

✓ `node tests/login-foundation-check.mjs` passed

✓ `node tests/stock-module-check.mjs` passed

✓ `node tests/report-module-check.mjs` passed

✓ `node tests/room-module-check.mjs` passed

✓ `node tests/teacher-module-check.mjs` passed

✓ `node tests/attendance-module-check.mjs` passed

✓ `node tests/sync-module-check.mjs` passed

✓ `node tests/firebase-request-header-check.mjs` passed

✓ `node tests/performance-module-check.mjs` passed

✓ `node tests/teacher-core-payload-check.mjs` passed

✓ Admin login passed

✓ Teacher login passed

✓ Logout passed

✓ Browser console clean after test-generated errors were cleared

✓ Working tree clean

✓ Legacy `index.html` and `teacher.html` unchanged

---

Measured Desktop Result

Environment:

- Chrome desktop on Windows
- Live Server at `127.0.0.1:5500`
- actual school dataset with 83 rooms
- DevTools Network filtered to Fetch/XHR

Before final Teacher core optimization:

- 5 requests
- approximately 20.5 MB transferred
- room-scoped attendance history request approximately 19,924 KB
- complete rooms request approximately 589 KB

After final Teacher core optimization:

- 4 requests
- approximately 1.6 KB transferred
- `settings.json`: approximately 0.6 KB
- `roomStock/{roomId}.json`: approximately 0.3 KB
- `mcAttendance/{roomId}_{date}/data.json`: approximately 0.3 KB
- `updatedAt.json`: approximately 0.3 KB
- observed individual request times: approximately 134–144 ms
- no rooms request
- no room-history attendance request
- no deferred Teacher collection request
- no GET preflight
- no HTTP error

These are observed browser results for the recorded environment, not universal production benchmarks.

---

Merge Gate

PASSED

The branch may be fast-forward merged into `develop`.

---

Deferred Device Gate

Responsive mobile and physical iPad validation were not demonstrated in this Sprint closeout. They remain required before production cutover and move to Sprint 4.0 Cutover Readiness.

---

Known Migration Gaps

The operational attendance form, media capture, signatures, printing, queue badge, and offline banner remain in `teacher.html`.

The modular Attendance and Sync multi-location PATCH still lacks the legacy ETag compare-and-retry protection for simultaneous Room Stock writers.

Production cutover still requires compatibility validation between queues written by legacy `teacher.html` and queues normalized by V2.

Teacher sessions created before Sprint 3.9 do not contain `roomSnapshot`; the repository safely falls back to a complete rooms read until the user logs out and logs in again.

Deferred Teacher collections remain full-path reads when explicitly requested.

The Smart Excel parser, complete-room concurrency, and Report local-data adapter gaps remain recorded from earlier Sprints.

---

Next Sprint

Sprint 4.0 — Cutover Readiness and Compatibility

Target areas:

- legacy-to-V2 functional parity matrix
- physical iPad and responsive mobile validation
- legacy/V2 queue compatibility tests
- ETag Room Stock concurrency design and implementation gate
- Report local-data adapter readiness
- XLSX import parser migration decision
- operational forms, media, signatures, printing, queue badge, and offline banner integration plan
- rollback and production cutover checklist

---

Protected Business Rules

- Performance work must not change Firebase schema.
- Performance work must not change Main Stock or Room Stock calculations.
- Teacher normal refresh reads only the authenticated room and today's attendance summary.
- Full history loads only through explicit full-refresh paths.
- Queue entries survive refresh and browser restart.
- Repeated queued edits preserve the original baseline.
- Main Stock must remain unchanged by Teacher, Attendance, and Sync operations.
- Attendance keys remain `{roomId}_{YYYY-MM-DD}`.
- Reports remain read-only.
- Negative Room Stock is not silently clamped.
- Legacy `index.html` and `teacher.html` remain protected until cutover gates pass.
