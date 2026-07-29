# Sprint 4.4 — Pending Milk Recovery Routing Gate

Date: 2026-07-29

Branch: `feature/sprint-4.4-pending-milk-ui`

Status: PASS — isolated recovery routing confirmed locally

## Purpose

Prevent Pending Milk partial-save retries from being replayed as Attendance stock transactions.

The generic `roomStockAdjust` queue remains compatible, but now preserves enough safe metadata to route each retry correctly.

## Preserved Queue Compatibility

Storage key remains:

```text
tc_pending_saves_v1
```

Legacy Room Stock retry entries that do not contain `operationType` continue to default to:

```text
ATTENDANCE
```

Legacy `diff` remains accepted as an alias for `difference`.

## Typed Retry Metadata

Room Stock retry entries may now contain:

```text
operationType: ATTENDANCE | PENDING | ROLLBACK
note: reviewed safe operational note
```

Pending Milk Manager supplies:

- `PENDING` when an issued `absentMilk` record was saved but Room Stock deduction still requires retry
- `ROLLBACK` when an `absentMilk` record was deleted but Room Stock restoration still requires retry

## Replay Routing

### ATTENDANCE

Uses the completed Attendance adjustment route unchanged.

### PENDING

- replays Room Stock deduction only
- creates ledger type `PENDING`
- creates stockLog type `OUT`
- preserves Pending-specific safe note
- Main Stock delta remains zero

### ROLLBACK

- replays Room Stock restoration only
- creates ledger type `ROLLBACK`
- creates stockLog type `IN`
- preserves rollback-specific safe note
- Main Stock delta remains zero

## Audit-Only Recovery

When Room Stock succeeds but audit writing fails:

1. the Room Stock retry is converted to the existing audit-only queue type;
2. the created `PENDING` or `ROLLBACK` ledger and stockLog are preserved;
3. the next replay writes audit only;
4. Room Stock is not mutated again;
5. Main Stock remains unchanged.

The queue type remains named `attendanceAudit` for storage compatibility, but its payload may safely carry any already-built compatible Teacher ledger and stockLog.

## Safe Queue UI

`SyncManager` exposes:

- operation type
- reviewed safe note
- room
- date/reference
- attempts
- queue and next-retry times
- safe error details

It does not expose:

- student records
- photos
- signatures
- full Attendance payloads
- Firebase credentials

`SyncView` labels typed retries as:

- Pending Milk deduction waiting for sync
- Pending Milk rollback waiting for sync

## Files Updated

- `modules/storage/queueStorage.js`
- `modules/services/syncService.js`
- `modules/sync/syncManager.js`
- `modules/sync/syncView.js`

## Test Added

- `tests/pending-milk-recovery-routing-check.mjs`

Confirmed locally:

```text
Pending Milk recovery routing checks passed.
```

Verified:

- legacy retry defaults to `ATTENDANCE`
- legacy `diff` alias remains compatible
- `PENDING` metadata persists
- `ROLLBACK` metadata persists
- safe Manager summaries expose only reviewed metadata
- Pending retry creates `PENDING` ledger and `OUT` stockLog
- rollback retry creates `ROLLBACK` ledger and `IN` stockLog
- exact quantities are preserved
- audit failure converts to audit-only work
- audit-only retry never repeats Room Stock mutation
- Room Stock changes exactly once per typed retry
- Main Stock remains 999
- no Firebase service, repository write, or real classroom data is used

## Safety Decision

Recovery routing is accepted for the Sprint 4.4 code gate.

Browser Pending Milk writes remain prohibited until the complete 22-test regression gate passes. The browser gate must remain read-only and use no real Pending Milk mutation.

The quarantined room/date remains excluded:

- room `อ.3-3`
- room ID `mqn0z13eyx5b`
- date `2026-07-28`
