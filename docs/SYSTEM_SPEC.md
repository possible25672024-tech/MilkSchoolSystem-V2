# MilkSchoolSystem V2
# System Specification (SYSTEM_SPEC)

Version : 2.0.0

Status : Draft

Last Update : 2026-07-14

---

# 1. Objective

MilkSchoolSystem V2 เป็นระบบบริหารจัดการนมโรงเรียนที่สามารถติดตั้งให้โรงเรียนใดก็ได้

ผู้ใช้งานไม่จำเป็นต้องแก้ไข Source Code

เพียงกำหนด

- ชื่อโรงเรียน
- โลโก้
- Firebase Config

ระบบต้องพร้อมใช้งานทันที

---

# 2. System Goals

- รองรับทุกโรงเรียน
- ติดตั้งภายใน 5 นาที
- เปลี่ยนฐานข้อมูลได้
- สำรองข้อมูลได้
- กู้คืนข้อมูลได้
- อัปเกรดระบบได้
- ไม่ทำให้ข้อมูลสูญหาย

---

# 3. User Roles

Administrator

- จัดการระบบ
- จัดการ Stock
- จัดการครู
- จัดการห้องเรียน
- จัดการนักเรียน
- ดูรายงาน
- Backup
- Restore

Teacher

- รับนมเข้าห้อง
- จ่ายนม
- เช็คดื่ม
- นมค้าง
- นมย้อนหลัง
- ปิดเทอม

Viewer (Future)

- อ่านรายงาน

---

# 4. Core Modules

Configuration

Authentication

Stock

Room

Student

Teacher

Distribution

Report

Backup

Restore

Settings

Audit

Logger

Installer

---

# 5. Stock Rules

Main Stock

↓

Room Stock

↓

Teacher

↓

Report

Main Stock

ลดเฉพาะ

จ่ายให้ห้องเรียน

Teacher

ลดเฉพาะ

Room Stock

Recalculate

ใช้ Transaction History เท่านั้น

ห้ามใช้ Remaining Stock

---

# 6. Configuration

ต้องสามารถเปลี่ยนได้

School Name

Logo

Theme

Academic Year

Province

District

Firebase

Language (Future)

---

# 7. Firebase Collections

settings

schools

teachers

students

rooms

roomStock

stockTransactions

distributionHistory

reports

backup

auditLogs

systemLogs

---

# 8. Business Rules

ทุก Transaction

ต้องมี Timestamp

ทุก Transaction

ต้องมี User

ทุก Transaction

ต้อง Rollback ได้

ทุก Transaction

ต้อง Sync ได้

---

# 9. Backup

Manual

Automatic

ZIP

JSON

Firebase Export

---

# 10. Restore

ตรวจสอบ Version

ก่อน Restore

Migration

ต้องทำอัตโนมัติ

---

# 11. Performance

โหลดหน้าแรก

< 3 วินาที

โหลดห้องเรียน

< 2 วินาที

Report

< 5 วินาที

---

# 12. Security

Firebase Rules

Role Based Access

Audit Log

Version Check

---

# 13. Testing

Unit Test

Integration Test

Regression Test

User Acceptance Test

---

# 14. Future

Plugin

Theme

Cloud Sync

API

Mobile App

Offline Mode

---

END