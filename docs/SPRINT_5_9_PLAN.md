# Sprint 5.9 — Integration, Security and UAT

Date: 2026-07-31

Branch: `feature/sprint-5.9-integration-security-uat`

Status: **AUTOMATED PASS — 81/81 / LIVE BROWSER AND ISOLATED FIREBASE UAT PENDING**

## Goal

รวมงาน Admin Sprints 5.3–5.8 ให้พร้อมตรวจรับ โดยแก้ปัญหาที่พบจาก Browser
Acceptance จริง ตรวจความสมบูรณ์ของประวัติ Main Stock และเตรียม UAT/Restore
rehearsal โดยไม่แก้ยอดจริงย้อนหลัง ไม่เปลี่ยน Firebase schema และไม่แตะไฟล์ legacy.

## Browser acceptance corrections

- ปุ่ม `ดูรายชื่อ` ในหน้าจัดการห้องเรียนต้องเปิด section
  `รายงานนักเรียน` และเลื่อนไปยังรายชื่อห้องที่เลือก;
- แสดงยอดจำนวนห้อง/นักเรียนเดิมได้ แต่ต้องบอกชัดเมื่อห้องมีเพียงยอดรวมและ
  ไม่มี roster รายคน;
- Sidebar แบ่งเป็น หน้าหลัก, เอกสาร, รับนม, นักเรียน, จ่ายนม, รายงาน,
  เช็กดื่มนม และตั้งค่า ตามลำดับอ้างอิง โดยรักษาเมนูเดิมครบ 19 รายการ;
- ปุ่ม Logout และตัวเลือกห้องยังคงทำงานเดิม.

## Scalable backup correction

- ห้ามอ่าน `milkApp` ทั้งก้อนพร้อม ETag เพราะฐานจริงตอบ `413 Payload is too large`;
- อ่าน root key แบบ `shallow=true` พร้อม ETag ก่อนเริ่ม;
- โหลด top-level child แยกกัน และเมื่อ child ใหญ่เกินให้ค้น key แบบ shallow
  แล้ว hydrate ทีละรายการ;
- ตรวจ root ETag ซ้ำหลังอ่านครบ ถ้าข้อมูลเปลี่ยนให้ลองใหม่แบบจำกัดครั้งและ
  ยกเลิกเมื่อยังไม่เสถียร;
- restore preview อ่านเฉพาะ settings, stock และ shallow collection counts;
- checksum ยังคำนวณจากข้อมูลสำรองครบทั้ง `milkApp`;
- restore ยังต้องใช้ root ETag, safety backup, คำยืนยัน และ isolated Firebase.

## Stock integrity review

- รายงานการจ่ายคำนวณ `expectedStockAfter = stockBefore - total` ทุกแถว;
- แถวที่บันทึก `stockAfter` ไม่ตรงต้องแสดงคำเตือนและยอดที่ควรเป็น;
- CSV/A4 ต้องพกผลตรวจยอดไปด้วย;
- ห้ามแก้, rebuild หรือเขียนยอดย้อนหลังอัตโนมัติ;
- สายยอดที่กระโดดเพราะมีการรับเข้าใหม่ไม่ถือว่าผิด หากสูตรในแถวนั้นถูกต้อง.

## Security boundary

- View ห้ามเรียก Firebase, fetch หรือ browser storage โดยตรง;
- Backup/Restore ไม่แสดง Firebase credential และไม่เก็บบัญชี Google;
- ไฟล์สำรองมีข้อมูลส่วนบุคคล ต้องเก็บในพื้นที่จำกัดสิทธิ์และห้ามแนบใน issue;
- Firebase Rules deployment ต้องทำในอินสแตนซ์แยกหลังบันทึก auth model และ
  rollback rule version ห้ามเปลี่ยน Production Rules จาก Sprint นี้;
- restore rehearsal ห้ามใช้ Production.

## Automated acceptance

- functional roster navigation gate;
- reference-order Admin navigation gate;
- chunked 413 backup and before/after root ETag gate;
- existing SHA-256, schema, typed confirmation and restore conflict gates;
- read-only Main Stock anomaly gate;
- complete regression: **81/81**;
- protected `index.html` and `teacher.html`: unchanged.

## Live browser and isolated Firebase UAT pending

1. เปิด `จัดการห้องเรียน` กด `ดูรายชื่อ` และยืนยันว่าเปิดห้องที่เลือกจริง;
2. ตรวจรายชื่อห้องที่มี roster จริง และข้อความห้องที่มีเพียงยอดรวม;
3. ตรวจ Sidebar บน Desktop และ Responsive รวมการ scroll และ Logout;
4. ดาวน์โหลด Backup จริงและยืนยันว่าไม่มี Firebase 413;
5. ตรวจชื่อไฟล์, summary, SHA-256 และ JSON parse;
6. ทำ Backup ขณะมีผู้ใช้อื่นเปลี่ยนข้อมูลในอินสแตนซ์ทดสอบและยืนยันว่า retry/
   cancel ทำงานโดยไม่สร้าง snapshot ผสม;
7. Restore เฉพาะ Firebase แยก แล้วเทียบ settings, stock, rooms, rosters,
   histories, documents และ evidence;
8. เปิดรายงานการจ่ายและตรวจคำเตือนแถว `109310 → 5560` โดยยืนยันว่าไม่มี PUT,
   PATCH หรือ DELETE;
9. ตรวจ Console ไม่มี application error และ Network ตรงตาม action;
10. บันทึก UAT signer, เวลา, commit และฐานทดสอบก่อนอนุมัติ Release Candidate.

Sprint 5.9 ไม่อนุญาต Production restore, Firebase Rules deployment,
`main` merge, legacy replacement หรือการแก้ stock ย้อนหลังอัตโนมัติ.

หลังผ่าน Browser/isolated UAT จึงเข้าสู่ Sprint 6.0 Production Readiness and
Release ซึ่งเป็น Sprint สุดท้ายของรุ่นใช้งานปัจจุบัน.
