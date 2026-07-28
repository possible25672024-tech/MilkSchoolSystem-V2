# MilkSchoolSystem V2 — Production Backup and Rollback Plan

Date: 2026-07-28

Prepared on branch: `feature/sprint-4.0-cutover-readiness`

Status: PLAN COMPLETE — rehearsal and production approval pending

## Purpose

Define a reversible production cutover process while preserving `index.html` and `teacher.html` as the operational fallback. This plan does not authorize deployment, `main` merge, traffic switching, Firebase schema changes, or legacy-file removal.

## Protected Assets

- `index.html`
- `teacher.html`
- current production deployment artifact
- current Firebase Realtime Database content under `milkApp`
- browser queue key `tc_pending_saves_v1`
- Firebase configuration values and deployment environment settings
- current `main` commit and deployment identifier

## Roles

### Product Owner

- approves the maintenance window
- approves cutover and rollback decisions
- accepts or rejects deferred device risks
- confirms business workflow smoke tests

### Release Operator

- creates and verifies backups
- records commit SHAs and deployment identifiers
- performs deployment and rollback commands
- records timestamps and evidence

### Data Verifier

- compares Firebase counts and stock totals before and after the operation
- verifies that Main Stock and Room Stock relationships remain consistent
- checks that no negative balance was silently clamped

### Browser Tester

- runs Admin and Teacher smoke tests
- verifies Console and Network
- verifies Logout and rollback paths

No person should approve their own unverified production result when another verifier is available.

## Required Preconditions

Cutover must not begin unless all items are recorded:

- explicit product-owner approval
- approved target commit SHA
- approved rollback commit/deployment identifier
- clean automated test run for the target commit
- clean desktop browser smoke test
- responsive browser evidence
- physical-device evidence or explicit risk acceptance
- isolated Firebase concurrency evidence or explicit risk acceptance
- production backup destination confirmed
- restore destination confirmed and isolated from production
- maintenance window announced
- operators and verifier available

## Backup Checklist

### 1. Source and Deployment Snapshot

Record:

- current `main` SHA
- current `develop` SHA
- target release SHA
- current production URL
- current deployment ID
- hosting configuration
- Firebase database URL identifier without exposing credentials
- timestamp and operator

Create a release tag only after approval, for example:

```text
pre-v2-cutover-YYYYMMDD-HHMM
```

### 2. Firebase Export

Export the complete production Realtime Database before deployment.

Minimum verification:

- export file exists
- file size is non-zero
- JSON parses successfully
- root contains `milkApp`
- expected collections are present, including settings, rooms, stock, roomStock, attendance, distribution, and audit/transaction collections used by production
- record counts and selected totals are written to the cutover log

Do not edit the backup file.

### 3. Business Baseline Snapshot

Record before cutover:

- Main Stock total
- number of rooms
- Room Stock total and a sample of named rooms
- number of Attendance records
- number of pending, retroactive, and vacation records
- number of stock transaction/audit records
- last updated timestamps where available

This snapshot is for comparison and must not be used to silently overwrite newer production activity.

### 4. Browser Queue Considerations

The offline queue is browser-local and is not included in Firebase export.

Before cutover:

- instruct active Teacher users to reconnect and allow pending items to sync
- record the queue count on test/known operational devices where practical
- do not clear Local Storage
- do not change the key `tc_pending_saves_v1`
- warn that private/incognito windows and browser storage cleanup can remove local queues

For a device with unresolved queue entries, postpone its migration or export a sanitized queue sample before changing the operational page.

### 5. Configuration Backup

Record copies or values for:

- Firebase URL configuration
- authentication configuration used by the application
- hosting redirects and entry-page mapping
- cache headers/service-worker settings if present
- environment-specific configuration files

Never commit secrets to the repository or include them in screenshots.

## Isolated Restore Rehearsal

Before production approval:

1. Create or select a non-production Firebase project/database.
2. Import the production backup into the isolated environment.
3. Point a local test build at the isolated environment.
4. Verify Login, rooms, Main Stock, Room Stock, Attendance, reports, and representative transaction history.
5. Compare baseline counts and totals.
6. Verify that protected legacy pages can also read the restored data when configured for the isolated environment.
7. Record discrepancies and repeat until the restore is reproducible.

Never rehearse destructive restore steps against the live production database.

## Cutover Sequence

### Phase 1 — Freeze and Recheck

