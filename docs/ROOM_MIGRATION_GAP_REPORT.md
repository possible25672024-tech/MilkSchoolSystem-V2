# Room Module Migration Gap Report

Date: 2026-07-27

Branch: `feature/sprint-3.5-room`

## Scope

Sprint 3.5 extracts room storage, validation, import preparation, and command orchestration into:

- `modules/repositories/roomRepository.js`
- `modules/services/roomService.js`
- `modules/room/roomManager.js`

The operational legacy files remain unchanged:

- `index.html`
- `teacher.html`

## Legacy Workflow Reviewed

### Manual Room Creation

The legacy workflow:

- matches an existing room by room name
- updates count and teacher when the name already exists
- creates a new generated room id for a new name
- initializes a new room with `students: []` and `stock: 0`
- saves the local database and then performs a best-effort Cloud push

### Student Import

The legacy workflow:

- uses one Excel sheet as one room
- matches an existing room by sheet name
- preserves the existing room id
- replaces the student list
- calculates count from the imported student list
- preserves the existing Room Stock value
- creates a new id and zero Room Stock for a new room

### Room Deletion

The legacy workflow removes the room from `db.rooms` after a confirmation dialog. It does not first inspect:

- Room Stock
- distributions
- attendance
- pending milk
- retroactive milk
- vacation milk
- stock ledger records

This can leave operational history and Room Stock references without a room record.

## Modular Behavior Implemented

### Repository Boundary

`RoomRepository` owns the following Firebase paths under `milkApp`:

- `rooms`
- `roomStock`
- `distributes`
- `mcAttendance`
- `absentMilk`
- `retroMilk`
- `vacationMilk`
- `stockTransactions`

It performs storage operations and dependency reads only. It contains no room validation or UI logic.

### Service Boundary

`RoomService` implements:

- array- and object-shaped room collection normalization
- stable room-id updates
- room-name and room-id duplicate checks
- student-count validation
- student field preservation
- duplicate-student detection
- manual-room preparation
- repeated-import id preservation
- repeated-import Room Stock preservation
- grade and teacher metadata preservation when import data omits those fields
- deletion dependency reports
- safe deletion only when no operational dependency exists

### Manager Boundary

`RoomManager` implements commands for:

- refresh
- create
- update
- import preview
- import confirmation
- import cancellation
- deletion request
- room-related events

It does not access Firebase, `fetch`, local storage, session storage, or the DOM directly.

## Protected Data Rules

### Room ID

An existing room id is immutable during edit and repeated import.

This protects references held by:

- Login
- Room Stock
- distribution history
- attendance history
- pending milk
- retroactive milk
- vacation milk
- stock ledger

### Room Stock

- New rooms start at zero Room Stock.
- Edits preserve the existing Room Stock value.
- Repeated imports preserve the existing Room Stock value.
- Room normalization does not recalculate or reset Room Stock.
- No room operation changes Main Stock.

### Student Data

Imported student objects retain all available source fields. The service trims text field names and text values without replacing the existing field schema.

Duplicate detection uses, in order:

- student id fields
- school student-code fields
- citizen-id fields
- normalized first and last name fallback

## Deletion Policy

Deletion is blocked when any of the following exists:

- a Room Stock record, including a zero-valued record
- a non-zero embedded room stock value
- classroom distribution records
- attendance records
- pending-milk records
- retroactive-milk records
- vacation-milk records
- stock ledger records

The returned dependency report identifies each reference category and count.

A separate archival or migration workflow is required to remove a room with operational history. That workflow is not part of Sprint 3.5.

## Known Gaps

### Excel Parsing Remains in Legacy

The legacy Smart Excel Parser contains school-specific header detection and merged-column handling. Sprint 3.5 accepts parsed sheet data but does not move the binary XLSX parser into V2 yet.

This avoids combining file parsing, room business rules, and Firebase writes in one migration step.

### V2 Room Screen Not Yet Operational

`index-v2.html` loads the Room modules for architecture and browser regression checks. It does not yet replace the operational room screens in `index.html`.

### Collection Write Concurrency

The current compatible room workflow writes the complete `milkApp/rooms` collection. This preserves the existing array schema but does not provide optimistic concurrency control when two administrators edit rooms at the same moment.

A version or ETag-based concurrency boundary should be evaluated before V2 fully replaces the legacy operational room screen.

### Report Local-Data Adapter

The known Sprint 3.4.4 report gap remains: browser-local pending, retroactive, and vacation collections require a storage/sync adapter before the modular report replaces the operational legacy report.

## Migration Decision

Sprint 3.5 provides a safe modular foundation without changing verified legacy workflows or operational files. The V2 Room module must remain behind the migration boundary until automated tests, browser regression tests, and a later operational UI integration pass are complete.
