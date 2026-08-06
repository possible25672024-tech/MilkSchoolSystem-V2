# Sprint 5.7 — Operational Summaries and Period Reports

Date: 2026-07-31

Branch: `feature/sprint-5.7-operational-reports`

Status: **AUTOMATED PASS — 74/74 / LIVE SERVER BROWSER GATE PENDING**

## Goal

เพิ่มสรุปการบริหารจัดการนมและรายงานการจ่ายนมตามช่วงเวลาใน Admin V2
โดยรองรับรายวัน รายสัปดาห์ รอบครึ่งเดือน 15 วัน รายเดือน และภาคเรียน
พร้อม A4/CSV และรักษาขอบเขตอ่านอย่างเดียว

## Gate A — Period contract

- รายวันใช้วันที่อ้างอิงหนึ่งวัน;
- รายสัปดาห์ใช้วันจันทร์ถึงวันอาทิตย์ของสัปดาห์ที่เลือก;
- รอบ 15 วันแบ่งเป็นวันที่ 1–15 และวันที่ 16–วันสุดท้ายของเดือน;
- รายเดือนใช้วันแรกถึงวันสุดท้ายของเดือน;
- ภาคเรียนต้องระบุวันเริ่มและวันสิ้นสุดอย่างชัดเจน;
- ปฏิเสธวันที่ไม่ถูกต้องและช่วงภาคเรียนที่วันเริ่มอยู่หลังวันสิ้นสุด.

## Gate B — Management summary formula

- รับเข้า = ผลรวม `receives.total` ในช่วง;
- จ่ายให้ห้อง = ผลรวม `distributes.total` ในช่วง;
- ใช้รวม = Attendance + Pending + Retroactive + Vacation ในช่วง;
- สุทธิช่วง = จ่ายให้ห้อง − ใช้รวม;
- แสดงรายห้อง รายระดับชั้น และทั้งโรงเรียน;
- ไม่นับ generated fallback `student_*` เป็นนักเรียนจริง;
- Main Stock และ Room Stock ที่แสดงต้องระบุชัดว่าเป็นยอดปัจจุบัน ไม่ใช่ยอด
  สิ้นงวดที่สร้างย้อนหลัง.

## Gate C — Distribution report

- แสดงวันที่ ห้อง นักเรียน จำนวนวัน ลัง กล่องเศษ รวม Main Stock ก่อน/หลัง
  และหมายเหตุ;
- เรียงรายการตัด Main Stock จากเก่าไปใหม่ โดยใช้เวลาบันทึก และใช้สาย
  `stockBefore → stockAfter` เป็น fallback สำหรับข้อมูลเก่าที่ไม่มีเวลา;
- จำนวนรายการ จำนวนห้อง และจำนวนกล่องรวมต้องมาจากรายการในช่วงเดียวกัน;
- ประวัติยังเป็น read-only ไม่มีแก้ไข ลบ หรือปรับส่วนต่างใน Sprint นี้.

## Gate D — Scalable read boundary

- discover collection keys ด้วย `shallow=true`;
- Attendance ตัดรายการนอกช่วงจากวันที่ใน key ก่อนโหลด `/data`;
- collection อื่นอ่าน date fields ก่อน แล้ว hydrate เฉพาะ summary fields ของ
  รายการในช่วง;
- ไม่โหลด photo, media, signature หรือ evidence;
- browser-local Pending, Retroactive และ Vacation ถูกกรองช่วงก่อนรวมยอด;
- Repository ไม่มีคำสั่ง set/update/remove และ View ไม่เข้าถึง Firebase.

## Gate E — Admin output

- เมนูแยก `สรุปบริหารจัดการนม` และ `รายงานการจ่ายนม`;
- responsive period controls และตารางเลื่อนแนวนอนได้;
- พิมพ์ A4 แนวนอน;
- CSV มี UTF-8 BOM และหัวตารางภาษาไทย;
- `index.html` และ `teacher.html` ต้อง byte-identical กับ Sprint 5.6.

## Automated acceptance

- period calculation and validation: **PASS**;
- period summary and stock-isolation formula: **PASS**;
- out-of-range hydration prevention: **PASS**;
- media/signature exclusion: **PASS**;
- Admin View, A4, and UTF-8 CSV boundary: **PASS**;
- Thai grade/room and Main Stock chronology ordering: **PASS**;
- complete regression: **PASS, 74/74**.

## Browser acceptance pending

1. เปิด Admin V2 แล้วเลือก `สรุปบริหารจัดการนม`;
2. ตรวจทั้ง 5 รอบรายงานกับข้อมูลจริง;
3. เปรียบเทียบยอดรับเข้า จ่ายห้อง และใช้รวมกับประวัติจริงในช่วงเดียวกัน;
4. สลับรายห้อง รายระดับ และทั้งโรงเรียน;
5. เปิด `รายงานการจ่ายนม` และเทียบรายการกับประวัติ Sprint 5.6;
6. ตรวจ A4 และ CSV ภาษาไทย;
7. ตรวจ Desktop และ Responsive;
8. Console ไม่มี application error;
9. Network ของสองเมนูเป็น GET เท่านั้นและไม่มี media/signature payload;
10. ยืนยันว่า Main Stock และ Room Stock ไม่เปลี่ยนหลังโหลด/พิมพ์/ส่งออก.

ห้ามสร้างข้อมูลทดลองใน Firebase จริง ห้ามแก้หรือลบประวัติการจ่าย ห้ามปรับ
Stock จากรายงาน ห้ามแก้ `index.html`/`teacher.html` และห้าม merge `main` หรือ
เปิด Production traffic.
