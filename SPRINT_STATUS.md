# MilkSchoolSystem-V2

# Sprint Status

Last Update

2026-07-28

---

Current Branch

feature/sprint-4.0-cutover-readiness

---

Current Version

V2

---

Current Sprint

Sprint 4.0 — Cutover Readiness and Compatibility

Status

92% — automated regression, ETag concurrency, partial-save recovery, audit-only recovery, desktop Admin and Teacher login, direct Logout, clean Teacher and post-Logout Console evidence, current Sprint 4.0 shell text, browser Network evidence, initial 820 x 1180 responsive-layout evidence, explicit cutover decisions, operational Teacher UI plan, and production rollback plan completed; latest documentation test, responsive Teacher login/Logout interaction, final clean branch gate, and Sprint closeout remain pending

---

Completed Foundation

✓ Sprint 3.4.2 Recovery merged into `develop`

✓ Sprint 3.4.3 Stock Module merged into `develop`

✓ Sprint 3.4.4 Report Module merged into `develop`

✓ Sprint 3.5 Room Module merged into `develop`

✓ Sprint 3.6 Teacher Module merged into `develop`

✓ Sprint 3.7 Attendance Module merged into `develop`

✓ Sprint 3.8 Offline Queue and Sync Module merged into `develop`

✓ Sprint 3.9 Performance and Payload Optimization merged into `develop`

✓ Desktop Teacher core refresh measured at approximately 1.6 KB across 4 requests on the recorded 83-room dataset

✓ Login, Firebase, Stock, Report, Room, Teacher, Attendance, Sync, and Performance regression gates passed before Sprint 4.0

---

Sprint 4.0 Runtime and Test Foundation

✓ FirebaseService ETag read primitive using `X-Firebase-ETag: true`

✓ FirebaseService conditional write primitive using `If-Match`

✓ HTTP 412 conflicts exposed as retryable results

✓ AttendanceRepository versioned Room Stock read and conditional-write boundaries

✓ AttendanceService ETag compare-and-retry with six-attempt default

✓ Conflict retry recalculates against the newest Room Stock value

✓ Negative Room Stock remains visible and is not silently clamped

✓ Attendance-first save order preserved

✓ Partial Attendance save converts to persistent Room Stock adjustment retry

✓ Persistent `attendanceAudit` queue recovery implemented

✓ Successful Room Stock changes are not repeated during audit-only retry

✓ Sequential replay and original attendance baseline rules remain protected

✓ Main Stock remains unchanged in Attendance and Sync flows

✓ Deterministic concurrency test: `tests/cutover-concurrency-check.mjs`

✓ Persistent audit recovery test: `tests/audit-recovery-check.mjs`

✓ All 12 runtime/regression tests passed locally on 2026-07-28 before the latest documentation-only commits

---

Sprint 4.0 Browser Evidence

✓ Desktop Chrome Admin login

✓ Desktop Chrome Teacher login

✓ Direct Logout restored the login form and cleared the active UI session

✓ Login form after Logout displayed the 83-room connection status

✓ Firebase `settings.json` and `rooms.json` returned HTTP 200

✓ No failed Fetch/XHR request visible in supplied captures

✓ Sprint 4.0 shell text displayed correctly

✓ Teacher-session Console displayed only `MilkSchoolSystem V2 Started`

✓ Post-Logout Console displayed only `MilkSchoolSystem V2 Started`

✓ Browser device toolbar recorded at 820 x 1180 CSS pixels

✓ Login panel remained inside the emulated viewport without visible horizontal overflow

✓ Room selector, password field, login button, reload button, and room status remained visible

✓ Emulated viewport Console showed no visible application error

---

Sprint 4.0 Documentation and Decisions

✓ Sprint plan: `docs/SPRINT_4_0_PLAN.md`

✓ Parity matrix: `docs/CUTOVER_PARITY_MATRIX.md`

✓ Readiness report: `docs/CUTOVER_READINESS_REPORT.md`

✓ Explicit decision register: `docs/CUTOVER_DECISIONS.md`

✓ Operational Teacher UI plan: `docs/TEACHER_UI_INTEGRATION_PLAN.md`

✓ Production backup and rollback plan: `docs/PRODUCTION_ROLLBACK_PLAN.md`

✓ Documentation protection test: `tests/cutover-documentation-check.mjs`

✓ Every production BLOCKED/DEFERRED category now has an explicit decision and owner consequence

✓ Report browser-local adapter deferred to an operational Admin/report UI sprint

✓ XLSX binary parser retained in the legacy operational flow; V2 keeps the parsed-sheet boundary

✓ Operational Admin and Teacher UIs deferred to dedicated integration sprints

✓ Real Firebase multi-writer validation restricted to an isolated environment

✓ Real legacy queue sample must not be fabricated and remains pending until supplied

✓ Rollback plan complete as documentation; export/restore rehearsal remains pending before production

✓ Physical iPad validation explicitly deferred by the product owner

✓ Physical iPad validation is not required for feature-to-`develop` merge and is not PASS

---

Pending Final Sprint 4.0 Branch Gate

□ Pull the latest `feature/sprint-4.0-cutover-readiness`

□ Run all existing automated tests

□ Run `node tests/cutover-documentation-check.mjs`

□ Interact with the room selector and complete one Teacher login at 820 x 1180 in Chrome Device Toolbar

□ Press Logout at 820 x 1180 and confirm the login form returns without layout breakage

□ Confirm the Console remains clean

□ Confirm working tree clean

□ Close Sprint 4.0 documentation

□ Fast-forward merge Sprint 4.0 into `develop`

---

Production Work Explicitly Deferred or Blocked

- operational Admin forms are not integrated in V2
- operational Teacher forms, photos, signatures, printing, queue badge, and offline banner are not integrated
- Report browser-local adapter is not implemented
- XLSX binary parsing remains in the legacy operational flow
- real isolated Firebase multi-writer evidence is not recorded
- real sanitized legacy queue sample is not replayed
- Firebase backup export and isolated restore rehearsal are not recorded
- physical iPad evidence is deferred without final production risk acceptance
- explicit production approval is not granted

---

Merge Meaning

A Sprint 4.0 merge into `develop` preserves the modular foundation and readiness decisions for continued integration. It does not authorize a `main` merge, production traffic switch, Firebase schema change, database restore, or removal of `index.html` or `teacher.html`.

---

Protected Business Rules

- Main Stock decreases only on classroom distribution.
- Classroom distribution increases Room Stock.
- Teacher, Attendance, Pending, Retroactive, Vacation, and Sync operations change Room Stock only.
- Attendance edits change Room Stock by the difference only.
- Attendance deletion restores previously consumed Room Stock.
- ETag conflicts must read the latest Room Stock and recalculate before retry.
- Offline retries preserve the original attendance baseline.
- Audit-only retries must never repeat a successful Room Stock change.
- Reports remain read-only.
- Firebase paths and attendance keys remain compatible unless an approved migration includes rollback.
- Room IDs remain stable.
- Negative Room Stock is not silently clamped.
- Legacy files remain available until explicit cutover approval.
