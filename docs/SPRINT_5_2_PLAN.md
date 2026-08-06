# Sprint 5.2 — Admin Inline Attendance Edit

Date: 2026-07-30

Branch: `feature/sprint-5.2-admin-inline-attendance`

Status: **AUTOMATED PASS — 62/62 / LIVE SERVER BROWSER GATE PENDING**

## Goal

ให้ผู้ดูแลระบบเปิดและแก้ไขรายการเช็กดื่มนมของวันที่เลือกภายในหน้า
Admin โดยไม่เปลี่ยน session ไปหน้า Teacher และไม่ทำให้ผู้ใช้หลุดจากห้องหรือ
เมนูที่กำลังตรวจสอบ

## Gate A — Admin-owned interaction

- ปุ่ม `เปิดแก้ไข` เปิดแบบฟอร์มภายในส่วน `ประวัติดื่มนม`;
- ผู้ใช้ยังคงเป็น Admin ตลอดการแก้ไข;
- แบบฟอร์มแก้ไขสถานะ `ดื่มนม` / `ไม่ดื่มนม` และหมายเหตุรายคน;
- ยกเลิกหรือบันทึกแล้วกลับสู่ตาราง Admin เดิม;
- ปุ่ม `เปิดเมนูครูห้องนี้` ยังคงเป็นทางเลือกแยกสำหรับงาน Teacher parity.

## Gate B — Data ownership and evidence safety

- View ไม่อ่านหรือเขียน Firebase โดยตรง;
- Service โหลดข้อมูลเต็มเฉพาะวันเดียวหลัง Admin กดแก้ไข;
- รายการประวัติทั่วไปยังใช้ข้อมูลสรุปที่ไม่มี media;
- การบันทึกเก็บรูปและลายเซ็นเดิมจาก record ต้นฉบับ;
- View ไม่สามารถแทนที่หรือลบหลักฐานเดิมโดยไม่ตั้งใจ.

## Gate C — Stock, audit, and recovery

- การบันทึกเรียก Attendance Service ที่ผ่าน gate แล้ว;
- คำนวณส่วนต่าง `Room Stock` จากจำนวนดื่มนมเดิมและใหม่;
- ใช้ ETag compare-and-retry และ audit เดิม;
- partial save เข้าคิว Room Stock-only หรือ audit-only recovery;
- `Main Stock` ไม่เปลี่ยนแปลง;
- ห้องและวันที่กักกันยังห้ามแก้ไขและลบ.

## Gate D — Admin parity roadmap

เมนู Admin จากระบบเดิมจะทยอยย้ายตามขอบเขตต่อไปนี้:

- **Sprint 5.3** — ภาพรวมระบบ, Dashboard สต็อก และสถานะการทำงาน;
- **Sprint 5.4** — รับนมจาก อบต. และรายการรับนมทั้งหมด;
- **Sprint 5.5** — นำเข้าข้อมูลนักเรียน, จัดการห้อง และรายงานนักเรียน;
- **Sprint 5.6** — จ่ายนมให้ห้องเรียนและรายการจ่ายนมทั้งหมด;
- **Sprint 5.7** — สรุปการบริหารจัดการนม, รายงานการจ่ายนม,
  สรุปรายวัน/รายสัปดาห์/15 วัน/รายเดือน/ภาคเรียน และ A4/CSV;
- **Sprint 5.8** — เอกสารที่เกี่ยวข้อง, ตั้งค่าระบบ, สำรอง/กู้คืน
  และซิงก์ Google Drive.

แต่ละ Sprint ต้องผ่าน Service/Manager/View isolation, stock formula,
responsive browser, Console/Network และ complete regression ก่อนเริ่ม Sprint
ถัดไป

## Gate E — Full saved-record history

- ปุ่ม `ดู` ไม่ใช้ browser alert และไม่สลับไปหน้า Teacher;
- Admin โหลด record เต็มเฉพาะรายการที่กดผ่าน Service/Repository;
- ประวัติดื่มนมแสดงรายชื่อ สถานะ หมายเหตุ รูป และลายเซ็นครู;
- นมค้าง ย้อนหลัง และปิดเทอมแสดงช่วงเวลา จำนวน รายชื่อนักเรียนที่หาได้
  รูป และลายเซ็นที่บันทึก;
- recordId ต้องตรงกับห้องที่เลือกก่อนแสดง;
- ตารางรายการทั่วไปยังโหลดเฉพาะ summary และไม่ดึง media ทั้งห้อง.

## Browser acceptance

1. เข้าระบบด้วย Admin และเลือกห้อง;
2. เปิด `ประวัติดื่มนม` แล้วกด `เปิดแก้ไข`;
3. แบบฟอร์มแสดงในหน้า Admin โดย sidebar และสิทธิ์ Admin ยังอยู่;
4. เปลี่ยนหนึ่งคนแล้วบันทึก;
5. ตาราง Admin โหลดค่าใหม่;
6. Room Stock เปลี่ยนเฉพาะส่วนต่างที่ถูกต้อง;
7. รูปและลายเซ็นเดิมยังอยู่เมื่อเปิดรายงาน;
8. กด `ดู` แล้วข้อมูลต้นฉบับทั้งรายการเปิดในหน้า Admin โดยไม่แสดง alert;
9. ทดสอบ `ดู` ในทั้ง 4 เมนู และตรวจว่าห้อง/รายการตรงกัน;
10. Console ไม่มี application error;
11. หน้าจอ desktop และ Responsive ไม่ตกขอบ.

Sprint นี้ไม่อนุญาตให้แก้ `index.html` หรือ `teacher.html`, เปลี่ยน Firebase
schema/rules, deploy `main`, หรือเปิด Production traffic.
