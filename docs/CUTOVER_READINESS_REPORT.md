# MilkSchoolSystem V2 — Cutover Readiness Report

Date started: 2026-07-28

Last updated: 2026-07-28

Branch: `feature/sprint-4.0-cutover-readiness`

Overall status: NOT READY FOR PRODUCTION CUTOVER

Develop integration status: READY PENDING FINAL AUTOMATED AND CLEAN-BRANCH GATE

## Executive Summary

The modular V2 foundation passes all automated regression, concurrency, and audit-recovery tests previously run by the user. Desktop Chrome evidence confirms successful Admin and Teacher login against the current Firebase dataset, direct Logout back to the login form, the corrected Sprint 4.0 shell text, and clean Teacher-session and post-Logout Console captures.

Browser device-toolbar evidence at 820 x 1180 CSS pixels now confirms the complete responsive shell workflow: the login form remains contained, the room selector is usable, Teacher login succeeds, the successful-login panel remains contained, Logout succeeds, the login form returns without layout breakage, and the Console remains clean.

Physical iPad testing was explicitly deferred by the user/product owner on 2026-07-28. It is removed from the Sprint 4.0 feature-to-`develop` merge gate, but it is not recorded as PASS. A later production decision must either add physical-device evidence or explicitly accept the remaining device risk.

Sprint 4.0 includes:

- an explicit decision register for every unresolved production category;
- an operational Teacher UI integration plan;
- a complete production backup and rollback procedure;
- a static documentation test protecting those decisions.

Production cutover remains blocked by operational UI parity, isolated real Firebase multi-writer validation, report/local-data adapter implementation, V2 XLSX import, backup/restore rehearsal, and explicit production approval.

Legacy `index.html` and `teacher.html` remain the operational rollback path.

## Automated Evidence

Verified locally by the user on 2026-07-28 before the latest documentation-only commits:

- Login foundation checks passed
- Stock module checks passed
- Report module checks passed
- Room module checks passed
- Teacher module checks passed
- Attendance module checks passed
- Sync module checks passed
- Firebase request header checks passed
- Performance module checks passed
- Teacher core payload checks passed
- Cutover concurrency checks passed
- Audit recovery checks passed
- Git working tree clean
- Local branch synchronized with `origin/feature/sprint-4.0-cutover-readiness`

Latest documentation gate added after that run:

- `tests/cutover-documentation-check.mjs`

All tests, including the new documentation gate, must pass locally before Sprint closeout.

## Desktop Browser Evidence

Environment recorded from user screenshots:

- Browser: Chrome desktop
- Host: Live Server at `127.0.0.1:5500/index-v2.html`
- Date observed: 2026-07-28
- Dataset: current connected Firebase database

### Admin Login

Result: PASS

Observed:

- successful Admin session
- school name displayed
- corrected Sprint 4.0 shell text displayed
- Firebase `settings.json` returned HTTP 200
- Firebase `rooms.json` returned HTTP 200
- no failed Fetch/XHR request visible in the supplied capture

### Teacher Login

Result: PASS

Observed:

- successful Teacher session
- room and teacher identity displayed
- corrected Sprint 4.0 shell text displayed
- Firebase `settings.json` and `rooms.json` were verified in the login sequence
- no failed Fetch/XHR request visible in the supplied captures

### Logout

Result: PASS

Observed in the supplied direct Logout capture:

- active successful-login panel was replaced by the login form
- room/role selector returned to its unselected state
- password field returned empty
- connection status reported 83 rooms available
- Firebase `settings.json` and `rooms.json` were visible with HTTP 200
- no failed Fetch/XHR request was visible

This confirms that Logout clears the active UI session and returns the user to the login workflow.

### Browser Console

Result: PASS FOR RECORDED DESKTOP FLOW

Observed:

- Teacher-session Console displayed only `MilkSchoolSystem V2 Started`
- post-Logout Console displayed only `MilkSchoolSystem V2 Started`
- no visible JavaScript error
- no visible application warning
- Admin login followed by Logout completed without a visible application error in the supplied sequence

## Responsive and Device Evidence

### 820 × 1180 Browser-Emulated Viewport

Status: PASS FOR THE CURRENT V2 SHELL WORKFLOW

Recorded evidence:

