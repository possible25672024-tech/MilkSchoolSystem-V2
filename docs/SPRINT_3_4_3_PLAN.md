# Sprint 3.4.3 — Stock Module Migration Plan

Date: 2026-07-27

Branch: `feature/sprint-3.4.3-stock`

## Sprint Goal

Migrate the existing two-layer milk stock rules from the legacy implementation into the V2 modular architecture without changing behavior or legacy data paths.

## Protected Business Rules

1. Main Stock increases only from milk receiving transactions.
2. Main Stock decreases only when milk is distributed to a classroom.
3. Classroom distribution transfers quantity from Main Stock to Room Stock.
4. Teacher attendance, pending milk, retroactive milk, and vacation milk decrease Room Stock only.
5. Deleting or rolling back a transaction restores the same stock layer that the original transaction changed.
6. Rebuild operations calculate stock from source transactions rather than from cached balances.
7. Negative stock is rejected unless the legacy workflow explicitly permits it.
8. Firebase paths remain under `milkApp` and stay compatible with `index.html` and `teacher.html`.

## Target Architecture

`UI → StockManager → StockService → StockRepository → FirebaseService → Realtime Database`

## Target Files

- `modules/repositories/stockRepository.js`
- `modules/services/stockService.js`
- `modules/stock/stockManager.js`
- `tests/stock-module-check.mjs`
- `docs/STOCK_MIGRATION_GAP_REPORT.md`

## Implementation Stages

### Stage A — Repository

- Read main stock.
- Read and write one room stock value.
- Read rooms, receives, distributions, attendance, pending, retroactive, vacation, and ledger paths.
- Write multi-location updates through one repository boundary.

### Stage B — Service

- Normalize numeric values.
- Validate positive quantities and required identifiers.
- Calculate receive and distribute totals.
- Apply Main Stock and Room Stock deltas.
- Rebuild Main Stock from receives minus classroom distributions.
- Rebuild Room Stock from classroom distributions minus teacher operations.
- Produce validation reports without changing data.

### Stage C — Manager

- Expose UI-safe commands.
- Hold no Firebase queries or stock calculations.
- Dispatch result events for future V2 UI integration.

### Stage D — Validation

- Static architecture checks.
- Pure calculation tests.
- Main Stock isolation tests.
- Room Stock isolation tests.
- Rollback symmetry tests.
- Legacy files remain unchanged.

## Commit Gate

Code will be committed in focused groups on the feature branch. The branch will not be merged into `develop` until local static tests and browser smoke tests pass.
