# Sprint 3.9 — Performance and Payload Optimization Plan

Date: 2026-07-27

Branch: `feature/sprint-3.9-performance`

## Goal

Measure, verify, and reduce unnecessary Firebase requests and payloads in the modular V2 foundation without changing Firebase schema, stock calculations, authentication rules, queue semantics, or the protected operational legacy files.

## Protected Legacy Files

Do not modify:

- `index.html`
- `teacher.html`

## Primary Targets

- Teacher login request count
- Teacher login payload size
- room-scoped `mcAttendance` verification
- lazy loading of distributions, pending, retroactive, vacation, ledger, and stock history
- repeated refresh and cache behavior
- unnecessary duplicate requests
- browser startup dependency cost
- mobile and iPad compatibility
- legacy and V2 offline queue compatibility fixtures

## Measurement Rules

- Do not invent timing or payload numbers.
- Record only values produced by repeatable tests or browser Network/Performance tools.
- Separate static architecture checks from real browser measurements.
- Record test environment, browser, device class, and dataset assumptions.
- Do not claim production improvement until the same scenario is measured before and after.

## Planned Files

Required:

- `tests/performance-module-check.mjs`
- `docs/PERFORMANCE_AUDIT_REPORT.md`

Optional only when justified by measured duplication or missing instrumentation:

- `modules/performance/performanceMonitor.js`
- `modules/services/performanceService.js`

Do not create a new runtime module merely to satisfy the Sprint structure. Prefer tests and documentation when existing module boundaries already support the required behavior.

## Audit Areas

### FirebaseService

- verify query encoding does not create duplicate URLs
- verify cache-control behavior remains appropriate
- inspect request timeout and error paths
- identify repeated reads with identical path and query parameters

### Login and Teacher Loading

- login loads only settings and rooms required for authentication
- teacher snapshot loads only authenticated-room attendance
- all-school `mcAttendance` download is prohibited
- nonessential teacher collections remain lazy

### Report and Room Loading

- reports remain read-only
- report refresh does not multiply Firebase reads unnecessarily
- room list reuse and cache boundaries are explicit

### Offline Queue and Sync

- queue reads and writes avoid unnecessary serialization churn
- periodic flush does not run overlapping requests
- offline entries remain compatible with legacy `rec` and `diff` fields
- queue performance changes must preserve `baselinePresent`

## Compatibility Fixtures

Create representative fixtures for:

- legacy attendance queue entry using `rec`
- V2 attendance queue entry using `record`
- legacy Room Stock adjustment using `diff`
- V2 Room Stock adjustment using `difference`
- repeated edits for the same attendance key
- mixed valid and corrupt queue entries

## Browser Validation Matrix

Required:

- Chrome desktop
- responsive mobile viewport
- iPad-class viewport or physical iPad when available

Verify:

- login remains responsive
- room list loads
- Admin and Teacher login work
- Logout works
- Console remains clean
- no all-school attendance request appears in Teacher flow
- queue and retry timers do not overlap

## Test Gate

- all previous module tests pass
- performance architecture checks pass
- identical request deduplication assumptions are tested where implemented
- room-scoped query tests pass
- lazy-loading boundaries are checked statically
- queue compatibility fixtures pass
- browser smoke test passes
- Network inspection confirms no all-school attendance read in Teacher flow
- working tree clean

## Merge Gate

Merge into `develop` only after automated checks, browser validation, and documented measurements pass. Legacy files must remain unchanged.
