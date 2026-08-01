# Incident Closure Gate — room mqn0z13eyx5b

Date: 2026-08-01

Incident: `INC-2026-07-28-MQN0Z13EYX5B`

Status: **OPEN — READ-ONLY FORENSIC GATE READY / PRODUCTION EVIDENCE REQUIRED**

## Known facts

- room: `อ.3-3`;
- room ID: `mqn0z13eyx5b`;
- date: `2026-07-28`;
- test-created Attendance: 22 present and 3 absent;
- recorded Room Stock before test: 1,275;
- observed Room Stock after test: 1,253;
- known delta: -22;
- room/date has remained quarantined from later test writes.

The delta is consistent with the Attendance rule that one present student uses
one box from Room Stock. Consistency is not enough to authorize deletion or a
manual stock edit: later operational records and the audit trail must first be
checked against a fresh authoritative export.

## Read-only forensic gate

Run against a fresh full Firebase export or a V2 Backup envelope:

```powershell
node scripts/audit-room-incident.mjs `
  --backup D:\path\to\milk_backup.json `
  --output evidence\incident-mqn0z13eyx5b-audit.json
```

The gate records the source SHA-256 and inspects:

- the exact Attendance key;
- current Room Stock;
- matching stockTransactions and stockLog;
- related Pending, Retroactive, Vacation, and distribution records;
- missing, changed, or cross-linked evidence.

It never contacts Firebase and never writes Production. `incidentClosed` is
always false because a data file alone cannot provide product-owner disposition
or proof of an authorized correction.

## Closure requirements

All items are mandatory:

1. fresh pre-action Production Backup with SHA-256 and root ETag;
2. forensic report has no unexplained blocker;
3. school owner confirms whether the 22/3 Attendance was entirely test data;
4. linked Pending/Retroactive/Vacation records are absent or formally resolved;
5. Main Stock is proven unchanged by the incident;
6. if the record is test data, remove it only through the protected Attendance
   delete workflow so Room Stock is restored by ETag and ROLLBACK audit records
   are created; never set Room Stock directly;
7. verify Attendance is absent, Room Stock delta is +22 from the immediate
   pre-delete value, Main Stock delta is zero, and the new ledger/stockLog both
   reference `mqn0z13eyx5b_2026-07-28`;
8. take a post-action Backup and record its SHA-256/root ETag;
9. product owner signs the incident closure evidence.

If the Attendance was legitimate operational data, retain it and document why
1,253 was correct. Do not add 22 boxes merely to match the recorded baseline.

## Safety boundary

This document and the audit program do not authorize a Production write,
manual stock repair, Restore, Rules deployment, `main` merge, release tag, or
traffic cutover.
