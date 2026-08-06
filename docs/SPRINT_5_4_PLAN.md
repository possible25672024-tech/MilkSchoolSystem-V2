# Sprint 5.4 — Milk Receipt and Receipt History

Date: 2026-07-31

Branch: `feature/sprint-5.4-stock-audit-receipts`

Status: **AUTOMATED PASS — 64/64 / LIVE SERVER BROWSER GATE PENDING**

## Goal

เพิ่มเมนูรับนมจาก อบต. สำหรับ Admin โดยรับเข้า Main Stock เท่านั้น บันทึก
receipt และ `RECEIVE` ledger ใน multi-location update เดียว และโหลดประวัติ
แบบย่อโดยไม่ดึงรูปหรือหลักฐานขนาดใหญ่

## Gate A — Receipt calculation

- total = crates × boxes per crate + extra boxes;
- crates and boxes per crate are positive integers;
- extra boxes are a non-negative integer;
- receipt date is required;
- successful receipt increases Main Stock by total;
- receipt never changes Room Stock.

## Gate B — Receipt persistence

- use `StockService.receiveMilk`;
- one Firebase multi-location update contains Main Stock, receipt, and ledger;
- source and user remain Admin;
- history records date, supplier, crates, extra, per-crate count, total, and
  note;
- no Attendance, Pending, Retroactive, Vacation, Queue, or room record is
  written.

## Gate C — Scalable history

- discover receipt keys with `shallow=true`;
- hydrate only receipt summary fields;
- do not request receipt photos, signatures, or unrelated children;
- sort newest receipt first;
- expose actual Main Stock alongside history.

## Gate D — Stock audit handoff

- the Dashboard explains the complete stock path;
- per-room trace calculates a read-only opening-balance candidate;
- 54 real-data differences are classified as missing opening/legacy history,
  not automatically repaired;
- three negative rooms remain visible;
- `rebuildAndPersist` remains forbidden on the real dataset.

## Browser acceptance

1. open Admin `รับนมจาก อบต.`;
2. verify actual Main Stock before saving;
3. enter a controlled receipt and verify the preview formula;
4. confirm Main Stock increases by exactly the receipt total;
5. confirm Room Stock values do not change;
6. confirm one receipt and one `RECEIVE` ledger are created;
7. confirm refresh does not duplicate the receipt;
8. confirm receipt history excludes media payloads;
9. verify Desktop and Responsive layouts;
10. verify clean Console and scoped Firebase traffic.

The current multi-location update is atomic for the included paths but is not
an ETag transaction across simultaneous Admin clients. Browser acceptance must
use one Admin writer. Multi-admin concurrency remains blocked for production
cutover and must be hardened before the Admin distribution Sprint is approved.

This Sprint does not authorize Main Stock rebuild, Room Stock correction,
legacy-file changes, `main` merge, or Production traffic.
