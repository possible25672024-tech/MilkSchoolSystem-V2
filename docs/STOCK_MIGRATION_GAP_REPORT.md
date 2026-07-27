# Stock Migration Gap Report

Date: 2026-07-27

Branch: `feature/sprint-3.4.3-stock`

## Scope

This report compares the legacy two-layer stock implementation with the new V2 Stock Repository, Service, and Manager boundaries. Sprint 3.4.3 migrates behavior only. It does not replace `index.html` or `teacher.html`.

## Confirmed Legacy Business Rules

### Main Stock

- Receiving milk increases Main Stock.
- Main Stock is calculated from `receives.total`.
- Distributing milk to a classroom decreases Main Stock.
- Main Stock is rebuilt as total receives minus total classroom distributions.
- Attendance, pending milk, retroactive milk, and vacation milk must not change Main Stock.

### Room Stock

- Classroom distribution increases Room Stock.
- Attendance decreases Room Stock by the number of `present` students.
- Pending milk decreases Room Stock by `totalBoxes` or the equivalent local record quantity.
- Retroactive milk decreases Room Stock by `totalBoxes` or the equivalent local record quantity.
- Vacation milk decreases Room Stock by `totalBoxes` or the equivalent local record quantity.
- Deleting teacher-side records restores Room Stock through a `ROLLBACK` ledger entry.

## Confirmed Firebase Paths

All V2 repository paths remain under `milkApp`:

- `milkApp/stock`
- `milkApp/roomStock/{roomId}`
- `milkApp/rooms`
- `milkApp/receives`
- `milkApp/distributes`
- `milkApp/mcAttendance`
- `milkApp/absentMilk`
- `milkApp/retroMilk`
- `milkApp/vacationMilk`
- `milkApp/stockTransactions`

## Implemented in Sprint 3.4.3

### StockRepository

- Owns all stock-related Firebase paths.
- Loads a complete stock snapshot.
- Supports one-room reads and writes.
- Supports Firebase multi-location PATCH updates.
- Contains no stock calculations.

### StockService

- Calculates receive totals using `crates × perCrate + extra`.
- Calculates classroom distribution using `students × days`.
- Rejects classroom distribution when Main Stock is insufficient.
- Transfers stock from Main Stock to Room Stock.
- Restricts teacher-side stock consumption to `ATTENDANCE`, `PENDING`, `RETRO`, and `VACATION`.
- Does not include `stock` in teacher-side Room Stock updates.
- Creates compatible ledger records.
- Rebuilds Main Stock and Room Stock from source transactions.
- Validates cached balances against calculated balances.

### StockManager

- Exposes UI-safe commands.
- Dispatches success and error events.
- Contains no Firebase calls or stock calculations.

## Known Migration Gaps

### 1. Dual Room Stock Representation

The legacy admin page keeps Room Stock in `db.rooms[].stock`, while the teacher page uses `milkApp/roomStock/{roomId}` as its real-time mirror. The V2 Stock Module treats `milkApp/roomStock` as the modular repository path. Synchronizing that value back into the legacy local `db.rooms[].stock` remains the responsibility of the legacy page until Sprint 4 replaces it.

### 2. Admin Local Records and Teacher Cloud Records

The legacy admin page may also contain locally stored pending, retroactive, and vacation records:

- pending records in the stored-milk local database
- retroactive records in the backdate local database
- vacation records in the vacation local database

Teacher-side records are stored in Firebase as `absentMilk`, `retroMilk`, and `vacationMilk`. The V2 calculation API accepts optional `localPending`, `localRetro`, and `localVacation` collections so callers can combine both sources during a migration or validation run. The current repository snapshot loads the Firebase sources only.

### 3. Attendance Key Parsing

Attendance records use keys in the form `{roomId}_{YYYY-MM-DD}`. Room identifiers may contain underscores, so the V2 service removes only the final date suffix rather than splitting at the first underscore.

### 4. Multi-location PATCH Is Not an ETag Transaction

Classroom distribution writes Main Stock, Room Stock, the distribution record, and the ledger in one Firebase multi-location PATCH. This avoids partial writes within one request, but it does not prevent two clients from reading the same balance and writing concurrently. Teacher legacy code already uses ETag compare-and-set for Room Stock. A shared transaction/ETag strategy for all V2 stock commands remains a future sync-hardening task.

### 5. Negative Room Stock Compatibility

Legacy teacher operations subtract from Room Stock without blocking negative balances. Sprint 3.4.3 preserves that behavior to avoid changing business rules. Validation and reporting must surface negative balances clearly. A policy change must be handled in a future feature Sprint, not during migration.

### 6. Media and IndexedDB

Legacy receive and distribution records can contain photos and signatures that are offloaded into IndexedDB. Sprint 3.4.3 accepts record metadata supplied by a caller but does not migrate the media offloading pipeline. That pipeline stays in legacy code until the corresponding storage migration.

### 7. Edit Differential Workflow

The legacy admin page adjusts Main Stock and Room Stock by the difference when a distribution record is edited. Sprint 3.4.3 currently provides create, consume, rollback, rebuild, and validate operations. The edit-differential command must be added before the V2 UI replaces the legacy distribution-edit screen.

### 8. Legacy UI Not Yet Connected

`index.html` and `teacher.html` remain unchanged. `index-v2.html` loads the Stock Module in dependency order, but it does not yet expose stock screens. UI migration is a later stage.

## Merge Gate

Before merging into `develop`:

1. Run `node tests/login-foundation-check.mjs`.
2. Run `node tests/stock-module-check.mjs`.
3. Open `index-v2.html` through Live Server.
4. Confirm Admin and Teacher login still work.
5. Confirm no Console syntax or missing-module errors.
6. Confirm branch diff does not include `index.html` or `teacher.html`.

## Next Recommended Work

After the Sprint 3.4.3 checks pass:

- add the distribution edit-differential command
- decide the V2 concurrency strategy for Main Stock and Room Stock
- connect a read-only stock summary to `index-v2.html`
- then close Sprint 3.4.3 and begin Sprint 3.4.4 Report Module
