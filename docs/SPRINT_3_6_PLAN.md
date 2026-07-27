# Sprint 3.6 — Teacher Module Migration Plan

Date: 2026-07-27

Branch: `feature/sprint-3.6-teacher`

## Goal

Extract teacher session resolution, room-scoped data access, teacher workflow preparation, and UI command orchestration from the legacy teacher application without changing stock rules, Firebase paths, offline behavior, or the operational `teacher.html` file.

## Protected Legacy Files

Do not modify:

- `index.html`
- `teacher.html`

## Target Files

- `modules/repositories/teacherRepository.js`
- `modules/services/teacherService.js`
- `modules/teacher/teacherManager.js`
- `tests/teacher-module-check.mjs`
- `docs/TEACHER_MIGRATION_GAP_REPORT.md`

## Firebase Paths

Under `milkApp`:

- `settings`
- `rooms`
- `roomStock`
- `distributes`
- `mcAttendance`
- `absentMilk`
- `retroMilk`
- `vacationMilk`
- `stockTransactions`
- `updatedAt`

## Layer Responsibilities

### TeacherRepository

- load one room by authenticated room ID
- load room-scoped Room Stock
- load classroom distributions for the active room
- load room-scoped attendance using Firebase query boundaries where possible
- load pending, retroactive, and vacation records for the active room
- load shared settings required by teacher workflows
- no business calculations
- no DOM or session storage

### TeacherService

- validate teacher session and authenticated room
- normalize room and teacher data
- prepare a room-scoped teacher snapshot
- calculate teacher dashboard totals from the scoped snapshot
- validate that commands target only the authenticated room
- preserve two-layer stock rules
- no DOM, localStorage, sessionStorage, or direct Firebase calls

### TeacherManager

- resolve the authenticated teacher session through AuthService
- refresh the teacher room snapshot
- provide dashboard and workflow command boundaries
- emit teacher events
- never access Firebase directly

## Critical Compatibility Rules

- A teacher may access only the room ID in the authenticated session.
- Teacher login and Admin login must remain operational.
- Main Stock must never be changed by teacher workflows.
- Attendance, pending, retroactive, and vacation operations may reduce only Room Stock.
- Login must not download all-school attendance data.
- Room-scoped attendance loading must preserve the existing Firebase key format.
- Existing offline queue and retry behavior must not be changed before Sprint 3.8.
- Existing `teacher.html` remains operational and read-only during extraction.

## Performance Boundary

The teacher login path must not block on downloading all rooms' `mcAttendance` records. Repository methods should support room-key prefix queries or equivalent room-scoped reads.

## Test Gate

- JavaScript syntax validation
- V2 dependency order
- repository path and room-scope checks
- repository contains no business calculations
- service contains no DOM, localStorage, sessionStorage, or direct fetch
- manager contains no Firebase or direct fetch
- teacher session validation tests
- cross-room access rejection tests
- room-scoped snapshot tests
- teacher dashboard calculation tests
- Main Stock isolation tests
- Room Stock operation-boundary tests
- login regression test
- stock regression test
- report regression test
- room regression test
- browser smoke test
- working tree clean

## Merge Gate

Merge into `develop` only after all automated checks and browser checks pass. Legacy files must remain unchanged.
