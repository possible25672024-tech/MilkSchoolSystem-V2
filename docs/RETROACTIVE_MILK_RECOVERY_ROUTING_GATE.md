# Sprint 4.5 — Retroactive Milk Recovery Routing Gate

Date: 2026-07-29

Branch: `feature/sprint-4.5-retroactive-milk-ui`

Status: IMPLEMENTED / LOCAL VALIDATION PENDING

## Purpose

Prevent a Retroactive Milk partial-save retry from being normalized to Attendance stock work.

## Startup Ordering

`modules/core/app.js` now installs `modules/sync/retroactiveSyncAdapter.js` before `SyncView.initialize()` starts Queue replay.

This ordering matters because an existing persistent `RETRO` entry must be recognized before startup sync reads and normalizes `tc_pending_saves_v1`.

## Preserved Compatibility

Storage key remains:

```text
tc_pending_saves_v1
```

Legacy entries without `operationType` continue to normalize to:

```text
ATTENDANCE
```

Existing operation types remain unchanged:

```text
PENDING
ROLLBACK
```

New accepted operation type:

```text
RETRO
```

## RETRO Replay

A typed `RETRO` Room Stock retry:

- requires a positive Room Stock deduction;
- changes Room Stock exactly once;
- creates ledger type `RETRO`;
- uses negative ledger quantity;
- creates stockLog type `OUT`;
- preserves the reviewed safe note;
- returns `mainStockDelta: 0`.

## ROLLBACK Replay

Retroactive delete continues to use the shared typed `ROLLBACK` route:

- negative Room Stock difference restores stock;
- ledger type `ROLLBACK`;
- stockLog type `IN`;
- exact quantity restoration;
- Main Stock unchanged.

## Audit-Only Recovery

When Room Stock succeeds but audit writing fails:

1. the stock mutation is not repeated;
2. the built RETRO ledger and OUT stockLog are converted to the existing audit-only queue type;
3. later replay writes audit only;
4. Room Stock remains at the already-updated balance;
5. Main Stock remains unchanged.

## Safe Queue UI

The adapter preserves `RETRO` in SyncManager safe summaries and labels the Queue item:

```text
หักสต็อกนมย้อนหลังที่รอซิงก์
```

It does not expose:

- student records;
- photo payloads;
- signature payloads;
- Firebase credentials;
- complete ledger or stockLog payloads in the UI summary.

## Test

Added:

- `tests/retroactive-milk-recovery-routing-check.mjs`

The isolated test verifies:

- adapter installation before Queue startup;
- legacy operation fallback to ATTENDANCE;
- RETRO persistence through QueueStorage;
- safe SyncManager summary;
- safe SyncView label;
- Room Stock `100 → 94` exactly once;
- RETRO ledger quantity `-6`;
- OUT stockLog quantity `6`;
- failed audit conversion to audit-only work;
- audit-only replay without repeated stock mutation;
- ROLLBACK restoration `94 → 100`;
- Main Stock remains `999`;
- no Firebase or real classroom data is used.

Expected local output:

```text
Retroactive Milk recovery routing checks passed.
```

## Browser Restriction

Do not press:

- `บันทึกนมย้อนหลัง`;
- Retroactive Milk delete/rollback;
- manual Queue retry against real data.

Browser work remains read-only until recovery routing, UI, isolated write, and all 26 regression checks pass.

## Legacy Parity

This gate completes only stock-recovery routing. It does not remove or complete the remaining Teacher parity items such as visible student detail, photos, signatures, history, summaries, A4 printing, Vacation Milk, student reports, Room Stock view, or settings.

Binding artifact:

- `docs/TEACHER_LEGACY_PARITY_CONTRACT.md`
