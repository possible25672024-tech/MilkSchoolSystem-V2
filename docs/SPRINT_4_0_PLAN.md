# Sprint 4.0 — Cutover Readiness and Compatibility Plan

Date: 2026-07-28

Branch: `feature/sprint-4.0-cutover-readiness`

## Goal

Prove that the modular V2 system is safe to prepare for production cutover without removing the operational legacy files. Close or explicitly block every remaining parity, device, concurrency, data compatibility, and rollback gap.

## Non-Goals

Sprint 4.0 does not:

- delete `index.html`
- delete `teacher.html`
- switch production traffic
- change Firebase schema without a separately approved migration and rollback plan
- change verified Main Stock or Room Stock calculations
- claim iPad or mobile compatibility without real validation evidence

## Protected Legacy Files

- `index.html`
- `teacher.html`

These files remain the rollback path until explicit production-cutover approval.

## Workstreams

### 1. Functional Parity Matrix

Compare legacy and V2 behavior for:

- Admin login and logout
- Teacher login and logout
- room management
- student import
- Main Stock receive
- classroom distribution
- Teacher attendance
- pending milk
- retroactive milk
- vacation milk
- Room Stock and Main Stock rebuild
- reports by classroom, grade, and school
- print and export
- backup and restore
- offline queue and retry
- photos and signatures
- queue badge and offline banner

Every row must be classified as:

- PASS
- PARTIAL
- BLOCKED
- NOT APPLICABLE

### 2. Device Validation

Required environments:

- Chrome desktop
- responsive mobile viewport
- iPad-class viewport
- physical iPad when available

Validate:

- login
- room list loading
- attendance form interaction
- Room Stock display
- offline queue persistence
- retry after reconnect
- photo/signature handling when operational UI is integrated
- console errors
- Network payloads

### 3. Legacy/V2 Queue Compatibility

Use representative queue entries written in legacy formats:

- attendance entry using `rec`
- Room Stock adjustment using `diff`
- repeated edits for one attendance key
- mixed valid and corrupt entries
- entries persisted across refresh and restart

Verify:

- normalization
- original `baselinePresent`
- original `queuedAt`
- sequential replay
- authenticated-room protection
- success removal
- failure retention

### 4. Room Stock Concurrency

The modular multi-location PATCH is atomic only for included paths. Sprint 4.0 must either:

- implement tested ETag compare-and-retry protection for Room Stock writes, or
- mark production cutover BLOCKED with a documented reason and rollback path

No silent negative-stock clamping is allowed.

### 5. Report Local-Data Adapter

Decide and test how pending, retroactive, and vacation data from browser-local legacy collections are supplied to the V2 report.

Requirements:

- report remains read-only
- totals match legacy formulas
- no duplicate counting between Firebase and local data
- migration path is documented

### 6. XLSX Import Decision

Choose one:

- migrate the binary parser into a V2 import adapter, or
- keep parsing in the legacy operational flow and mark V2 import PARTIAL

Room IDs and Room Stock links must remain stable.

### 7. Operational Teacher UI Integration Plan

Map these legacy features into V2:

- attendance forms
- pending milk
- retroactive milk
- vacation milk
- photos
- signatures
- printing
- queue badge
- offline banner

Do not remove the legacy UI until replacements pass parity and device gates.

### 8. Backup, Rollback, and Cutover

Create:

- data backup checklist
- Firebase export verification
- browser queue backup considerations
- deployment sequence
- smoke-test sequence
- rollback triggers
- rollback sequence
- responsibility and approval checklist

## Planned Files

- `docs/CUTOVER_PARITY_MATRIX.md`
- `docs/CUTOVER_READINESS_REPORT.md`
- `docs/PRODUCTION_ROLLBACK_PLAN.md`
- compatibility and concurrency tests under `tests/`
- runtime changes only when required to close a measured gap

## Automated Regression Gate

All existing tests remain mandatory:

```powershell
node tests/login-foundation-check.mjs
node tests/stock-module-check.mjs
node tests/report-module-check.mjs
node tests/room-module-check.mjs
node tests/teacher-module-check.mjs
node tests/attendance-module-check.mjs
node tests/sync-module-check.mjs
node tests/firebase-request-header-check.mjs
node tests/performance-module-check.mjs
node tests/teacher-core-payload-check.mjs
```

New compatibility and cutover tests must be added for every runtime change.

## Merge Gate

Sprint 4.0 may merge into `develop` when:

- the parity matrix is complete
- every BLOCKED item has an explicit production decision
- responsive and iPad-class checks are recorded
- physical iPad evidence is recorded when available
- queue compatibility passes
- concurrency is resolved or production cutover remains explicitly blocked
- rollback plan is complete
- all automated tests pass
- browser console is clean
- working tree is clean

Production deployment to `main` remains a separate explicit approval step.
