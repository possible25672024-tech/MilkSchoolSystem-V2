# MilkSchoolSystem-V2

# Sprint Status

Last Update

2026-07-27

---

Current Branch

feature/sprint-3.8-offline-sync

---

Current Version

V2

---

Current Sprint

Sprint 3.8 — Offline Queue and Sync Migration

Status

10% — Sprint plan, queue entry contracts, baseline-preservation rules, retry policy, room-scope safety, and merge gates initialized; legacy sync workflow inspection and implementation pending

---

Completed Foundation

✓ Sprint 3.4.2 Recovery merged into `develop` at `648fa6d`

✓ Sprint 3.4.3 Stock Module merged into `develop` at `f56e430`

✓ Sprint 3.4.4 Report Module merged into `develop`

✓ Sprint 3.5 Room Module merged into `develop`

✓ Sprint 3.6 Teacher Module merged into `develop`

✓ Sprint 3.7 Attendance Module merged into `develop` after Login, Stock, Report, Room, Teacher, Attendance, Browser, Logout, Console, and clean-tree gates passed

✓ Login, Firebase, Stock, Report, Room, Teacher, and Attendance rules protected

---

Sprint 3.8 Initialized

✓ Branch created from latest `develop`

✓ Sprint plan created: `docs/SPRINT_3_8_PLAN.md`

✓ Attendance and Room Stock adjustment queue entry contracts recorded

✓ Persistent queue survival requirement recorded

✓ Corrupt-entry filtering requirement recorded

✓ Duplicate attendance replacement rule recorded

✓ Original `baselinePresent` preservation rule recorded

✓ Authenticated-room-only replay rule recorded

✓ Sequential replay requirement recorded

✓ Exponential backoff schedule recorded

✓ Reconnect and periodic flush requirements recorded

✓ Main Stock isolation requirement recorded

✓ Repository/Storage → Service → Manager responsibilities defined

---

Pending

□ Inspect legacy queue storage, replacement, retry, reconnect, periodic flush, Room Stock adjustment, and badge workflows

□ Create `QueueStorage`

□ Create `SyncService`

□ Create `SyncManager`

□ Add Sync module dependency wiring to `index-v2.html`

□ Add `tests/sync-module-check.mjs`

□ Add `docs/SYNC_MIGRATION_GAP_REPORT.md`

□ Run Login regression tests

□ Run Stock regression tests

□ Run Report regression tests

□ Run Room regression tests

□ Run Teacher regression tests

□ Run Attendance regression tests

□ Run Sync tests

□ Run Browser smoke test

□ Confirm working tree clean

□ Merge into `develop` only after all gates pass

---

Known Migration Gaps

The operational attendance form, media capture, signatures, printing, ETag Room Stock protection, and current offline queue remain in `teacher.html` while the modular sync boundary is extracted.

The modular Attendance multi-location PATCH does not yet include the legacy ETag compare-and-retry Room Stock protection for simultaneous writers.

The Smart Excel parser, complete-room concurrency, and Report local-data adapter gaps remain recorded from earlier Sprints.

---

Protected Business Rules

- Queue entries survive refresh and browser restart.
- Corrupt entries are filtered individually without deleting valid entries.
- Repeated queued attendance edits keep the latest record while preserving the original baseline.
- Attendance replay uses AttendanceService Room Stock difference rules.
- Room Stock adjustment retry does not rewrite attendance unnecessarily.
- Queue replay is sequential.
- Only the authenticated room may be replayed.
- Failed entries remain queued.
- Successful entries are removed individually.
- Retry timing uses bounded exponential backoff.
- Main Stock must remain unchanged.
- Attendance keys remain `{roomId}_{YYYY-MM-DD}`.
- Negative Room Stock is not silently clamped.
- Legacy `index.html` and `teacher.html` remain unchanged during Sprint 3.x migration.
