# MilkSchoolSystem-V2
# Codex Context

Version: 2.0

Last Updated:
2026-07-20

---

Repository

possible25672024-tech/MilkSchoolSystem-V2

Default Branch

develop

---

Project Status

Migration Project

Legacy

↓

Modular V2

---

Current Sprint

Sprint 3.4.2

Status

95%

---

Completed

✓ Repository Analysis

✓ Architecture Review

✓ Legacy Analysis

✓ Firebase Layer

✓ Repository Layer

✓ Login Layer

✓ Module Smoke Test

✓ Firebase Test

✓ Session Test

✓ index-v2

✓ bootstrap.js

✓ app.js

---

Pending

□ Group commits

□ Commit Firebase Layer

□ Commit Login Layer

□ Push develop

□ Pull Request

---

Next Sprint

Sprint 3.4.3

Stock Module

Sprint 3.4.4

Report Module

Sprint 3.5

Room Module

Sprint 3.6

Teacher Module

Sprint 3.7

Attendance Module

Sprint 3.8

Offline Queue

Sprint 3.9

Performance

Sprint 4

Legacy Replacement

---

Legacy Files

index.html

teacher.html

Remain untouched during migration.

Only migrate functionality.

---

Migration Order

Firebase

↓

Repository

↓

Service

↓

Manager

↓

UI

---

Current Modules

core

firebase

login

repositories

services

report

stock

teacher

room

attendance

sync

utils

---

Business Rules

Main Stock

↓

Distribute

↓

Room Stock

↓

Teacher Attendance

↓

Drink

Pending

Retroactive

Vacation

---

Never Break

Stock Calculation

Attendance

Firebase Schema

Teacher Login

Admin Login

Sync

Offline Queue

---

Current Firebase Structure

milkApp

attendance

roomStock

stock

rooms

users

settings

reports

transactions

---

AI Instructions

Before coding:

Read

AGENTS.md

REPOSITORY_RULES.md

SPRINT_STATUS.md

MODULE_MAP.md

Never restart completed Sprint.

Continue from latest repository state.

Never recreate existing modules.

Compare before editing.

Refactor only.

Preserve behavior.

Use ES Modules.

Repository Pattern.

Service Layer.

No duplicated code.

---

Expected Workflow

Open Repository

↓

Read AGENTS.md

↓

Read Context

↓

Read Sprint Status

↓

Read Required Source Files

↓

Implement

↓

Test

↓

Commit

↓

Update SPRINT_STATUS.md

↓

Update PROJECT_MEMORY.md

↓

Finish

---

End of CODEX_CONTEXT.md