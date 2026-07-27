# Changelog

All notable modular migration changes are recorded here.

## 2026-07-27 — Sprint 3.4.4 Report Module

### Added

- `modules/report/reportManager.js`
- `tests/report-module-check.mjs`
- `docs/SPRINT_3_4_4_PLAN.md`
- `docs/REPORT_MIGRATION_GAP_REPORT.md`

### Changed

- Expanded `modules/repositories/reportRepository.js` into a read-only Firebase report boundary.
- Expanded `modules/services/reportService.js` with classroom, grade-level, and whole-school aggregation.
- Added Thai grade normalization for dotted and non-dotted room names.
- Added distributed, attendance, pending, retroactive, vacation, remaining, and percentage-used totals.
- Added print and Excel export models.
- Added cached report view switching without additional Firebase reads.
- Loaded report modules in dependency order from `index-v2.html`.
- Corrected Node.js 24 tests for cross-VM object comparison and locale-dependent Thai sorting.

### Validation

- Login foundation static checks passed.
- Stock module static and business-rule checks passed.
- Report module architecture and aggregation checks passed.
- Admin login passed.
- Browser console clean.
- Working tree clean.
- `index.html` and `teacher.html` unchanged.

### Known Gap

- Browser-local pending, retroactive, and vacation collections still require a Storage/Sync adapter before the V2 report replaces the operational legacy report.

## 2026-07-27 — Sprint 3.4.3 Stock Module

### Added

- `modules/services/stockService.js`
- `modules/stock/stockManager.js`
- `tests/stock-module-check.mjs`
- `docs/SPRINT_3_4_3_PLAN.md`
- `docs/STOCK_MIGRATION_GAP_REPORT.md`

### Changed

- Expanded `modules/repositories/stockRepository.js` to own all stock-related Firebase paths and multi-location updates.
- Loaded stock modules in dependency order from `index-v2.html`.
- Added Main Stock receive and classroom distribution workflows.
- Added Room Stock consumption for attendance, pending, retroactive, and vacation operations.
- Added Room Stock rollback, stock rebuild, validation, and compatible stock ledger calculations.
- Updated Sprint and project documentation.
- Suppressed the unnecessary missing favicon request in the V2 shell.

### Validation

- Login foundation static checks passed.
- Stock module static and business-rule checks passed.
- Admin login passed.
- Teacher login passed.
- Logout passed.
- Browser console clean.
- Working tree clean.
- `index.html` and `teacher.html` unchanged.

## 2026-07-27 — Sprint 3.4.2 Recovery Foundation

### Added or Restored

- Runtime Firebase configuration.
- Firebase Realtime Database REST service.
- Repository foundation through `BaseRepository`.
- Admin and Teacher login flow.
- Compatible `milkApp_loginSession` session storage.
- V2 bootstrap and dependency order.
- Login foundation static tests.

### Validation

- Firebase room loading passed.
- Incorrect Admin and Teacher passwords rejected.
- Correct Admin and Teacher passwords accepted.
- Logout and session clearing passed.
