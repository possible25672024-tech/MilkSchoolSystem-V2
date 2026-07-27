# Report Migration Gap Report

Date: 2026-07-27

Sprint: 3.4.4

Branch: `feature/sprint-3.4.4-report`

## Scope

This report compares the legacy milk-distribution report with the modular V2 report boundary.

Protected files were inspected but not modified:

- `index.html`
- `teacher.html`

## Legacy Report Behavior Preserved

### Views

The report supports three views:

1. per classroom
2. by grade level
3. whole school

### Classroom Calculation

For each configured room:

`remaining = distributed - attendance - pending - retroactive - vacation`

Fields preserved:

- students
- distributed total
- attendance consumption
- pending milk consumption
- retroactive milk consumption
- vacation milk consumption
- remaining milk
- percentage used

### Percentage Used

`used = distributed - remaining`

`usedPercent = round(used / distributed × 100)`

When distributed is zero, the percentage is zero.

### Grade Parsing

The legacy parser accepts inconsistent Thai classroom names such as:

- `อ2-8แม่โขะ`
- `อ.2-7เกร๊ะคี`
- `ป2-2`
- `ป.2-1`

Normalized output uses the dotted format:

- `อ.2`
- `ป.2`

An explicit `room.level` value takes priority over parsing the room name.

Grade sorting remains:

1. kindergarten (`อ`)
2. primary (`ป`)
3. secondary (`ม`)
4. other recognized prefixes
5. `ไม่ระบุชั้น`

## Modular Implementation

### ReportRepository

File:

- `modules/repositories/reportRepository.js`

Responsibilities:

- read `milkApp/settings`
- reuse `StockRepository.loadStockSnapshot()`
- compose a read-only report snapshot

It contains no aggregation and no Firebase writes.

### ReportService

File:

- `modules/services/reportService.js`

Responsibilities:

- normalize room and transaction collections
- parse and sort grade levels
- aggregate classroom totals
- aggregate grade totals
- aggregate whole-school totals
- build print-safe models
- build Excel-export models

It contains no DOM, browser storage, or direct network access.

### ReportManager

File:

- `modules/report/reportManager.js`

Responsibilities:

- select room, grade, or school view
- refresh report data
- switch cached views without additional Firebase reads
- expose print and export models
- publish UI events

It does not access Firebase directly.

## Firebase Data Sources

The V2 repository reads the stock snapshot under `milkApp`:

- `rooms`
- `stock`
- `roomStock`
- `receives`
- `distributes`
- `mcAttendance`
- `absentMilk`
- `retroMilk`
- `vacationMilk`
- `stockTransactions`

It separately reads:

- `settings`

## Known Compatibility Gap: Legacy Local Collections

The legacy admin report also adds records from three browser-local databases:

- stored-milk dispensed records
- backdated-milk records
- vacation-milk records

These are not owned by Firebase repositories and must not be read directly by `ReportService` or `ReportManager`.

The modular service therefore accepts optional adapters through:

- `localPending`
- `localRetro`
- `localVacation`

Aliases are also supported for legacy adapters:

- `storedMilkDispensed`
- `backdatedMilkRecords`
- `vacationMilkRecords`

Before the V2 report replaces the legacy UI, the scheduled storage/sync adapter must inject these local collections or migrate them into shared Firebase paths. Until then, the legacy report remains the operational report.

## Read-Only Guarantee

The report module does not:

- write Main Stock
- write Room Stock
- append ledger records
- recalculate and save stock
- patch Firebase
- delete transactions

All report operations are read-only.

## Automated Validation

`tests/report-module-check.mjs` verifies:

- JavaScript syntax
- V2 dependency order
- repository read-only boundary
- no calculations in ReportRepository
- no DOM or storage logic in ReportService
- no Firebase access in ReportManager
- Thai grade parsing
- classroom totals
- grade totals
- whole-school totals
- remaining quantities
- percentage used
- print and export models
- cached view switching
- source snapshot immutability

## Merge Gate

Required before merging into `develop`:

1. Login foundation test passes.
2. Stock module test passes.
3. Report module test passes.
4. Admin and Teacher login remain operational.
5. Browser Console contains no report-module error.
6. Working tree is clean.
7. Legacy files remain unchanged.
