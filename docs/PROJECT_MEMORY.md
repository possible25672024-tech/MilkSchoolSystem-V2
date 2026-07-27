# MilkSchoolSystem V2

## Project Memory

Version: 2.3

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
- `stockLog`
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

- Stock Repository, Service, and Manager boundaries
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

- room-scoped Teacher Repository, Service, and Manager boundaries
- Firebase query-parameter support
- `mcAttendance` key-prefix query for one room only
- authenticated-room-only teacher data
- Admin-session and cross-room rejection
- room and student normalization
- teacher dashboard totals
- Room Stock-only command preparation
- Teacher architecture and workflow tests

Validation completed:

- Login, Stock, Report, Room, and Teacher tests passed
- Teacher browser smoke test passed
- Browser console clean
- Working tree clean
- Legacy files unchanged

### Sprint 3.7 Attendance Module

- `modules/repositories/attendanceRepository.js`
- `modules/services/attendanceService.js`
- `modules/attendance/attendanceManager.js`
- room-scoped attendance reads using `{roomId}_` key-prefix queries
- legacy-compatible attendance key `{roomId}_{YYYY-MM-DD}`
- present and absent status validation
- attendance create and edit workflows
- Room Stock adjustment by present-count difference
- attendance deletion and Room Stock rollback
- compatible `ATTENDANCE` and `ROLLBACK` ledger records
- compatible `stockLog` records
- Firebase multi-location mutation boundary
- Attendance architecture and business-rule tests
- migration gap report

Validation completed:

- Login foundation tests passed
- Stock module tests passed
- Report module tests passed
- Room module tests passed
- Teacher module tests passed
- Attendance module tests passed
- Admin Login browser smoke test passed
- Teacher Login browser smoke test passed
- Logout browser smoke test passed
- Browser console clean
- Working tree clean
- Legacy files unchanged

Known gaps:

- The operational form, media capture, signatures, and print views remain in `teacher.html`.
- The modular multi-location PATCH does not yet include the legacy ETag compare-and-retry Room Stock protection.
- Persistent offline queue, retry, reconnect flush, baseline preservation, and queued-edit conflict handling move to Sprint 3.8.

## Next Sprint

Sprint 3.8 — Offline Queue and Sync Migration

Planned boundaries:

- QueueStorage: persistent queue serialization, corruption filtering, and replacement rules
- SyncService: retry scheduling, exponential backoff, attendance replay, Room Stock adjustment replay, and conflict-safe result handling
- SyncManager: online/offline events, reconnect flush, periodic flush, queue badge state, and sync events

Protected requirements:

- offline saves survive refresh, browser restart, and device restart
- repeated edits for the same attendance key replace the queued record but preserve the original baseline
- attendance replay uses the same AttendanceService business rules
- Room Stock adjustment retries never rewrite attendance records unnecessarily
- retries never touch Main Stock
- only the authenticated room may be replayed
- queue corruption drops only invalid entries, not the entire queue
- retry frequency is bounded by exponential backoff
- existing `teacher.html` remains read-only during extraction

## Development Rules

- Never commit directly to `main`.
- Use `develop` for integration.
- Use `feature/*` branches for Sprint work.
- Do not modify `index.html` or `teacher.html` during Sprint 3.x migration unless explicitly approved.
- Do not change verified business logic while extracting modules.
- Run all available regression, module, browser, and clean-tree checks before merging.
