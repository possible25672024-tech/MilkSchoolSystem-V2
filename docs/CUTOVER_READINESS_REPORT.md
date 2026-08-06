# MilkSchoolSystem V2 — Cutover Readiness Report

Date started: 2026-07-28

Last updated: 2026-08-01

Current readiness branch: `feature/sprint-6.4-firebase-auth-rules-uat`

Overall status: NOT READY FOR PRODUCTION CUTOVER

## Sprint 6.4 Security Update

Firebase Email/Password ID-token authentication, UID authorization profiles,
room-scoped Teacher queries, deny-by-default active Rules, and freeze-writes
rollback Rules are now implemented. Automated regression passes 100/100.

This does not authorize deployment. Official Rules Emulator execution, a real
isolated Firebase project rehearsal, Live Browser evidence, the quarantined
room/date disposition, and explicit Production approval remain open. No Rules
or application deployment was performed.

Develop integration status: READY — ALL SPRINT 4.0 BRANCH GATES PASSED

## Executive Summary

The modular V2 foundation passed the complete Sprint 4.0 automated, browser, responsive, documentation, and clean-working-tree gates. Desktop Chrome and the 820 x 1180 browser-emulated viewport confirm Admin login, Teacher login, Logout, current shell text, visible room identity, and a clean Console for the tested V2 shell workflow.

Sprint 4.0 also resolves the measured Room Stock concurrency and recovery gaps at the modular foundation level through Firebase ETag reads, `If-Match` conditional writes, HTTP 412 retries, latest-value recalculation, partial Attendance-save recovery, persistent Room Stock-only retry, and persistent audit-only retry.

Physical iPad testing was explicitly deferred by the product owner. It is not required for the Sprint 4.0 merge to `develop`, and it is not represented as PASS.

Production cutover remains blocked because V2 does not yet provide the complete operational Admin and Teacher interfaces, Report browser-local adapter, V2 XLSX binary parsing, real isolated Firebase multi-writer evidence, real sanitized legacy queue evidence, backup/restore rehearsal, physical-device evidence or risk acceptance, and explicit production approval.

Legacy `index.html` and `teacher.html` remain the operational and rollback paths.

## Automated Evidence

Verified locally by the user on 2026-07-28:

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
- Cutover documentation checks passed
- feature branch synchronized with origin
- Git working tree clean

## Desktop Browser Evidence

Environment:

- Browser: Chrome desktop
- Host: Live Server at `127.0.0.1:5500/index-v2.html`
- Date observed: 2026-07-28
- Dataset: current connected Firebase database

### Admin Login

Result: PASS

Observed:

- successful Admin session
- school name displayed
- Sprint 4.0 shell text displayed
- Firebase `settings.json` returned HTTP 200
- Firebase `rooms.json` returned HTTP 200
- no failed Fetch/XHR request visible

### Teacher Login

Result: PASS

Observed:

- successful Teacher session
- room and teacher identity displayed
- Sprint 4.0 shell text displayed
- no failed Fetch/XHR request visible
- clean Console in the recorded Teacher session

### Logout

Result: PASS

Observed:

- successful-login panel replaced by the login form
- room/role selector returned to its unselected state
- password field returned empty
- connection status reported 83 rooms
- no failed Fetch/XHR request visible
- post-Logout Console displayed only `MilkSchoolSystem V2 Started`

## Responsive Browser Evidence

### 820 x 1180 Browser-Emulated Viewport

Status: PASS FOR THE CURRENT V2 SHELL WORKFLOW

Observed:

- login panel remained within the viewport
- no abnormal horizontal overflow was visible
- room selector, password field, login button, reload button, and room status remained visible
- room selector was usable
- Teacher login completed successfully
- successful-login panel remained contained
- room and teacher identity displayed correctly
- Logout completed successfully
- login form returned without layout breakage
- room/role selector reset after Logout
- Console displayed only `MilkSchoolSystem V2 Started`
- no visible application error before or after Logout

A narrower phone viewport remains optional unless phone support becomes an explicit production requirement.

### Physical iPad

Status: DEFERRED BY PRODUCT OWNER

Decision:

- not required for Sprint 4.0 feature-to-`develop` integration
- not a PASS result
- no claim is made for physical Safari storage, touch behavior, reconnect behavior, photos, or signatures
- production approval requires later physical-device evidence or explicit risk acceptance

## Data and Concurrency Readiness

Implemented and deterministically tested:

- Firebase ETag reads
- `If-Match` conditional Room Stock writes
- retry after HTTP 412 conflict
- recalculation from the latest Room Stock value
- Attendance-first partial-save recovery
- conversion to Room Stock-only queue retry
- persistent audit-only recovery
- no repeated Room Stock mutation during audit recovery
- no Main Stock mutation from Attendance or Sync
- no silent negative Room Stock clamp

Real Firebase multi-writer validation must be performed only in an isolated Firebase environment or disposable test path. It remains a production-confidence requirement, not a Sprint 4.0 `develop` integration requirement.

## Explicit Cutover Decisions

`docs/CUTOVER_DECISIONS.md` records:

- physical iPad validation deferred
- Report browser-local adapter deferred to an operational Admin/report UI sprint
- XLSX binary parser retained in the protected legacy flow
- operational Admin and Teacher interfaces deferred to dedicated integration sprints
- real Firebase concurrency validation restricted to an isolated environment
- real legacy queue sample required when available and must not be fabricated
- backup and restore rehearsal required before production

## Operational UI Planning

`docs/TEACHER_UI_INTEGRATION_PLAN.md` defines the phased replacement sequence for:

- Teacher session shell and Room Stock display
- Attendance CRUD
- partial-save and ETag conflict feedback
- offline queue badge and banner
- pending, retroactive, and vacation milk
- photos and signatures
- history and printing

Sprint 4.1 begins with the read-only Teacher shell and does not claim operational Attendance replacement.

## Backup and Rollback Readiness

`docs/PRODUCTION_ROLLBACK_PLAN.md` defines:

- approval responsibilities
- source and deployment snapshots
- Firebase export verification
- business baseline recording
- browser queue considerations
- isolated restore rehearsal
- deployment and smoke tests
- rollback triggers
- application-first rollback
- data recovery decision paths
- post-rollback verification

Plan status: COMPLETE AS DOCUMENTATION

Execution status: NOT REHEARSED

## Develop Integration Decision

Result: APPROVED

All Sprint 4.0 branch gates passed. A fast-forward merge into `develop` is authorized.

This decision does not authorize:

- merge or deployment to `main`
- production traffic switching
- Firebase schema changes
- database restore
- deletion, rename, or replacement of `index.html`
- deletion, rename, or replacement of `teacher.html`

## Remaining Production Blockers

- operational Admin forms not integrated in V2
- operational Teacher workflows not integrated in V2
- photos and signatures not integrated
- queue badge and offline banner not integrated
- Report browser-local adapter not implemented
- XLSX parser remains in the protected legacy flow
- isolated real Firebase multi-writer evidence not recorded
- real sanitized legacy queue sample not replayed
- Firebase backup export and isolated restore rehearsal incomplete
- physical iPad evidence deferred without production risk acceptance
- explicit production approval not granted

## Decision

Sprint 4.0 is complete and approved for integration into `develop`. Production cutover remains BLOCKED. No `main` merge, production traffic switch, database restore, Firebase schema migration, or legacy-file removal is authorized.
