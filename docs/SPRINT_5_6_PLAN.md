# Sprint 5.6 — Classroom Distribution and Distribution History

Date: 2026-07-31

Branch: `feature/sprint-5.6-room-distribution`

Status: **AUTOMATED PASS — 69/69 / LIVE SERVER WRITE GATE PENDING**

## Goal

เพิ่มการจ่ายนมจาก Main Stock ไปยัง Room Stock ในหน้า Admin V2 ตามสูตร
`จำนวนนักเรียนจริง × จำนวนวัน` พร้อมประวัติรายการแบบ scalable และการป้องกัน
คำสั่งซ้ำหรือ Admin อีกหน้าตัด Main Stock ซ้ำ

## Gate A — Distribution formula and source roster

- ห้องต้องมี `roomId` และจำนวนนักเรียนจริงมากกว่าศูนย์;
- generated fallback rows เช่น `student_*` ไม่ถูกนำมาคิดซ้ำ;
- total = students × days;
- crates = floor(total ÷ perCrate), boxes = total mod perCrate;
- วันที่จ่าย ห้อง จำนวนวัน และกล่องต่อลังต้องผ่าน validation;
- ห้อง `mqn0z13eyx5b` วันที่ `2026-07-28` ยังคงถูกกักกันและห้ามเขียน.

## Gate B — Stock transfer invariants

- Main Stock ลดลงเท่ากับ total เท่านั้น;
- Room Stock ของห้องปลายทางเพิ่มขึ้นเท่ากับ total เท่านั้น;
- ห้องอื่นและ Teacher operations ไม่ถูกเขียน;
- Main Stock, Room Stock, distribution record และ `DISTRIBUTE` ledger อยู่ใน
  Firebase multi-location update ชุดเดียว;
- Main Stock ไม่ถูก rebuild, clamp หรือปรับยอดย้อนหลังอัตโนมัติ.

## Gate C — Duplicate and concurrency protection

- ทุกการ submit มี stable operation id;
- operation id ที่สำเร็จแล้วคืนผลเดิมและไม่เขียน Stock ซ้ำ;
- operation id เดิมห้ามใช้กับห้อง/วันที่/จำนวนอื่น;
- distribution lock ใช้ Firebase ETag และ `If-Match` ก่อนอ่านยอดล่าสุด;
- lock ที่ยังไม่หมดอายุบล็อก Admin อีกหน้า;
- lock หมดอายุสามารถ takeover ด้วย conditional write เท่านั้น;
- completion marker อยู่ใน atomic update เดียวกับ Stock เพื่อรองรับ network
  uncertainty หลังบันทึกสำเร็จ.

การป้องกันนี้ครอบคลุม Admin V2 ทุกหน้าที่ใช้ Sprint 5.6 แต่ระบบเดิมไม่ได้ใช้
lock เดียวกัน ดังนั้นช่วง browser acceptance ให้มี Admin writer คนเดียวและห้าม
เปิดฟอร์มจ่ายนมจาก `index.html` พร้อมกัน

## Gate D — Scalable history

- discover distribution keys with `shallow=true`;
- hydrate only date, room, formula, quantity, Stock before/after, year, and note;
- do not request photos, signatures, or unrelated record children;
- sort newest first;
- show current Main Stock, record count, and total distributed boxes;
- history is read-only in this Sprint; edit/delete differential remains deferred.

## Gate E — Admin V2 boundary

- add separate `จ่ายนมให้ห้อง` and `ประวัติการจ่ายนม` menu entries;
- View owns DOM and confirmation only;
- Manager owns draft operation id, lifecycle, refresh, and events;
- Service owns Admin validation, real-student formula, quarantine, and workflow;
- Repository owns Firebase paths, summary query, ETag lock, and atomic updates;
- `index.html` and `teacher.html` remain byte-identical to Sprint 5.5.

## Automated acceptance

- classroom formula and actual-roster normalization: **PASS**;
- Main/Room Stock transfer isolation: **PASS**;
- atomic distribution + ledger + completion marker: **PASS**;
- repeated operation id does not deduct again: **PASS**;
- concurrent live lock blocks a second writer: **PASS**;
- scalable media-free history: **PASS**;
- Service/Manager/View boundary: **PASS**;
- complete regression: **PASS, 69/69**.

## Browser acceptance pending

1. open Admin V2 `จ่ายนมให้ห้อง`;
2. verify actual Main Stock and selected Room Stock before saving;
3. verify student count equals the actual room roster;
4. verify formula and crate/box remainder;
5. use one controlled real distribution only after checking physical milk and
   the official distribution document;
6. confirm Main Stock decreases and Room Stock increases by exactly total;
7. confirm one distribution, one `DISTRIBUTE` ledger, and one completion marker;
8. refresh/retry the same completed operation in an isolated database and
   confirm no second deduction;
9. simulate a second Admin lock in an isolated database and confirm blocking;
10. open history and verify media-free scoped reads, newest-first order,
    Desktop/Responsive layout, clean Console, and expected Network traffic.

Do not create a simulated distribution in the real Firebase database. Do not
use the quarantined room/date, run legacy and V2 distribution forms together,
edit/delete distribution history, merge to `main`, or enable Production traffic.
