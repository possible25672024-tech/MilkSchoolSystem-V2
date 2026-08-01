# MilkSchoolSystem V2 — Cutover Parity Matrix

Date initialized: 2026-07-28

Last updated: 2026-08-01

Active readiness branch: `feature/sprint-6.4-firebase-auth-rules-uat`

Decision register: `docs/CUTOVER_DECISIONS.md`

Status values:

- PASS — V2 behavior is verified equivalent or intentionally improved without breaking business rules
- PARTIAL — V2 foundation exists but operational UI, device evidence, or production validation is incomplete
- BLOCKED — production cutover cannot proceed for this workflow
- DEFERRED — validation was explicitly postponed and must not be interpreted as PASS
- NOT APPLICABLE — workflow does not require V2 replacement

| Area | Legacy source | V2 source | Status | Evidence required | Current gap / decision |
|---|---|---|---|---|---|
| Admin login | `index.html` | Login modules | PASS | automated test + browser login | desktop Chrome evidence recorded |
| Teacher login | `teacher.html` | Login and Teacher modules | PASS | automated test + browser login | desktop and 820 x 1180 evidence recorded; physical iPad deferred under D-01 |
| Logout | legacy pages | Auth/Login modules | PASS | browser logout | desktop and 820 x 1180 Logout evidence recorded |
| Room list loading | `index.html`, `teacher.html` | Login/Room modules | PASS | 83-room dataset | desktop and responsive shell evidence recorded |
| Room creation/edit | `index.html` | Room modules | PARTIAL | operational form parity | operational Admin UI deferred under D-05; blocks production, not `develop` integration |
| Student import | `index.html` XLSX parser | Local XLSX adapter + RoomService ETag boundary + Admin Student UI | PARTIAL | Live Server workbook/CSV + isolated two-Admin conflict | automated parser, duplicate, Room ID, Room Stock, and ETag gates pass under Sprint 5.5 |
| Main Stock receive | `index.html` | Stock modules | PARTIAL | end-to-end operational UI test | operational Admin UI deferred under D-05 |
| Classroom distribution | `index.html` | Stock modules | PARTIAL | Main Stock decrease + Room Stock increase | operational Admin UI deferred under D-05 |
| Attendance save | `teacher.html` | Attendance modules | PARTIAL | create/edit/delete + Room Stock delta | operational UI and isolated gates pass; deferred real-data incident and isolated production-confidence work remain open |
| Attendance ETag Room Stock update | legacy `atomicRoomStockDelta` | FirebaseService + AttendanceService | PARTIAL | deterministic conflict test + real Firebase conflict validation | deterministic test passes; isolated real test required under D-06 before production confidence |
| Attendance partial-save recovery | legacy `roomStockAdjust` queue | AttendanceManager + SyncService | PARTIAL | attendance-first failure fixture + queue conversion test | deterministic test passes; operational UI deferred under D-04 |
| Attendance audit write recovery | legacy best-effort stockLog/ledger | QueueStorage + AttendanceManager + SyncService | PARTIAL | audit failure fixture + persistent replay | audit-only queue and local test pass; production observation remains required |
| Pending milk | `teacher.html` | Pending modules | PASS | Room Stock-only operation | issue/delete/rollback, Queue recovery, media, desktop, and responsive gates pass; dedicated report print remains separate |
| Retroactive milk | `teacher.html` | Retroactive modules | PASS | Room Stock-only operation | issue/delete/rollback, Queue recovery, media, desktop, and responsive gates pass; dedicated report print remains separate |
| Vacation milk | `teacher.html` | Vacation modules | PASS | Room Stock-only operation | issue/delete/rollback, Queue recovery, media, desktop, and responsive gates pass; dedicated report print remains separate |
| Offline queue persistence | `teacher.html` | QueueStorage | PASS | restart fixture | deterministic persistence evidence recorded; physical iPad deferred under D-01 |
| Legacy/V2 queue compatibility | legacy `rec`/`diff` | QueueStorage normalization | PARTIAL | representative legacy fixtures + replay | automated fixtures pass; real sanitized operational sample pending under D-07 |
| Offline retry | `teacher.html` | Sync modules | PASS | reconnect and failure-retention test | persistent operational UI, restart/reconnect, failure retention, and manual retry gates pass |
| Simultaneous Room Stock writes | legacy ETag path | modular ETag compare-and-retry | PARTIAL | conflict retry + real Firebase multi-writer test | deterministic test passes; isolated Firebase evidence pending under D-06 |
| Classroom report | `index.html` | Report modules | PARTIAL | formula comparison | formula foundation accepts injected local sources; adapter deferred under D-02 |
| Grade report | `index.html` | Report modules | PARTIAL | formula comparison | adapter deferred under D-02 |
| Whole-school report | `index.html` | Report modules | PARTIAL | formula comparison | adapter deferred under D-02 |
| Print report | legacy UI | Report export model | PARTIAL | print layout comparison | operational Admin/report UI deferred under D-05 |
| Excel export | legacy UI | Report export model | PARTIAL | exported workbook comparison | operational Admin/report UI deferred under D-05 |
| Photos | `teacher.html` | Media modules | PARTIAL | capture and persistence test | desktop/browser and isolated persistence gates pass; physical iPad remains deferred under D-01 |
| Signatures | `teacher.html` | Signature/Media modules | PARTIAL | touch input and persistence test | desktop/browser and isolated pointer gates pass; physical iPad remains deferred under D-01 |
| Queue badge | `teacher.html` | SyncView | PASS | UI event test | operational Queue count, status, and Logout gates pass |
| Offline banner | `teacher.html` | SyncView | PASS | browser offline/online test | offline/reconnect and settled synchronized-state gates pass |
| Attendance history/summary/A4 | `teacher.html` | Attendance report modules | PASS | scoped read + desktop/responsive/A4 | authenticated-room range, GET-only visible traffic, clean Console, and A4 gates pass |
| Student report | `teacher.html` | Teacher parity modules | PARTIAL | scoped student report + A4 | isolated Service/Manager/UI gates pass; local Sprint 4.9 browser evidence pending |
| Remaining Room Stock view | `teacher.html` | Teacher parity modules | PARTIAL | actual scoped value + last-updated state | read-only isolated gate passes; local header-consistency evidence pending |
| Teacher settings | `teacher.html` | Teacher Preference Store | PARTIAL | safe device-local settings | allowlisted room-isolated storage gate passes; local refresh-persistence evidence pending |
| Complete Teacher navigation | `teacher.html` | TeacherParityView | PARTIAL | 12-item navigation + responsive | all 12 items present in automated gate; local responsive evidence pending |
| Backup | legacy Admin workflow | Admin System Service + documented cutover process | PARTIAL | Firebase export verification | full app Backup and local Firebase-compatible REST rehearsal pass; real isolated Google Firebase export remains required under D-09 |
| Restore | legacy Admin workflow | ETag-guarded Admin System Restore + rollback plan | PARTIAL | isolated restore rehearsal | local full-root Restore, audit, and stale-ETag rejection pass; real isolated Google Firebase project/Rules rehearsal remains required under D-09 |
| Server-side authorization | legacy client password comparison | Firebase Authentication + UID profiles + Rules | PARTIAL | official Emulator and real-project anonymous/admin/teacher/cross-room allow-deny evidence | runtime implementation, active Rules, rollback Rules, and automated contracts exist; official Emulator, real isolated project, and Live Browser evidence remain blocked |
| Desktop performance | legacy/V2 comparison | Sprint 3.9 | PASS | Network evidence | observed 4 requests / approximately 1.6 KB core refresh |
| Desktop browser shell | legacy/V2 comparison | `index-v2.html` | PASS | Admin, Teacher, Logout, Console | recorded desktop workflow passes |
| 820 x 1180 responsive shell | legacy/V2 comparison | `index-v2.html` | PASS | Teacher login, Logout, Console, layout | complete current-shell workflow passes |
| Narrow phone viewport | legacy/V2 comparison | V2 | NOT APPLICABLE | explicit product requirement | optional unless phone support enters production scope |
| Physical iPad | legacy/V2 comparison | V2 | DEFERRED | device test or explicit production risk acceptance | skipped under D-01; not required for feature-to-`develop` integration and not PASS |

## Sprint 4.0 Develop Integration Rule

All Sprint 4.0 branch gates passed. Explicitly blocked or deferred production rows may remain while Sprint 4.0 fast-forwards into `develop` because each has a documented decision, owner, production consequence, and protected rollback path.

## Production Cutover Rule

Production cutover is not approved while any safety-critical row remains BLOCKED. Deferred rows require explicit risk acceptance before production approval. Legacy `index.html` and `teacher.html` remain available as the operational rollback path.
