# MilkSchoolSystem V2

## Project Memory

Version: 2.0

Last updated: 2026-07-27

## Project Goal

Migrate the existing school-specific MilkSchoolSystem into a configurable platform while preserving the verified legacy behavior.

## Source of Truth

Timeline A — Migration Execution

Current backend:

- Firebase Realtime Database
- REST access through `FirebaseService`

Legacy files remain operational during migration:

- `index.html`
- `teacher.html`

V2 integration shell:

- `index-v2.html`

## Target Architecture

UI

→ Manager

→ Service

→ Repository

→ FirebaseService

→ Firebase Realtime Database

Repositories contain database paths and queries only.

Services contain validation, calculation, workflow, and business rules.

Managers contain UI-safe commands and events only.

## Stock Business Rules

### Main Stock

Main Stock changes only through:

- RECEIVE: increases Main Stock
- DISTRIBUTE: decreases Main Stock
- rollback of those same Main Stock operations

Main Stock must not be reduced by teacher operations.

### Room Stock

Classroom distribution increases the destination Room Stock.

The following operations reduce Room Stock only:

- ATTENDANCE
- PENDING
- RETRO
- VACATION

Rollback restores the same stock layer that the original operation changed.

### Rebuild and Validation

Main Stock expected value:

`receives - classroom distributions`

Room Stock expected value:

`classroom distributions - attendance - pending - retroactive - vacation`

Transaction history is the source of truth for rebuild calculations.

## Firebase Paths Preserved

Under `milkApp`:

- `settings`
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

## Completed Migration Work

### Sprint 3.4.2 Recovery

- Runtime Firebase configuration
- Realtime Database REST service
- BaseRepository
- Admin and Teacher login
- Session compatibility through `milkApp_loginSession`
- Bootstrap and V2 dependency order
- Browser and static validation

Merged into `develop` at `648fa6d`.

### Sprint 3.4.3 Stock Module

- `modules/repositories/stockRepository.js`
- `modules/services/stockService.js`
- `modules/stock/stockManager.js`
- multi-location Firebase update boundary
- receive and classroom distribution workflows
- Room Stock consumption and rollback workflows
- rebuild and validation calculations
- compatible ledger records
- stock static and business-rule tests
- migration gap report

Validation completed:

- Login foundation tests passed
- Stock module tests passed
- Admin login passed
- Teacher login passed
- Logout passed
- Browser console clean
- Working tree clean
- Legacy files unchanged

## Next Sprint

Sprint 3.4.4 — Report Module Migration

Planned boundaries:

- ReportRepository: report data reads only
- ReportService: aggregation and calculation only
- ReportManager: display, filters, print, and export commands only

Required report views already identified in the legacy system:

- classroom
- grade level
- whole school

## Development Rules

- Never commit directly to `main`.
- Use `develop` for integration.
- Use `feature/*` branches for Sprint work.
- Do not modify `index.html` or `teacher.html` during Sprint 3.x migration unless explicitly approved.
- Do not change verified business logic while extracting modules.
- Run Login, Firebase, Stock, and Smoke tests before merging.
