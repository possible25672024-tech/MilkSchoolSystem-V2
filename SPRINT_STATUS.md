# MilkSchoolSystem-V2

# Sprint Status

Last Update

2026-07-27

---

Current Branch

feature/recovery-sprint-3.4.2

---

Current Version

V2

---

Current Sprint

Sprint 3.4.2 Recovery — Runtime Config, Firebase REST and Login Foundation

Status

90% — implementation and static validation complete; local browser smoke test pending

---

Completed

✓ Recovery branch created from develop

✓ Runtime Firebase configuration restored

✓ Legacy `milk_school_db.settings.firebaseUrl/firebaseKey` compatibility restored

✓ Firebase Realtime Database REST service restored

✓ GET / PUT / PATCH / POST / DELETE support

✓ Request timeout and `cache: no-store`

✓ BaseRepository routed through FirebaseService

✓ LoginRepository reads `milkApp/settings` and `milkApp/rooms`

✓ Admin and teacher password rules restored

✓ Default legacy password fallback remains `1234`

✓ Session key compatibility restored: `milkApp_loginSession`

✓ Login form connected to Repository → Service → AuthService → Manager

✓ Bootstrap starts only once

✓ index-v2 dependency order corrected

✓ Static validation script added: `tests/login-foundation-check.mjs`

✓ Legacy `index.html` and `teacher.html` remain unchanged

---

Pending Before Merge

□ Pull latest recovery branch to the local workspace

□ Run `node tests/login-foundation-check.mjs`

□ Open `index-v2.html` through Live Server

□ Confirm classroom list loads from Firebase

□ Test incorrect admin password

□ Test correct admin password

□ Test incorrect teacher password

□ Test correct teacher password for one classroom

□ Confirm logout clears `sessionStorage.milkApp_loginSession`

□ Merge recovery branch into develop after successful smoke test

---

Next Sprint

Sprint 3.4.3 — Stock Module

Do not begin Stock Module until the recovery branch is validated and merged into develop.

---

Future

Sprint 3.4.4 — Report Module

Sprint 3.5 — Room Module

Sprint 3.6 — Teacher Module

Sprint 3.7 — Attendance Module

Sprint 3.8 — Offline Queue

Sprint 3.9 — Performance

Sprint 4 — Legacy Replacement

---

Migration Progress

Architecture

██████████ 100%

Firebase Foundation

█████████░ 90%

Login Foundation

█████████░ 90%

Repository Foundation

██████████ 100%

Stock

██░░░░░░░░ 20%

Report

█░░░░░░░░░ 10%

Teacher

░░░░░░░░░░ 0%

Room

░░░░░░░░░░ 0%

Offline

░░░░░░░░░░ 0%

Testing

████░░░░░░ 40%

---

Notes

The previously reported Sprint 3.4.2 commits were not present in Git objects, reflog or GitHub history. The foundation was rebuilt on a separate recovery branch without changing legacy files or business data paths.
