# MilkSchoolSystem-V2

# Sprint Status

Last Update

2026-07-27

---

Current Branch

feature/sprint-3.7-attendance

---

Current Version

V2

---

Current Sprint

Sprint 3.7 — Attendance Module Migration

Status

10% — Sprint plan, atomic write boundary, stock-difference rules, and safety requirements initialized; legacy attendance workflow inspection and implementation pending

---

Completed Foundation

✓ Sprint 3.4.2 Recovery merged into `develop` at `648fa6d`

✓ Sprint 3.4.3 Stock Module merged into `develop` at `f56e430`

✓ Sprint 3.4.4 Report Module merged into `develop`

✓ Sprint 3.5 Room Module merged into `develop`

✓ Sprint 3.6 Teacher Module merged into `develop` after Login, Stock, Report, Room, Teacher, Browser, and clean-tree gates passed

✓ Login, Firebase, Stock, Report, Room, and Teacher rules protected

---

Sprint 3.7 Initialized

✓ Branch created from latest `develop`

✓ Sprint plan created: `docs/SPRINT_3_7_PLAN.md`

✓ Compatible attendance key format recorded

✓ Authenticated-room-only read and write rule recorded

✓ New attendance Room Stock consumption rule recorded

✓ Attendance edit difference rule recorded

✓ Attendance deletion rollback rule recorded

✓ Main Stock isolation requirement recorded

✓ Multi-location Firebase update boundary recorded

✓ Offline queue deferral to Sprint 3.8 recorded

✓ Repository → Service → Manager responsibilities defined

---

Pending

□ Inspect legacy attendance save, edit, difference, Room Stock, ledger, deletion, rollback, media, and signature workflows

□ Create `AttendanceRepository`

□ Create `AttendanceService`

□ Create `AttendanceManager`

□ Add Attendance module dependency wiring to `index-v2.html`

□ Add `tests/attendance-module-check.mjs`

□ Add `docs/ATTENDANCE_MIGRATION_GAP_REPORT.md`

□ Run Login regression tests

□ Run Stock regression tests

□ Run Report regression tests

□ Run Room regression tests

□ Run Teacher regression tests

□ Run Attendance tests

□ Run Browser smoke test

□ Confirm working tree clean

□ Merge into `develop` only after all gates pass

---

Known Migration Gaps

The operational attendance form, media capture, signatures, printing, and offline queue remain in `teacher.html` during this extraction.

Persistent offline queue, retry, reconnect flush, and queued-edit conflict handling remain scheduled for Sprint 3.8.

The Smart Excel parser, complete-room concurrency, and Report local-data adapter gaps remain recorded from earlier Sprints.

---

Protected Business Rules

- Attendance keys remain `{roomId}_{YYYY-MM-DD}`.
- Only the authenticated room may be read or written.
- New attendance reduces Room Stock by the number of present students.
- Attendance edits adjust Room Stock by the present-count difference only.
- Attendance deletion restores the previously consumed Room Stock.
- Main Stock must remain unchanged.
- Ledger records remain compatible.
- Existing Room IDs and Room Stock links remain stable.
- Reports are read-only.
- Rebuild calculations use transaction history as the source of truth.
- UI modules never call Firebase directly.
- Offline queue behavior remains unchanged until Sprint 3.8.
- Legacy `index.html` and `teacher.html` remain unchanged during Sprint 3.x migration.
