# Sprint 5.0 — Browser-local Report Adapter Gate

Date: 2026-07-30

Branch: `feature/sprint-5.0-admin-report-ui`

Status: **AUTOMATED PASS / LOCAL BROWSER GATE PENDING**

## Implemented

- `BrowserLocalReportAdapter` reads exactly:
  - `storedMilkDB_v1`;
  - `backdateDistDB_v1`;
  - `vacationDistDB_v1`.
- Pending records are deduplicated by room, student, and absent date.
- Retroactive records are deduplicated by room, academic year, semester, and
  retroactive date range.
- Vacation records are deduplicated by room, academic year, semester, issue
  date, and number of days.
- Media and signature fields are excluded from aggregation payloads.
- Missing or invalid local JSON fails safely and is surfaced as diagnostics.
- ReportManager injects normalized local sources into the existing pure Report
  Service formulas after loading one Firebase snapshot.
- Admin Report UI provides classroom, grade, and whole-school views, A4 print,
  and UTF-8 CSV export.

## Read-only boundary

The adapter and Admin Report View perform no:

- Storage write or delete;
- Firebase write;
- Main Stock or Room Stock mutation;
- Queue create, replay, or delete;
- ledger or stockLog repair;
- media hydration;
- Firebase schema or rule change.

Protected `index.html` and `teacher.html` remain unchanged.

## Automated evidence

```text
Admin Report UI checks passed.
Browser-local Report adapter checks passed.
Report module checks passed.
Sprint 5.0 plan checks passed.
ALL 57 REGRESSION CHECKS PASSED (3.1s)
```

Additional gates:

- JavaScript syntax passed;
- `git diff --check` passed;
- protected legacy diff is empty.

## Browser gate

Pending product-owner Live Server validation:

- Admin login exposes the report panel;
- classroom, grade, and whole-school views switch correctly;
- totals match the accepted legacy report for the same browser/device;
- print preview is A4 landscape;
- CSV downloads and opens with Thai text intact;
- Console remains clean;
- Firebase report traffic is GET-only;
- no stock, Queue, or operational record changes.

Use `docs/SPRINT_5_0_BROWSER_ACCEPTANCE_CHECKLIST.md`.

## Decision

Automated Gate A, Gate B, and the isolated Gate C UI contract pass. Sprint 5.0
still requires local browser evidence before review for integration.

No `main` merge, Production deployment, legacy replacement, Firebase rule
change, incident closure, or backup/restore execution is authorized.
