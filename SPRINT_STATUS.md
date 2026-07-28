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

100% — automated regression, ETag concurrency, partial-save recovery, audit-only recovery, desktop Admin and Teacher login, direct Logout, clean Console evidence, Network evidence, complete 820 x 1180 responsive Teacher login/Logout evidence, cutover decisions, Teacher UI integration planning, rollback planning, documentation gate, and clean working-tree gate all passed; Sprint 4.0 is approved for fast-forward integration into `develop` while production cutover remains explicitly blocked

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

---

Sprint 4.0 Runtime and Recovery Foundation

✓ FirebaseService ETag read using `X-Firebase-ETag: true`

✓ FirebaseService conditional write using `If-Match`

✓ HTTP 412 conflict surfaced as retryable state

✓ AttendanceRepository versioned Room Stock boundary

✓ AttendanceService ETag compare-and-retry with latest-value recalculation

✓ Attendance-first save order retained

✓ Partial Attendance save converts to persistent Room Stock-only retry

✓ Persistent `attendanceAudit` recovery queue

✓ Audit-only retry never repeats a successful Room Stock change

✓ Sequential queue replay and original attendance baseline remain protected

✓ Main Stock remains unchanged in Attendance and Sync workflows

✓ Negative Room Stock remains visible and is not silently clamped

---

Sprint 4.0 Automated Gate

✓ Login foundation checks passed

✓ Stock module checks passed

✓ Report module checks passed

✓ Room module checks passed

✓ Teacher module checks passed

✓ Attendance module checks passed

✓ Sync module checks passed

✓ Firebase request header checks passed

✓ Performance module checks passed

✓ Teacher core payload checks passed

✓ Cutover concurrency checks passed

✓ Audit recovery checks passed

✓ Cutover documentation checks passed

✓ Feature branch synchronized with origin

✓ Working tree clean

---

Sprint 4.0 Browser and Responsive Gate

✓ Desktop Chrome Admin login

✓ Desktop Chrome Teacher login

✓ Direct Logout returned to the login form and cleared the active UI session

✓ Firebase `settings.json` and `rooms.json` returned HTTP 200

✓ No failed Fetch/XHR request visible in supplied captures

✓ Sprint 4.0 shell text displayed correctly

✓ Teacher-session and post-Logout Console showed only `MilkSchoolSystem V2 Started`

✓ Browser Device Toolbar recorded at 820 x 1180 CSS pixels

✓ Responsive login form remained contained without horizontal overflow

✓ Responsive Teacher login succeeded and displayed the correct room/teacher identity

✓ Responsive Logout returned to the login form without layout breakage

✓ Responsive Console remained clean before and after Logout

✓ Physical iPad validation explicitly deferred by the product owner and not represented as PASS

---

Sprint 4.0 Documentation and Decisions

✓ `docs/SPRINT_4_0_PLAN.md`

✓ `docs/CUTOVER_PARITY_MATRIX.md`

✓ `docs/CUTOVER_READINESS_REPORT.md`

✓ `docs/CUTOVER_DECISIONS.md`

✓ `docs/TEACHER_UI_INTEGRATION_PLAN.md`

✓ `docs/PRODUCTION_ROLLBACK_PLAN.md`

✓ Every remaining production blocker has an explicit owner and production consequence

✓ Report browser-local adapter deferred to an operational Admin/report UI sprint

✓ XLSX binary parsing retained in the protected legacy Admin flow

✓ Operational Admin and Teacher interfaces deferred to dedicated integration sprints

✓ Real Firebase multi-writer validation restricted to an isolated environment

✓ Real legacy queue sample must not be fabricated and remains pending until supplied

✓ Backup and rollback plan complete as documentation; rehearsal remains required before production

---

Develop Integration Decision

APPROVED

A fast-forward merge into `develop` is authorized because all Sprint 4.0 branch gates passed. This integration preserves the modular safety foundation and the readiness record for continued development.

It does not authorize:

- merge or deployment to `main`
- production traffic switching
- Firebase schema changes
- database restore
- removal, rename, or replacement of `index.html`
- removal, rename, or replacement of `teacher.html`

---

Production Work Explicitly Deferred or Blocked

- operational Admin forms are not integrated in V2
- operational Teacher attendance, pending, retroactive, vacation, media, signature, print, queue-badge, and offline-banner screens are not integrated
- Report browser-local adapter is not implemented
- XLSX binary parsing remains in the protected legacy flow
- real isolated Firebase multi-writer evidence is not recorded
- real sanitized legacy queue sample is not replayed
- Firebase export verification and isolated restore rehearsal are not recorded
- physical iPad evidence is deferred without final production risk acceptance
- explicit production approval is not granted

---

Next Sprint

Sprint 4.1 — Teacher UI Shell and Read-Only State

Planned branch:

`feature/sprint-4.1-teacher-ui-shell`

Initial scope:

- Teacher session header
- school, room, and teacher identity
- current Room Stock display
- connection state
- pending queue count
- Logout
- responsive desktop and 820 x 1180 shell gate
- no Attendance write UI yet
- no direct Firebase access from the view
- protected `teacher.html` remains operational

---

Protected Business Rules

- Main Stock decreases only on classroom distribution.
- Classroom distribution increases Room Stock.
- Teacher, Attendance, Pending, Retroactive, Vacation, and Sync operations change Room Stock only.
- Attendance edits change Room Stock by the difference only.
- Attendance deletion restores previously consumed Room Stock.
- ETag conflicts read the latest Room Stock and recalculate before retry.
- Offline retries preserve the original attendance baseline.
- Audit-only retries never repeat a successful Room Stock change.
- Reports remain read-only.
- Firebase paths and attendance keys remain compatible unless an approved migration includes rollback.
- Room IDs remain stable.
- Negative Room Stock is not silently clamped.
- Legacy files remain available until explicit production-cutover approval.
