# Sprint 5.3 — Admin System and Stock Dashboard

Date: 2026-07-31

Branch: `feature/sprint-5.3-admin-dashboard`

Status: **AUTOMATED PASS — 63/63 / LIVE SERVER BROWSER GATE PENDING**

## Goal

เพิ่มหน้า `ภาพรวมระบบ` สำหรับ Admin เพื่อดูสถานะโรงเรียนและสต็อกที่สำคัญ
จากข้อมูลจริง โดยไม่สร้างรายชื่อนักเรียนสมมติ ไม่โหลด Attendance พร้อม media
ทั้งก้อน และไม่เขียน Main Stock หรือ Room Stock

## Gate A — Actual student roster integrity

- normalize คอลัมน์ไทย `รหัสประจำตัว`, `เลขที่`, `ชื่อ-นามสกุล`;
- หน้ารายละเอียดและหน้าแก้ไข Attendance ใช้รายชื่อจริงของห้อง;
- ไม่รวม key สำรอง `student_*` เข้ากับรายชื่อจริงจนจำนวนเพิ่มเป็นสองเท่า;
- ถ้ามี roster จริง ให้แสดงเฉพาะสมาชิกใน roster ปัจจุบัน;
- ไม่สร้างนักเรียนสมมติจากแถวว่าง.

## Gate B — Read-only stock overview

- แสดง Main Stock จริง;
- แสดง Room Stock จริงรวมทุกห้อง;
- แสดงยอดนมคงเหลือทั้งระบบ;
- แสดงจำนวนห้อง นักเรียน และยอดใช้รวมจาก Report model ที่ผ่าน gate;
- เปรียบเทียบ Room Stock จริงกับยอดตามประวัติรายห้อง;
- แยกสถานะ `ปกติ`, `สต็อกหมด`, `ยอดไม่ตรง`, `ติดลบ`.

## Gate C — Architecture and scalability

- View เรียก Manager เท่านั้น;
- Manager ประสาน Report model กับ Service;
- Service อ่าน Main Stock และ Room Stock ผ่าน StockRepository;
- ใช้ Report scalable query เดิมและไม่โหลด historical media;
- ไม่มี Firebase write, Queue, ledger, stockLog, rebuild หรือ repair;
- refresh หนึ่งครั้งอ่าน Main Stock และ Room Stock อย่างละหนึ่งครั้ง.

## Gate D — Browser acceptance

1. เข้าระบบ Admin และเห็น `ภาพรวมระบบ` เป็นหน้าแรก;
2. จำนวนห้องและนักเรียนตรงกับข้อมูลจริง;
3. Main Stock ตรงกับระบบเดิม;
4. Room Stock รวมเท่ากับผลรวมยอดจริงรายห้อง;
5. ตารางสถานะแสดงครบและไม่ตกขอบบน Desktop;
6. Chrome Responsive แสดงบัตรสรุปหนึ่งคอลัมน์และอ่านตารางได้;
7. Network ไม่มีการโหลด `mcAttendance.json` ทั้งก้อน;
8. Console ไม่มี application error;
9. การเปิดและ refresh Dashboard ไม่เปลี่ยน Stock;
10. ห้องกักกันยังไม่ถูกใช้เป็นหลักฐานอนุมัติ Production.

Sprint นี้ไม่อนุญาตให้แก้ `index.html` หรือ `teacher.html`, เปลี่ยน Firebase
schema/rules, rebuild/repair stock, merge `main`, หรือเปิด Production traffic.
