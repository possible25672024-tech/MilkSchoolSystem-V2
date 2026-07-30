# Sprint 5.0 — Operational Admin Report Integration

Date: 2026-07-30

Branch: `feature/sprint-5.0-admin-report-ui`

Status: **ACTIVE — BROWSER-LOCAL REPORT ADAPTER GATE**

## Goal

Close cutover decision D-02 by connecting the existing read-only Report Service
to the three approved legacy browser-local operational sources without changing
report formulas, Firebase schema, protected legacy pages, or stock values.

## Gate A — Browser-local source adapter

- read only `storedMilkDB_v1`, `backdateDistDB_v1`, and `vacationDistDB_v1`;
- accept injected Storage for deterministic tests;
- normalize Pending, Retroactive, and Vacation records to Report Service aliases;
- omit photos and signatures from report aggregation payloads;
- deduplicate local records already represented by Firebase collections;
- return diagnostics for missing or invalid local JSON;
- perform no Storage write, Firebase access, Queue work, or stock mutation.

## Gate B — Report orchestration

- ReportManager loads one Firebase report snapshot;
- BrowserLocalReportAdapter receives that read-only snapshot for deduplication;
- normalized local sources are passed into existing Report Service formulas;
- explicit test sources retain final precedence;
- cached room, grade, and school view switching remains read-only.

## Gate C — Operational Admin report UI

- authenticated Admin only;
- classroom, grade, and whole-school views;
- matching totals for distributed, Attendance, Pending, Retroactive, Vacation,
  remaining milk, and percentage used;
- print and export actions use existing pure Report models;
- desktop and Chrome Responsive `820 x 1180`;
- clean Console and GET-only Firebase report traffic.

## Protected boundaries

- `index.html` and `teacher.html` remain unchanged;
- Main Stock changes only through classroom distribution;
- Attendance, Pending, Retroactive, and Vacation Milk never change Main Stock;
- the report path writes no Main Stock, Room Stock, Queue, ledger, or stockLog;
- no Firebase rule, path, record shape, or migration is introduced;
- quarantined room/date data is not accepted as trusted evidence.

## Integration meaning

Sprint 5.0 may become eligible for review into `develop` after automated and
browser gates pass. It does not authorize `main`, Production deployment,
legacy-file replacement, incident closure, or backup/restore execution.
