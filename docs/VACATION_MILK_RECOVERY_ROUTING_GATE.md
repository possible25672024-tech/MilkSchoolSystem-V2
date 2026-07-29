# Sprint 4.6 — Vacation Milk Recovery Routing Gate

Date: 2026-07-29

Branch: `feature/sprint-4.6-vacation-milk-ui`

Status: IMPLEMENTED / LOCAL VALIDATION PENDING

## Purpose

Prevent a Vacation Milk partial-save retry from being normalized to Attendance, Pending Milk, or Retroactive Milk stock work.

## Startup Ordering

`modules/core/app.js` installs both typed adapters before `SyncView.initialize()` starts persistent Queue replay:

1. `modules/sync/retroactiveSyncAdapter.js`
2. `modules/sync/vacationSyncAdapter.js`
3. `modules/sync/syncView.js`

Both adapters are installed again after SyncView is available so safe Queue labels are patched before Teacher startup replay.

## Preserved Compatibility

Persistent storage key remains:

```text
tc_pending_saves_v1
```

Legacy Queue entries without `operationType` remain:

```text
ATTENDANCE
```

Existing typed operations remain available:

```text
PENDING
RETRO
ROLLBACK
```

New typed operation:

```text
VACATION
```

## VACATION Replay

A typed Vacation Milk retry:

- requires a positive Room Stock deduction;
- changes Room Stock exactly once;
- creates ledger type `VACATION`;
- uses negative ledger quantity;
- creates stockLog type `OUT`;
- preserves the reviewed safe note;
- returns `mainStockDelta: 0`.

## ROLLBACK Replay

Vacation Milk deletion continues through the shared typed `ROLLBACK` route:

- a negative queued difference restores stock;
- ledger type is `ROLLBACK`;
- stockLog type is `IN`;
- the exact deducted quantity is restored;
- Main Stock remains unchanged.

## Audit-Only Recovery

When Room Stock succeeds but audit writing fails:

1. the Room Stock mutation is not repeated;
2. the built `VACATION` ledger and `OUT` stockLog become existing audit-only Queue work;
3. later replay writes audit only;
4. Room Stock stays at the already-updated balance;
5. Main Stock remains unchanged.

## Safe Queue UI

The adapter preserves `VACATION` in safe SyncManager summaries and labels the Queue item:

```text
หักสต็อกนมช่วงปิดเทอมที่รอซิงก์
```

The safe summary does not expose:

- student roster payloads;
- parent signature images;
- Teacher signatures;
- photo payloads;
- Firebase credentials;
- full ledger or stockLog payloads.

## Test

Added:

- `tests/vacation-milk-recovery-routing-check.mjs`

The isolated test verifies:

- valid JavaScript for Queue, Sync, both typed adapters, and App;
- Vacation adapter installation before Queue startup;
- default legacy operation remains `ATTENDANCE`;
- existing `RETRO` routing remains compatible;
- QueueStorage preserves `VACATION`;
- SyncManager safe summaries preserve `VACATION`;
- SyncView shows the reviewed safe label;
- Room Stock changes `200 → 110` exactly once;
- `VACATION` ledger quantity is `-90`;
- `OUT` stockLog quantity is `90`;
- failed audit converts to audit-only work;
- audit-only replay does not repeat stock mutation;
- `ROLLBACK` restores Room Stock `110 → 200`;
- Main Stock remains `999`;
- no Firebase or real classroom data is used.

Expected local output:

```text
Vacation Milk recovery routing checks passed.
```

## Browser Restriction

Do not press:

- `บันทึกนมช่วงปิดเทอม`;
- Vacation Milk delete/rollback;
- manual Queue retry against real data.

Browser mutation remains prohibited until the recovery, UI, isolated write, and complete regression gates pass.

## Firebase Index

The later read-only room history gate requires:

```text
/milkApp/vacationMilk → .indexOn ["roomId"]
```

Existing `absentMilk` and `retroMilk` indexes must remain unchanged.

## Legacy Parity

This gate completes stock-recovery routing only. Parent signatures, photos, summary reports, and A4 printing remain mandatory under:

- `docs/TEACHER_LEGACY_PARITY_CONTRACT.md`

Those media and report capabilities are not removed by the current safe handoff.
