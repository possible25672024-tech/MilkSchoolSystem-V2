# MilkSchoolSystem-V2
# Repository Rules

Version: 2.0
Status: Active

---

# Purpose

This document defines mandatory repository rules for all AI agents and developers.

Applies to:

- ChatGPT
- Codex
- Claude
- GitHub Copilot
- Human Developers

---

# Branch Strategy

main
    Stable Release

develop
    Active Development

feature/*
    New Features

bugfix/*
    Bug Fixes

hotfix/*
    Emergency Fixes

Never develop directly on main.

---

# Commit Convention

feat(login)

feat(stock)

feat(report)

fix(sync)

fix(firebase)

refactor(repository)

docs(ai)

test(module)

---

# Folder Responsibilities

config/
Configuration only.

modules/core/
Framework core.

modules/services/
Business Logic.

modules/repositories/
Database Layer.

modules/login/
Authentication.

modules/report/
Reports.

modules/stock/
Stock Management.

modules/teacher/
Teacher Features.

modules/room/
Room Management.

---

# Coding Rules

Use ES Modules.

No inline Firebase fetch.

No duplicated functions.

No global variables.

No inline SQL/Firebase logic.

No business logic inside UI.

Keep functions small.

Maximum recommended function length:
100 lines.

---

# Firebase Rules

Never call Firebase directly from UI.

Correct flow:

UI

↓

Service

↓

Repository

↓

Firebase

Forbidden:

UI

↓

Firebase

---

# Repository Pattern

Repositories

ONLY

Database operations.

No calculations.

No UI.

---

# Service Layer

Contains

Business Logic

Validation

Calculation

Workflow

---

# UI Rules

UI only

Display

Events

Navigation

No business logic.

---

# Migration Rules

Sprint 3.x

Move code only.

Never change business rules.

Sprint 4+

Replace legacy implementation.

---

# Testing Rules

Every Sprint

Run Smoke Test.

Run Login Test.

Run Firebase Test.

Run Stock Test.

---

# Documentation

Every Sprint updates

CHANGELOG.md

SPRINT_STATUS.md

PROJECT_MEMORY.md

---

End of Rules