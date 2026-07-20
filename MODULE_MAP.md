# MilkSchoolSystem-V2

# Module Migration Map

---

Legacy Files

index.html

teacher.html

↓

Migration

↓

Modules

---

Authentication

index.html

↓

modules/login/

loginManager.js

authService.js

loginService.js

loginRepository.js

---

Firebase

index.html

teacher.html

↓

modules/core/

firebase.js

↓

modules/services/

firebaseService.js

↓

modules/repositories/

baseRepository.js

---

Stock

index.html

↓

modules/stock/

stockManager.js

stockService.js

stockRepository.js

---

Teacher

teacher.html

↓

modules/teacher/

teacherManager.js

teacherService.js

teacherRepository.js

---

Room

index.html

↓

modules/room/

roomManager.js

roomService.js

roomRepository.js

---

Report

index.html

↓

modules/report/

reportManager.js

reportService.js

reportRepository.js

---

Attendance

teacher.html

↓

modules/attendance/

attendanceManager.js

attendanceService.js

attendanceRepository.js

---

Sync

teacher.html

↓

modules/sync/

syncManager.js

syncService.js

---

Utilities

modules/utils/

dateUtils.js

numberUtils.js

storageUtils.js

validationUtils.js

---

Configuration

config/

app.config.js

firebase.config.js

theme.config.js

school.config.js

---

Target Architecture

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

Business Rules

Main Stock

↓

Distribute

↓

Room Stock

↓

Teacher

↓

Attendance

Drink

Pending

Retroactive

Vacation

---

Migration Order

Sprint 3.4.2

Firebase

Login

Repository

↓

Sprint 3.4.3

Stock

↓

Sprint 3.4.4

Report

↓

Sprint 3.5

Room

↓

Sprint 3.6

Teacher

↓

Sprint 3.7

Attendance

↓

Sprint 3.8

Offline Queue

↓

Sprint 3.9

Performance

↓

Sprint 4

Legacy Removal

---

AI Instructions

Always read:

AGENTS.md

CODEX_CONTEXT.md

REPOSITORY_RULES.md

SPRINT_STATUS.md

MODULE_MAP.md

before editing any source code.

Never modify business logic during migration.

Refactor only.
