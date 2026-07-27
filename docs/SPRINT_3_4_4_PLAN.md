# Sprint 3.4.4 — Report Module Migration Plan

Date: 2026-07-27

Branch: `feature/sprint-3.4.4-report`

## Goal

Extract report data access, aggregation, and UI orchestration from the legacy implementation into modular V2 components without changing verified report calculations or Firebase paths.

## Protected Legacy Files

Do not modify:

- `index.html`
- `teacher.html`

## Target Files

- `modules/repositories/reportRepository.js`
- `modules/services/reportService.js`
- `modules/report/reportManager.js`
- `tests/report-module-check.mjs`
- `docs/REPORT_MIGRATION_GAP_REPORT.md`

## Required Report Views

- per classroom
- by grade level
- whole school

## Data Sources

Under `milkApp`:

- `rooms`
- `settings`
- `receives`
- `distributes`
- `mcAttendance`
- `absentMilk`
- `retroMilk`
- `vacationMilk`
- `roomStock`
- `stock`
- `stockTransactions`

## Layer Responsibilities

### ReportRepository

- read report-related paths
- compose report snapshots
- no calculations
- no UI

### ReportService

- normalize rooms and records
- parse grade levels
- aggregate classroom, grade, and school totals
- calculate distributed, consumed, pending, retroactive, vacation, and remaining quantities
- prepare print/export data
- no DOM access

### ReportManager

- manage report view selection
- filters and refresh commands
- render-safe data delivery
- print/export command boundaries
- no Firebase calls

## Compatibility Rules

- Preserve existing classroom identifiers.
- Preserve Thai room-name grade parsing behavior.
- Do not change Main Stock or Room Stock values.
- Reports are read-only.
- No report action may write Firebase data.

## Test Gate

- syntax validation
- dependency order
- repository contains no calculations
- service contains no DOM or storage logic
- manager contains no Firebase or direct fetch
- classroom aggregation test
- grade aggregation test
- whole-school aggregation test
- remaining stock calculation test
- login regression test
- stock regression test
- browser smoke test

## Merge Gate

Merge into `develop` only after all automated and browser checks pass and the working tree is clean.
