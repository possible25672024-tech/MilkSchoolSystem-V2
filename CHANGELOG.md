# Changelog

All notable modular migration changes are recorded here.

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
