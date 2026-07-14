# MilkSchoolSystem V2
# MASTER PLAN

Version : 2.0.0

Status : Development

Project Type : Enterprise Platform

Last Update : 2026-07-14

---

# Vision

MilkSchoolSystem V2 คือ Platform สำหรับบริหารจัดการโครงการอาหารเสริมนมโรงเรียน
ที่สามารถติดตั้งให้โรงเรียนทุกแห่งได้

โดยไม่ต้องแก้ไข Source Code

ผู้ติดตั้งเพียงกำหนด

- ชื่อโรงเรียน
- โลโก้
- Firebase Config

แล้วระบบพร้อมใช้งาน

---

# Mission

เปลี่ยนระบบ V1

จาก

Single School

เป็น

Universal Platform

รองรับ

- โรงเรียนขนาดเล็ก
- โรงเรียนขนาดกลาง
- โรงเรียนขนาดใหญ่
- หลายโรงเรียนในอนาคต

---

# Core Principles

## 1

Configuration First

ทุกค่าที่เปลี่ยนได้

ห้าม Hardcode

---

## 2

Single Source of Truth

ข้อมูลทุกชนิด

ต้องมีแหล่งข้อมูลเดียว

---

## 3

Business Logic Isolation

Business Logic

ต้องอยู่ใน modules

ห้ามอยู่ใน HTML

---

## 4

UI Separation

HTML

แสดงผลเท่านั้น

---

## 5

Backward Compatibility

V2

ต้องเปิดข้อมูลจาก V1 ได้

---

# Architecture

Presentation Layer

↓

Application Layer

↓

Business Layer

↓

Repository Layer

↓

Firebase

---

# System Layers

Presentation

index.html

teacher.html

install.html

Application

Controller

Router

Settings

Business

Stock

Teacher

Room

Student

Report

Backup

Sync

Repository

Firestore

Local Cache

Migration

Infrastructure

Firebase

Logger

Configuration

Utilities

---

# Phase Plan

## Phase 0

Project Foundation

Architecture

Documentation

Repository

Coding Standard

DONE

---

## Phase 1

Configuration Layer

School Config

Firebase Config

Theme

Logo

Language

Version

Install Profile

---

## Phase 2

Core Modules

Stock

Teacher

Student

Room

Report

Backup

Authentication

Logger

Utilities

---

## Phase 3

Installer

install.html

First Run

Migration

Database Version

---

## Phase 4

System Management

Backup

Restore

Import

Export

Health Check

Audit

---

## Phase 5

Performance

Cache

Lazy Loading

Firestore Optimization

Compression

Image Optimization

---

## Phase 6

Platform

Plugin

Theme

Language

Multiple School

API

---

## Phase 7

Release

Testing

QA

Documentation

Tag

Release

Deployment

---

# Development Workflow

Task

↓

Develop

↓

Commit

↓

Push

↓

Pull Request

↓

Review

↓

Merge develop

↓

Regression Test

↓

Merge main

↓

Release

---

# Git Strategy

main

Production

develop

Integration

feature/*

Feature Development

hotfix/*

Emergency

release/*

Release Candidate

---

# Branch Naming

feature/config

feature/report

feature/settings

feature/backup

feature/multischool

hotfix/firebase

release/v2.0.0

---

# Documentation

README

Architecture

Roadmap

API

Database

Developer Guide

Coding Standard

Project Memory

Test Plan

Release Checklist

Master Plan

---

# Quality Standard

No Hardcode

No Duplicate Logic

Reusable Components

Readable Code

Documented

Testable

Configurable

---

# Performance Target

Home

<2 sec

Teacher

<2 sec

Report

<3 sec

Backup

<10 sec

Restore

<30 sec

---

# Security

Firebase Rules

Role Permission

Audit Log

Encrypted Backup

Secure Configuration

---

# Future Roadmap

V2.1

Installer

V2.2

Module Marketplace

V2.3

Plugin SDK

V2.5

REST API

V3

Cloud Platform

V4

Mobile

---

# Success Criteria

✓ เปลี่ยนโรงเรียนโดยไม่แก้ Source Code

✓ เปลี่ยน Firebase ภายใน 1 นาที

✓ ติดตั้งโรงเรียนใหม่ภายใน 5 นาที

✓ Backup ได้

✓ Restore ได้

✓ Upgrade ได้

✓ Multi School Ready

✓ Plugin Ready

✓ Cloud Ready

---

# Project Status

Phase 0

████████████████████ 100%

Phase 1

□□□□□□□□□□□□□□ 0%

Phase 2

□□□□□□□□□□□□□□ 0%

Phase 3

□□□□□□□□□□□□□□ 0%

Phase 4

□□□□□□□□□□□□□□ 0%

Phase 5

□□□□□□□□□□□□□□ 0%

Phase 6

□□□□□□□□□□□□□□ 0%

Phase 7

□□□□□□□□□□□□□□ 0%

---

# Next Action

Start Phase 1

Configuration Layer

Create

config/

app-config.js

firebase-config.js

school-config.json

theme.json

version.json

---

Approved

MilkSchoolSystem V2 Architecture Team