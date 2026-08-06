# Sprint 5.3 Real-Data Stock Audit

Date: 2026-07-31

Source: Product-owner Live Server screenshots from the 83-room Firebase dataset

## Observed totals

- Main Stock actual: 0 boxes
- Room Stock actual total: 118,960 boxes
- whole-system actual stock: 118,960 boxes
- rooms: 83
- actual students: 2,166
- milk consumption found in available history: 46,868 boxes
- history-complete rooms: 26
- rooms needing an opening balance or legacy-history import: 54
- negative Room Stock rooms: 3

## Interpretation

The previous Dashboard compared actual `roomStock` with a calculation that
started every room at zero. This made every pre-V2 balance appear to be an
ordinary mismatch.

The safe reconciliation equation is:

```text
opening balance
+ classroom distributions
- Attendance consumption
- Pending Milk
- Retroactive Milk
- Vacation Milk
= actual Room Stock
```

For each room, the read-only opening-balance candidate is:

```text
actual Room Stock - (distributions - all discovered teacher consumption)
```

This candidate may represent a true opening balance, missing legacy
distribution history, missing consumption history, or a manual adjustment. It
must not be written automatically.

## Negative-room examples visible in the evidence

- ป.2-5เชียงแก้ว: actual -720, V2 history -972, opening/history gap +252
- ป.4-7แม่โขะ: actual -130, V2 history -400, opening/history gap +270
- อ.2-8แม่โขะ: actual -292, V2 history -677, opening/history gap +385

Negative balances remain visible. They are not clamped to zero and must be
reviewed against physical stock, legacy distribution records, Teacher
operations, Queue recovery, ledger, and stockLog before any correction.

## Safety decision

- Do not run `rebuildAndPersist` on this real dataset.
- Do not replace actual Room Stock with the incomplete V2-history result.
- Do not treat the 54 opening-balance candidates as confirmed transactions.
- Continue recording all new receipts and later distributions with complete
  records so the post-migration path becomes fully auditable.
- Require explicit room-by-room approval before a future opening-balance
  migration writes Firebase.