- browser device toolbar configured to 820 x 1180 CSS pixels
- login panel remains inside the viewport
- no abnormal horizontal overflow is visible
- room selector remains visible and was used for Teacher login
- password field remains visible
- login and reload buttons remain visible
- 83-room connection status remains visible
- Teacher login completed successfully
- successful-login panel remained contained inside the viewport
- room and teacher identity displayed correctly after login
- Sprint 4.0 shell text remained visible
- Logout completed successfully
- login form returned without layout breakage
- room/role selector returned to the unselected state after Logout
- Console displayed only `MilkSchoolSystem V2 Started`
- no visible application error before or after Logout

A narrower mobile-phone viewport remains optional unless mobile-phone support becomes an explicit production requirement.

### Physical iPad

Status: DEFERRED BY PRODUCT OWNER

Decision recorded on 2026-07-28:

- physical iPad testing is skipped for the current Sprint 4.0 feature-to-`develop` merge gate
- the deferred result must not be reported as PASS
- no physical-device claim is made for touch behavior, Local Storage persistence, reconnect behavior, photos, or signatures
- before production approval, the project must either collect physical-device evidence or explicitly accept the remaining device risk

## Data and Concurrency Readiness

Implemented and covered by deterministic tests:

- Firebase ETag reads
- `If-Match` conditional Room Stock writes
- retry after HTTP 412 conflict
- recalculation from latest Room Stock
- attendance-first partial-save recovery
- conversion to stock-only queue retry
- persistent audit-only recovery
- no Main Stock mutation from Attendance or Sync
- no silent negative Room Stock clamp

Decision for real Firebase validation:

- do not intentionally create concurrent writes against production classroom stock;
- run the exercise only on an isolated Firebase environment or disposable test path;
- deterministic coverage is sufficient for `develop` integration, while production confidence remains explicitly blocked until real isolated evidence exists.

## Explicit Cutover Decisions

The decision register `docs/CUTOVER_DECISIONS.md` records:

- physical iPad validation deferred;
- report browser-local adapter deferred to the operational Admin/report UI sprint;
- XLSX binary parsing retained in the legacy flow while `RoomService` keeps the parsed-sheet boundary;
- Admin and Teacher operational UIs deferred to dedicated integration sprints;
- real Firebase multi-writer validation restricted to an isolated environment;
- a real sanitized legacy queue sample required when available;
- backup/restore rehearsal required before production.

These decisions allow foundation work to merge to `develop` while keeping production cutover blocked.

## Operational UI Readiness

`docs/TEACHER_UI_INTEGRATION_PLAN.md` defines the replacement sequence for:

- Teacher session header and Room Stock display
- Attendance create/edit/delete
- partial-save and ETag conflict feedback
- offline queue badge and banner
- pending, retroactive, and vacation milk
- photos and signatures
- history and printing
- parity, browser, and device gates

No operational Teacher screen is claimed complete in Sprint 4.0.

## Backup and Rollback Readiness

`docs/PRODUCTION_ROLLBACK_PLAN.md` defines:

- role and approval responsibilities
- source/deployment snapshot
- Firebase export verification
- business baseline recording
- browser queue considerations
- isolated restore rehearsal
- deployment and smoke-test sequence
- rollback triggers
- application-first rollback
- data recovery decision paths
- post-rollback verification

Plan status: COMPLETE AS DOCUMENTATION

Execution status: NOT REHEARSED

Production cutover remains blocked until export verification and isolated restore rehearsal are recorded.

## Remaining Sprint 4.0 Branch Gate

Before merge to `develop`:

- pull the latest branch
- run all existing automated tests
- run `node tests/cutover-documentation-check.mjs`
- confirm working tree clean
- close Sprint 4.0 documentation
- fast-forward merge into `develop`

## Remaining Production Blockers

- operational Admin forms not integrated in V2
- operational Teacher forms not integrated in V2
- photos and signatures not integrated
- queue badge and offline banner not integrated
- report browser-local adapter not implemented
- XLSX parser remains in the legacy operational flow
- real isolated Firebase multi-writer validation not recorded
- real sanitized legacy queue sample not replayed
- backup and isolated restore rehearsal incomplete
- physical iPad evidence deferred without final production risk acceptance
- explicit cutover approval not granted

## Decision

Production cutover remains BLOCKED. Sprint 4.0 is ready for final automated and clean-branch validation before merge to `develop`. No merge to `main`, production traffic switch, Firebase schema change, database restore, or legacy-file removal is authorized.
