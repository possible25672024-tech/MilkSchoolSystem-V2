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

10% — Sprint plan, measurement rules, request and payload audit targets, queue compatibility fixtures, browser validation matrix, and merge gates initialized; implementation and measurements pending

---

Completed Foundation

✓ Sprint 3.4.2 Recovery merged into `develop` at `648fa6d`

✓ Sprint 3.4.3 Stock Module merged into `develop` at `f56e430`

✓ Sprint 3.4.4 Report Module merged into `develop`

✓ Sprint 3.5 Room Module merged into `develop`

✓ Sprint 3.6 Teacher Module merged into `develop`

✓ Sprint 3.7 Attendance Module merged into `develop`

✓ Sprint 3.8 Offline Queue and Sync Module merged into `develop` after Login, Stock, Report, Room, Teacher, Attendance, Sync, Browser, Logout, Console, and clean-tree gates passed

✓ Login, Firebase, Stock, Report, Room, Teacher, Attendance, and Sync rules protected

---

Sprint 3.9 Initialized

✓ Branch created from latest `develop`

✓ Sprint plan created: `docs/SPRINT_3_9_PLAN.md`

✓ No-invented-benchmark rule recorded

✓ Firebase request-count and payload audit targets recorded

✓ Authenticated-room-only attendance verification recorded

✓ Lazy-loading and cache audit targets recorded

✓ Duplicate request audit target recorded

✓ Desktop, mobile, and iPad validation matrix recorded

✓ Legacy and V2 queue compatibility fixtures recorded

✓ Protected legacy files confirmed

---

Pending

□ Inspect FirebaseService request, query, timeout, and cache behavior

□ Inspect login and Teacher request sequences

□ Verify no all-school `mcAttendance` read occurs in Teacher flow

□ Inspect lazy-loading boundaries and repeated refresh behavior

□ Add `tests/performance-module-check.mjs`

□ Add `docs/PERFORMANCE_AUDIT_REPORT.md`

□ Add runtime performance utilities only when justified by measured need

□ Add legacy and V2 queue compatibility fixtures

□ Run Login regression tests

□ Run Stock regression tests

□ Run Report regression tests

□ Run Room regression tests

□ Run Teacher regression tests

□ Run Attendance regression tests

□ Run Sync regression tests

□ Run Performance tests

□ Run desktop browser smoke test

□ Run mobile or responsive viewport validation

□ Run iPad-class validation when available

□ Inspect Network requests for Teacher login

□ Confirm working tree clean

□ Merge into `develop` only after all gates pass

---

Known Migration Gaps

The operational attendance form, media capture, signatures, printing, queue badge, and offline banner remain in `teacher.html`.

The modular Attendance and Sync multi-location PATCH still lacks the legacy ETag compare-and-retry protection for simultaneous Room Stock writers.

Production cutover still requires compatibility validation between queues written by legacy `teacher.html` and queues normalized by V2.

The Smart Excel parser, complete-room concurrency, and Report local-data adapter gaps remain recorded from earlier Sprints.

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
