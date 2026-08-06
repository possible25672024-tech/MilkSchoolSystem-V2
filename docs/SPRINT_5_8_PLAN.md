# Sprint 5.8 — Admin System Tools

Date: 2026-07-31

Branch: `feature/sprint-5.8-admin-system-tools`

Status: **AUTOMATED PASS — 78/78 / BROWSER ACCEPTANCE PENDING**

## Goal

ปิด Admin parity ตาม roadmap ด้วยเมนู **เอกสารที่เกี่ยวข้อง**, **ตั้งค่าระบบ**,
**สำรอง/กู้คืน** และการถ่ายโอนไฟล์ผ่าน **Google Drive** โดยไม่เปลี่ยนสูตร
Main Stock/Room Stock และไม่แก้ `index.html` หรือ `teacher.html`.

## Documents

- รายการเอกสารอ่านเฉพาะ metadata จาก `milkApp/documents`;
- ไฟล์จริงอ่านจาก `milkApp/documentFiles/{id}` เมื่อผู้ใช้กดดาวน์โหลดเท่านั้น;
- รองรับ PDF/JPG/JPEG/PNG ไม่เกิน 12 MB;
- metadata และไฟล์จริงบันทึกหรือลบด้วย multi-location update เดียว;
- View ไม่เรียก Firebase โดยตรง.

## Settings

- แก้ชื่อโรงเรียน ปีการศึกษา ภาคเรียน จำนวนกล่องต่อลัง และระดับเตือน;
- รักษา Firebase URL, credential และค่าเดิมที่ไม่อยู่ในฟอร์ม;
- บันทึกด้วย ETag/If-Match และยกเลิกเมื่อมีผู้ใช้อื่นแก้พร้อมกัน;
- ไม่แสดง credential บนหน้าจอ.

## Backup and restore

- สำรองข้อมูลใต้ `milkApp` ทั้งหมด รวม metadata, evidence และไฟล์เอกสาร;
- ใช้ envelope `MilkSchoolSystemV2Backup` version 1;
- คำนวณและตรวจ **SHA-256** ก่อนอนุญาตให้กู้คืน;
- preview แสดงจำนวนข้อมูลในไฟล์เทียบกับข้อมูลปัจจุบัน;
- ผู้ใช้ต้องดาวน์โหลดข้อมูลปัจจุบันก่อนกู้คืน;
- ผู้ใช้ต้องพิมพ์ **กู้คืนข้อมูล** และยืนยันขั้นสุดท้าย;
- กู้คืนทั้ง root ด้วย ETag ที่อ่านตอน preview;
- conflict ยกเลิกการกู้คืนทั้งหมดและไม่เขียนทับข้อมูลใหม่;
- บันทึก restore audit ใน payload ที่กู้คืน.

## Google Drive boundary

- ดาวน์โหลดไฟล์สำรองที่ตรวจ SHA-256 แล้วสำหรับอัปโหลดไป Drive;
- เปิด Google Drive ในแท็บใหม่;
- ตรวจไฟล์ที่ดาวน์โหลดกลับจาก Drive ก่อนส่งต่อไปขั้นกู้คืน;
- ไม่มี OAuth อัตโนมัติและไม่เก็บบัญชีหรือรหัสผ่าน Google.

## Safety boundary

- ห้ามทดสอบ restore กับ Firebase Production;
- browser acceptance ของ restore ต้องใช้อินสแตนซ์แยกเท่านั้น;
- การสร้าง/ดาวน์โหลด backup เป็น read-only และไม่เปลี่ยน Stock;
- Document/Settings เป็นการเขียนเฉพาะเมื่อผู้ดูแลยืนยัน;
- ไม่ auto-repair ประวัติ Main Stock ที่ผิดปกติในข้อมูลเดิม;
- legacy stock anomaly เช่น `109310 → 5560` ต้องถูกตรวจแยก ไม่ใช่แก้ผ่าน restore.

## Automated acceptance

- settings isolation and ETag gate;
- document metadata-on-demand gate;
- full backup integrity and protected restore gate;
- Sprint plan gate;
- complete regression target: **78/78**;
- protected `index.html` and `teacher.html`: byte-identical.

## Browser acceptance pending

1. เปิด 4 เมนูบน Desktop และ Responsive;
2. โหลดรายการเอกสารโดย Network ไม่โหลด `documentFiles` จนกดดาวน์โหลด;
3. ทดสอบอัปโหลดเอกสารขนาดเล็กในข้อมูลทดสอบ;
4. แก้ค่าทั่วไปและตรวจ conflict ด้วย Admin สองหน้าในข้อมูลทดสอบ;
5. ดาวน์โหลด backup และตรวจว่าสรุป/ชื่อไฟล์/SHA-256 แสดง;
6. ตรวจไฟล์ backup ที่เดิมและไฟล์ที่แก้ 1 ค่า;
7. ทดสอบ restore เฉพาะ Firebase แยก แล้วตรวจ stock/rooms/documents/evidence;
8. ตรวจ Console ไม่มี application error;
9. ยืนยัน `index.html` และ `teacher.html` เดิมยังทำงานและไม่เปลี่ยน.

Sprint 5.8 ไม่อนุญาต `main`, Production restore, Firebase rule change,
legacy replacement หรือ Production traffic switch.

## Remaining delivery sequence

หลัง Sprint 5.8 เหลือ **2 Sprint** เพื่อจบรุ่นใช้งานปัจจุบัน:

- **Sprint 5.9 — Integration, Security and UAT**: Browser acceptance ทุกเมนู,
  isolated concurrency/restore rehearsal, ตรวจและปิด stock anomaly/incident,
  Firebase Rules hardening และ Release Candidate;
- **Sprint 6.0 — Production Readiness and Release**: production backup,
  deploy/rollback rehearsal, เอกสารส่งมอบ, `main` approval, tag, deploy และ
  post-deploy smoke test.

Plugin SDK, language pack และ multi-school orchestration ขั้นสูงเป็น product
expansion ภายหลัง ไม่ใช่ blocker ของรุ่นใช้งานโรงเรียนปัจจุบัน.
