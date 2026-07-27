# MilkSchoolSystem V2

## Project Memory

Version: 2.2

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
- `updatedAt`

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

- `StockRepository`, `StockService`, and `StockManager`
- receive and classroom distribution workflows
- Room Stock consumption and rollback workflows
- rebuild and validation calculations
- compatible ledger records
- stock static and business-rule tests

Merged into `develop` at `f56e430` after all validation gates passed.

### Sprint 3.4.4 Report Module

- read-only report repository boundary
- classroom, grade-level, and whole-school aggregation
- Thai grade normalization and natural sorting
- distribution and Room Stock consumption totals
- print and Excel export models
- cached view switching
- report architecture and aggregation tests

Merged into `develop` after all validation gates passed.

Known gap:

The operational legacy report also uses browser-local pending, retroactive, and vacation collections. A Storage/Sync adapter is still required before V2 replaces the operational report.

### Sprint 3.5 Room Module

- room repository, service, and manager boundaries
- array and object room normalization
- manual room creation and metadata editing
- immutable Room IDs during edits
- Room Stock preservation during edits and repeated imports
- duplicate room and student validation
- student import preparation
- deletion dependency reports and safety blocking
- room architecture and workflow tests

Known gaps:

- XLSX binary parsing remains in the legacy file.
- Complete `milkApp/rooms` writes do not yet include multi-admin optimistic concurrency control.

### Sprint 3.6 Teacher Module

- `modules/repositories/teacherRepository.js`
- `modules/services/teacherService.js`
- `modules/teacher/teacherManager.js`
- Firebase query-parameter support in `FirebaseService`
- scoped read support in `BaseRepository`
- authenticated-room-only teacher data boundary
- `mcAttendance` key-prefix query for one room only
- teacher session validation and Admin-session rejection
- cross-room access rejection
- room and student normalization
- room-scoped distribution, attendance, pending, retroactive, vacation, ledger, and Room Stock normalization
- teacher dashboard totals
- teacher command preparation with `mainStockDelta: 0`
- Room Stock-only consume and rollback boundaries
- Teacher architecture and workflow tests
- migration gap report

Validation completed:

- Login foundation tests passed
- Stock module tests passed
- Report module tests passed
- Room module tests passed
- Teacher module tests passed
- Teacher browser smoke test passed
- Browser console clean
- Working tree clean
- Legacy files unchanged

Known gaps:

- Operational teacher forms, media capture, signatures, print views, attendance writes, and atomic Room Stock writes remain in `teacher.html`.
- Attendance writes move in Sprint 3.7.
- Persistent offline queue and retry remain unchanged until Sprint 3.8.

## Next Sprint

Sprint 3.7 — Attendance Module Migration

Planned boundaries:

- AttendanceRepository: room-scoped attendance reads and atomic save boundaries
- AttendanceService: validation, attendance difference calculation, Room Stock delta calculation, and rollback workflow
- AttendanceManager: attendance commands and event orchestration

Protected requirements:

- attendance keys remain `{roomId}_{YYYY-MM-DD}`
- only the authenticated room may be read or written
- editing an existing day adjusts Room Stock by the difference only
- Main Stock remains unchanged
- ledger entries remain compatible
- offline queue behavior remains unchanged until Sprint 3.8
- legacy `teacher.html` remains read-only during extraction

## Development Rules

- Never commit directly to `main`.
- Use `develop` for integration.
- Use `feature/*` branches for Sprint work.
- Do not modify `index.html` or `teacher.html` during Sprint 3.x migration unless explicitly approved.
- Do not change verified business logic while extracting modules.
- Run all available regression, module, browser, and clean-tree checks before merging.
