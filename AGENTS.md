# MilkSchoolSystem-V2
# AI Development Guide

Version: 2.0
Status: Active

---

# Purpose

MilkSchoolSystem-V2 is a modular School Milk Distribution Management System.

The project is being migrated from a legacy architecture into a modern ES Module architecture.

This file is the primary instruction for every AI assistant.

Applicable AI

- ChatGPT
- Codex
- Claude
- GitHub Copilot
- Human Developers

---

# Project Goals

• Support multiple schools

• Change school by configuration only

• Replace Firebase settings without changing code

• Repository Pattern

• Service Layer

• Offline Ready

• Maintain backward compatibility

---

# Current Architecture

Legacy

index.html

teacher.html

↓

Migration

↓

Modules

↓

Future V2

---

# Current Migration Phase

Sprint 3.x

Migration only

DO NOT change business logic.

Move code into modules.

---

# Main Architecture

UI

↓

Manager

↓

Service

↓

Repository

↓

Firebase

↓

Realtime Database

---

# Main Business Rule

Main Stock

↓

Distribute to Classroom

↓

Room Stock

↓

Teacher Attendance

↓

Milk Consumption

Important

Main Stock decreases ONLY when distributing to classrooms.

Teacher operations

Drink

Pending

Retroactive

Vacation

must reduce ONLY Room Stock.

---

# Repository Pattern

Repositories

Responsible only for:

Database

Storage

Queries

No business logic.

---

# Service Layer

Responsible for:

Validation

Calculation

Workflow

Business Rules

No UI.

---

# UI Layer

Responsible for:

Display

Event

Navigation

Never access Firebase directly.

---

# Firebase Rules

Never call Firebase directly inside UI.

Correct flow:

UI

↓

Service

↓

Repository

↓

firebaseService

↓

firebase.js

---

# Folder Responsibilities

config/

Configuration

modules/core/

Core framework

modules/services/

Business logic

modules/repositories/

Database layer

modules/login/

Authentication

modules/stock/

Stock

modules/report/

Reports

modules/teacher/

Teacher

modules/room/

Room

modules/attendance/

Attendance

modules/utils/

Utilities

---

# Migration Rules

Sprint 3.x

Refactor only.

No feature changes.

Sprint 4

Replace legacy implementation.

---

# Testing

Every Sprint

Run

Login Test

Firebase Test

Stock Test

Attendance Test

Smoke Test

---

# Documentation

Always update

PROJECT_MEMORY.md

SPRINT_STATUS.md

CHANGELOG.md

when completing a Sprint.

---

# AI Workflow

Every AI session should:

1.
Read

AGENTS.md

2.
Read

CODEX_CONTEXT.md

3.
Read

SPRINT_STATUS.md

4.
Read

MODULE_MAP.md

5.

Read ONLY related source files.

Do NOT analyze the whole repository unless required.

---

# Commit Convention

docs(ai)

feat(login)

feat(stock)

feat(report)

fix(firebase)

fix(sync)

refactor(repository)

refactor(service)

test(module)

---

# Branch Strategy

main

Stable Release

develop

Development

feature/*

New Features

bugfix/*

Bug Fixes

hotfix/*

Emergency Fixes

Never commit directly to main.

---

End of AGENTS.md