# MilkSchoolSystem V2
# Coding Standard

Version : 2.0.0

---

# Objective

กำหนดมาตรฐานการเขียนโปรแกรมของโครงการ MilkSchoolSystem V2
เพื่อให้ทุก Module มีรูปแบบเดียวกัน อ่านง่าย และบำรุงรักษาได้

---

# Folder Structure

/config
/modules
/scripts
/styles
/assets
/tests
/docs

---

# File Naming

JavaScript

camelCase

Example

stockManager.js
teacherService.js
firebaseService.js

------------------------

Class

PascalCase

Example

StockManager
FirebaseService
RoomRepository

------------------------

Constants

UPPER_CASE

Example

DEFAULT_THEME

MAX_RETRY

CURRENT_VERSION

------------------------

Variables

camelCase

Example

studentName
roomStock
selectedDate

------------------------

Functions

camelCase

Example

loadStudents()

saveRoomStock()

calculateSummary()

------------------------

Boolean

Example

isLoading

isAdmin

hasPermission

isConnected

------------------------

# HTML

หนึ่งหน้าที่ต่อหนึ่งไฟล์

ห้ามเขียน JavaScript จำนวนมากใน HTML

Business Logic ต้องอยู่ใน modules

------------------------

# CSS

styles/

main.css

teacher.css

report.css

theme.css

------------------------

# JavaScript Rules

ใช้

const

ก่อน

ใช้

let

เมื่อจำเป็น

ห้ามใช้

var

------------------------

ใช้

===

แทน

==

------------------------

ใช้

async / await

แทน callback

------------------------

ทุก Function ต้องมี Comment

Example

/**
 * Load students from Firestore
 */

------------------------

ทุก Module

ต้อง Export

Function

หรือ

Class

อย่างชัดเจน

------------------------

# Firebase

ห้ามเขียน firebaseConfig ใน index.html

ห้ามเขียน firebaseConfig ใน teacher.html

ใช้

config/firebase-config.js

เท่านั้น

------------------------

# Error Handling

ทุก async function

ต้องมี

try

catch

finally

------------------------

# Logging

ใช้

Logger Module

ห้ามใช้

console.log()

ใน Production

------------------------

# Version

ทุกไฟล์

ต้องมี

Version

Author

Last Update

------------------------

# Documentation

ทุก Module

ต้องมี

README

หรือ

Comment

อธิบายการทำงาน

------------------------

# Commit Message

รูปแบบ

Phase X - Description

Example

Phase 1 - Config System

Phase 2 - Stock Module

Phase 3 - Installer

Fix - Firebase Sync

Refactor - Report Module

------------------------

Coding Standard Approved

MilkSchoolSystem V2