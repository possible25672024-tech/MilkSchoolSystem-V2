# MilkSchoolSystem V2 — Cutover Readiness Report

Date started: 2026-07-28

Branch: `feature/sprint-4.0-cutover-readiness`

Overall status: NOT READY FOR PRODUCTION CUTOVER

## Executive Summary

The modular V2 foundation now passes all automated regression, concurrency, and audit-recovery tests available in the repository. Desktop Chrome evidence confirms successful Admin and Teacher login against the current Firebase dataset. Production cutover remains blocked by device evidence, operational UI parity, real multi-writer Firebase validation, report/local-data decisions, XLSX import, backup/restore rehearsal, and rollback approval.

Legacy `index.html` and `teacher.html` remain the operational rollback path.

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
- Git working tree clean
- Local branch synchronized with `origin/feature/sprint-4.0-cutover-readiness`

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
- Firebase `settings.json` returned HTTP 200
- Firebase `rooms.json` returned HTTP 200
- no failed Fetch/XHR request visible in the supplied capture

### Teacher Login

Result: PASS

Observed:

- successful Teacher session
- room and teacher identity displayed
- Firebase `settings.json` returned HTTP 200
- Firebase `rooms.json` returned HTTP 200
- no failed Fetch/XHR request visible in the supplied capture

The second capture contains two `settings.json` and two `rooms.json` requests because the Network panel contains the Admin and Teacher login sequence together. This is not evidence of duplicate reads inside one credential validation attempt.

### Logout

Result: PARTIAL EVIDENCE

The Admin-to-Teacher sequence is consistent with a logout and second login, but the supplied images do not directly show the login screen after pressing Logout. A direct logout capture or final confirmation remains required for the Sprint browser record.

### Browser Console

Result: PENDING

The supplied images show the Network panel, not the Console panel. A clean Console capture remains required.

## Shell Status Correction

The browser evidence exposed stale user-visible text that still identified Sprint 3.9. The V2 shell has been updated to display:

`Sprint 4.0 Cutover Readiness and Compatibility`

The Performance static test was updated to protect the current shell status.

## Responsive and Device Evidence

### Responsive Mobile Viewport

Status: BLOCKED

Required evidence:

- login panel at a narrow mobile viewport
- room selector interaction
- Admin and Teacher login
- Logout
- no abnormal horizontal scrolling
- clean Console

### iPad-Class Viewport

Status: BLOCKED

Required viewport evidence:

- approximately 820 x 1180 CSS pixels
- login form layout
- room selector interaction
- button interaction
- successful Teacher login
- Logout
- clean Console

### Physical iPad

Status: BLOCKED

Physical-device validation remains required when the device is available, especially for touch, Local Storage persistence, reconnect behavior, photos, and signatures.

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

Still required:

- real Firebase multi-writer conflict validation
- actual legacy-produced queue fixture replay
- browser/device offline and reconnect evidence

## Remaining Production Blockers

- operational Admin forms not integrated in V2
- operational Teacher forms not integrated in V2
- photos and signatures not integrated
- queue badge and offline banner not integrated
- report browser-local adapter unresolved
- XLSX parser remains legacy
- backup and isolated restore rehearsal incomplete
- production rollback plan incomplete
- responsive and physical iPad evidence incomplete
- explicit cutover approval not granted

## Decision

Production cutover remains BLOCKED. Sprint 4.0 may continue on its feature branch. No merge to `main`, production traffic switch, or legacy-file removal is authorized.