- announce the start of the maintenance window
- request users to stop stock and Attendance writes
- wait for known offline queues to sync
- repeat Firebase export after the freeze
- confirm Git working tree and target SHA
- run final automated tests

### Phase 2 — Deploy Without Removing Legacy

- deploy the approved V2 artifact alongside protected legacy files
- do not delete or rename `index.html` or `teacher.html`
- do not change Firebase schema
- do not switch all users until smoke tests pass
- preserve a direct legacy rollback URL or deployment identifier

### Phase 3 — Immediate Smoke Tests

Admin checks:

- login and invalid-password rejection
- rooms load
- Main Stock is visible and matches baseline
- representative Room Stock matches baseline
- report read does not mutate data
- Logout
- Console and Network clean

Teacher checks:

- login to a dedicated test room
- Room Stock display matches baseline
- load one Attendance date
- perform only approved non-destructive checks unless a dedicated test transaction is planned
- queue status visible when UI integration exists
- Logout
- Console and Network clean

Data checks:

- Main Stock unchanged by Teacher checks
- no unexpected Room Stock changes
- no schema/path changes
- no new JavaScript errors

### Phase 4 — Limited Release

- enable V2 for a limited operator group
- retain legacy pages for immediate fallback
- monitor errors, queue failures, stock discrepancies, and support reports
- widen access only after the observation window passes

## Rollback Triggers

Rollback immediately or pause cutover when any of these occurs:

- Admin or Teacher login failure affecting normal users
- incorrect Main Stock or Room Stock change
- Attendance edit/delete applies the wrong difference
- duplicate queue replay or repeated Room Stock deduction
- Firebase 4xx/5xx errors caused by V2
- sustained uncaught JavaScript errors
- rooms or students missing/mismatched
- report operation mutates data
- offline queue entries disappear without success
- audit/ledger recovery causes duplicate stock changes
- production performance makes the workflow unusable
- product owner or release operator cannot verify data safety

UI-only defects may be triaged without data rollback only when the product owner and data verifier confirm that no write path or stock data is affected.

## Rollback Sequence

### 1. Stop New V2 Activity

- announce rollback
- stop or redirect V2 entry traffic
- do not clear browser storage
- preserve logs, screenshots, timestamps, and affected record IDs

### 2. Restore the Previous Application

Preferred rollback:

- redeploy the previous known-good production artifact or switch the entry route back to protected legacy pages
- verify `index.html` and `teacher.html` are available
- keep the current Firebase database in place when data is valid

Application rollback should normally occur before database restore.

### 3. Assess Data Before Any Restore

Compare:

- latest Firebase state
- pre-cutover backup
- transaction/audit records
- known user actions during the cutover window
- browser queues that may still contain pending operations

Do not replace the complete database merely because the application was rolled back. A full restore can destroy valid writes created after the backup.

### 4. Data Recovery Decision

Choose one documented path:

- no database restore: application-only rollback, when data is consistent
- targeted correction: repair specific records using audited references
- isolated reconstruction: rebuild expected values from transactions and compare before applying
- full database restore: last resort, only with explicit product-owner approval and a confirmed freeze/no-valid-new-writes condition

### 5. Verify Legacy Operation

After rollback:

- Admin login
- Teacher login
- rooms load
- Main Stock baseline comparison
- Room Stock sample comparison
- Attendance read
- queue preservation/replay check
- Logout
- clean Console/Network

### 6. Close the Incident

Record:

- trigger
- affected time window
- release and rollback SHAs/deployments
- data decision
- records corrected or restored
- remaining queues
- verification results
- follow-up owner

## Post-Cutover Monitoring

For the observation window, monitor:

- login failures
- Firebase request failures
- ETag conflict/retry counts
- unresolved `roomStockAdjust` entries
- unresolved `attendanceAudit` entries
- Main Stock and Room Stock discrepancy reports
- offline/reconnect support reports
- browser performance and memory issues

## Approval Checklist

Production cutover requires signatures/confirmation from:

- product owner
- release operator
- data verifier
- browser/device tester

Approval must state:

- target SHA
- backup verified
- restore rehearsal result
- deferred risks accepted or closed
- rollback path available
- legacy files retained

## Current Sprint 4.0 Decision

- This plan is complete as documentation.
- Backup export and isolated restore rehearsal are still pending.
- Production cutover remains blocked.
- Sprint 4.0 may merge to `develop` after its remaining branch gate passes.
- No merge to `main`, production switch, database restore, or legacy removal is authorized by this document alone.
