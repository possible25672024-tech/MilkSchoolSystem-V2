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

END# MilkSchoolSystem V2
# Developer Guide

Version 2.0

---

# Overview

เอกสารนี้ใช้สำหรับนักพัฒนาทุกคนที่เข้าร่วมโครงการ

ทุกการพัฒนาต้องอ้างอิงเอกสารนี้

---

# Git Workflow

main

Production

↓

develop

Integration

↓

phase1-config

↓

phase2-modules

↓

phase3-settings

↓

phase4-installer

↓

phase5-backup

↓

phase6-multischool

↓

phase7-release

---

# Branch Rules

ห้าม Commit ลง main

ทุก Feature

สร้าง Branch ใหม่

Merge เข้า develop

Testing

Merge เข้า main

---

# Folder Structure

config/

modules/

scripts/

styles/

assets/

tests/

docs/

---

# Module Structure

หนึ่ง Module

หนึ่งหน้าที่

ตัวอย่าง

StockManager

RoomManager

TeacherManager

FirebaseService

BackupService

ReportService

---

# Config

ห้าม Hardcode

ชื่อโรงเรียน

Firebase

Logo

Theme

ต้องอ่านจาก

config/

เท่านั้น

---

# HTML

HTML

มีเฉพาะ UI

Business Logic

อยู่ใน modules

---

# CSS

main.css

teacher.css

report.css

theme.css

---

# JavaScript

const ก่อน

let เมื่อจำเป็น

ห้ามใช้ var

ใช้ async/await

ใช้ ===

ใช้ try/catch

---

# Comment

ทุก Function

ต้องมี

Description

Parameters

Return

Example

/**
 * Save Room Stock
 *
 * @param roomId
 * @param quantity
 *
 * @returns Promise
 */

---

# Naming

Class

PascalCase

StockManager

Function

camelCase

saveRoomStock()

Constant

UPPER_CASE

MAX_STOCK

---

# Logging

ใช้ Logger Module

ห้าม console.log()

ใน Production

---

# Error

ทุก Error

ต้องแสดง

Code

Message

Solution

---

# Commit Message

ตัวอย่าง

Phase 1 - Configuration

Phase 2 - Stock Module

Fix - Firebase Sync

Refactor - Report

---

# Pull Request Checklist

□ Build ผ่าน

□ ไม่มี Error

□ Test ผ่าน

□ Comment ครบ

□ Update CHANGELOG

□ Update Version

---

# Before Merge

Code Review

Regression Test

Backup

Merge

---

# Release Checklist

Update Version

Update CHANGELOG

Create Tag

Backup Database

Deploy

Smoke Test

Release

---

# AI Development Rules

ChatGPT

- Architecture
- System Design
- Code Review
- Refactor Plan

GitHub Copilot

- Code Completion
- Refactor Suggestion

Claude

- Large Scale Refactor
- Long Code Generation

ทุก AI ต้องอ้างอิง

SYSTEM_SPEC.md

CODING_STANDARD.md

PROJECT_MEMORY.md

---

END