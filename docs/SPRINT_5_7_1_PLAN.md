# Sprint 5.7.1 — Report Ordering Correction

Date: 2026-07-31

Branch: `feature/sprint-5.7.1-report-ordering`

Status: **AUTOMATED PASS — 74/74 / BROWSER ACCEPTANCE PENDING**

## Goal

แก้ลำดับรายงานตามผลตรวจหน้าจอ Sprint 5.7 โดยไม่เปลี่ยนสูตร ยอด Stock
ข้อมูล Firebase หรือขอบเขต read-only ของรายงาน

## Ordering contract

- รายห้องเรียงระดับต่ำขึ้นก่อน: `อ.2`, `อ.3`, `ป.1` ถึง `ป.6` และระดับที่
  สูงกว่าต่อจากนั้น;
- ห้องในระดับเดียวกันเรียงหมายเลขธรรมชาติ เช่น ห้อง 2 มาก่อนห้อง 10;
- ใช้ลำดับเดียวกันในหน้าจอ รายงานพิมพ์ และไฟล์ส่งออก;
- รายการจ่ายห้องเรียงจากรายการเก่าไปใหม่ด้วย `createdAt`;
- ข้อมูลเก่าที่ไม่มี `createdAt` เรียงด้วยสาย `stockBefore → stockAfter`;
- ไม่แก้ไขยอด Main Stock, Room Stock, รายการจ่าย หรือประวัติใด ๆ.

## Automated acceptance

- Thai grade and natural room ordering: **PASS**;
- chronological Main Stock deduction ordering: **PASS**;
- legacy stock-chain fallback: **PASS**;
- complete regression: **PASS, 74/74**;
- protected `index.html` and `teacher.html`: **UNCHANGED**.

## Browser acceptance pending

1. พิมพ์รายงานรายห้องและตรวจลำดับ `อ.2 → อ.3 → ป.1 ... ป.6`;
2. เปิดรายงานการจ่ายนมวันที่มีหลายรายการ;
3. ตรวจว่า Main Stock หลังของแถวก่อนตรงกับ Main Stock ก่อนของแถวถัดไป
   ภายในสายเดียวกัน;
4. ตรวจ CSV/A4 ว่าใช้ลำดับเดียวกับหน้าจอ;
5. ยืนยันว่า Main Stock และ Room Stock ไม่เปลี่ยนหลังโหลด พิมพ์ หรือส่งออก.
