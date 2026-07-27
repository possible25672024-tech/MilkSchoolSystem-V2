# Sprint 3.5 — Room Module Migration Plan

Date: 2026-07-27

Branch: `feature/sprint-3.5-room`

## Goal

Extract room data access, validation, normalization, student-import preparation, and UI command orchestration from the legacy implementation without changing room IDs, Firebase paths, Room Stock references, or teacher workflows.

## Protected Legacy Files

Do not modify:

- `index.html`
- `teacher.html`

## Target Files

- `modules/repositories/roomRepository.js`
- `modules/services/roomService.js`
- `modules/room/roomManager.js`
- `tests/room-module-check.mjs`
- `docs/ROOM_MIGRATION_GAP_REPORT.md`

## Firebase Paths

Under `milkApp`:

- `rooms`
- `roomStock`
- `distributes`
- `mcAttendance`
- `absentMilk`
- `retroMilk`
- `vacationMilk`
- `stockTransactions`

## Layer Responsibilities

### RoomRepository

- load all rooms
- load one room
- create or replace one room
- patch room metadata
- read dependent references before deletion
- apply approved multi-location room updates
- no validation calculations
- no UI

### RoomService

- normalize room records
- validate room ID, name, teacher, student count, and student list
- preserve existing IDs during edits
- prepare imported student rows
- detect duplicate room IDs and duplicate students
- calculate deletion safety from dependent records
- build repository update payloads
- no DOM or direct Firebase access

### RoomManager

- load and refresh room lists
- form command boundary for create and edit
- import preview and confirmation commands
- deletion confirmation orchestration
- emit room events
- no direct Firebase or fetch calls

## Critical Compatibility Rules

- Existing room IDs must never change during edit.
- Existing room names and teacher assignments must remain compatible with Login and Teacher modules.
- Room Stock must stay linked to the same room ID.
- Student identifiers and imported fields must be preserved where available.
- Room deletion must be blocked when operational references exist unless a separately approved migration workflow is used.
- No Room operation may alter Main Stock.
- No Room operation may silently reset Room Stock.

## Deletion Dependency Checks

Before deleting a room, check:

- Room Stock balance or record
- classroom distributions
- attendance records
- pending milk records
- retroactive milk records
- vacation milk records
- stock ledger records

Default behavior: block deletion and return a dependency report.

## Test Gate

- JavaScript syntax validation
- V2 dependency order
- Repository path checks
- Repository contains no business calculations
- Service contains no DOM, localStorage, sessionStorage, or direct fetch
- Manager contains no Firebase or direct fetch
- room normalization tests
- stable room-ID edit tests
- duplicate-room validation tests
- student-import normalization tests
- deletion dependency tests
- Room Stock preservation tests
- login regression test
- stock regression test
- report regression test
- browser smoke test
- working tree clean

## Merge Gate

Merge into `develop` only after all automated checks and browser checks pass. Legacy files must remain unchanged.
