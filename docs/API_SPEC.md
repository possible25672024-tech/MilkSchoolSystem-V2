# MilkSchoolSystem V2
# API Specification

Version : 2.0.0

---

# Objective

กำหนดมาตรฐาน Interface ระหว่าง Module

ทุก Module ต้องเรียกใช้ Service ผ่าน Interface

ห้ามเรียก Firebase โดยตรงจาก UI

----------------------------------------------------

Architecture

UI

↓

Service

↓

Repository

↓

Firebase

----------------------------------------------------

# Configuration Service

loadConfig()

saveConfig()

validateConfig()

----------------------------------------------------

# School Service

getSchool()

saveSchool()

updateLogo()

updateTheme()

----------------------------------------------------

# Authentication Service

login()

logout()

currentUser()

changePassword()

----------------------------------------------------

# Teacher Service

getTeachers()

createTeacher()

updateTeacher()

deleteTeacher()

----------------------------------------------------

# Student Service

getStudents()

saveStudent()

deleteStudent()

moveStudent()

----------------------------------------------------

# Room Service

getRooms()

createRoom()

updateRoom()

deleteRoom()

----------------------------------------------------

# Stock Service

getMainStock()

getRoomStock()

addStock()

distributeStock()

deductRoomStock()

recalculate()

----------------------------------------------------

Business Rule

Main Stock

↓

Distribution

↓

Room Stock

↓

Teacher

----------------------------------------------------

# Distribution Service

distributeToRoom()

undoDistribution()

history()

----------------------------------------------------

# Report Service

dailyReport()

monthlyReport()

summaryReport()

gradeReport()

schoolReport()

----------------------------------------------------

# Backup Service

createBackup()

restoreBackup()

downloadBackup()

verifyBackup()

----------------------------------------------------

# Audit Service

writeLog()

readLogs()

exportLogs()

----------------------------------------------------

# Logger

info()

warning()

error()

debug()

----------------------------------------------------

# Future API

Plugin API

Theme API

Cloud Sync API

Notification API

REST API

----------------------------------------------------

END