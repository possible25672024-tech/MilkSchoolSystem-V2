# MilkSchoolSystem V2 — Cutover Parity Matrix

Date initialized: 2026-07-28

Last updated: 2026-07-28

Branch: `feature/sprint-4.0-cutover-readiness`

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
| Student import | `index.html` XLSX parser | RoomService parsed-data boundary | PARTIAL | import fixture + Room ID preservation | binary parser remains in legacy flow under D-03 |
| Main Stock receive | `index.html` | Stock modules | PARTIAL | end-to-end operational UI test | operational Admin UI deferred under D-05 |
| Classroom distribution | `index.html` | Stock modules | PARTIAL | Main Stock decrease + Room Stock increase | operational Admin UI deferred under D-05 |
| Attendance save | `teacher.html` | Attendance modules | PARTIAL | create/edit/delete + Room Stock delta | service foundation passes; operational form deferred under D-04 |
| Attendance ETag Room Stock update | legacy `atomicRoomStockDelta` | FirebaseService + AttendanceService | PARTIAL | deterministic conflict test + real Firebase conflict validation | deterministic test passes; isolated real test required under D-06 before production confidence |
| Attendance partial-save recovery | legacy `roomStockAdjust` queue | AttendanceManager + SyncService | PARTIAL | attendance-first failure fixture + queue conversion test | deterministic test passes; operational UI deferred under D-04 |
| Attendance audit write recovery | legacy best-effort stockLog/ledger | QueueStorage + AttendanceManager + SyncService | PARTIAL | audit failure fixture + persistent replay | audit-only queue and local test pass; production observation remains required |
| Pending milk | `teacher.html` | Stock/Teacher foundations | PARTIAL | Room Stock-only operation | operational form deferred under D-04 |
| Retroactive milk | `teacher.html` | Stock/Teacher foundations | PARTIAL | Room Stock-only operation | operational form deferred under D-04 |
| Vacation milk | `teacher.html` | Stock/Teacher foundations | PARTIAL | Room Stock-only operation | operational form deferred under D-04 |
| Offline queue persistence | `teacher.html` | QueueStorage | PASS | restart fixture | deterministic persistence evidence recorded; physical iPad deferred under D-01 |
| Legacy/V2 queue compatibility | legacy `rec`/`diff` | QueueStorage normalization | PARTIAL | representative legacy fixtures + replay | automated fixtures pass; real sanitized operational sample pending under D-07 |
| Offline retry | `teacher.html` | Sync modules | PARTIAL | reconnect and failure-retention test | deterministic replay passes; operational UI deferred under D-04 |
| Simultaneous Room Stock writes | legacy ETag path | modular ETag compare-and-retry | PARTIAL | conflict retry + real Firebase multi-writer test | deterministic test passes; isolated Firebase evidence pending under D-06 |
| Classroom report | `index.html` | Report modules | PARTIAL | formula comparison | formula foundation accepts injected local sources; adapter deferred under D-02 |
| Grade report | `index.html` | Report modules | PARTIAL | formula comparison | adapter deferred under D-02 |
| Whole-school report | `index.html` | Report modules | PARTIAL | formula comparison | adapter deferred under D-02 |
| Print report | legacy UI | Report export model | PARTIAL | print layout comparison | operational Admin/report UI deferred under D-05 |
| Excel export | legacy UI | Report export model | PARTIAL | exported workbook comparison | operational Admin/report UI deferred under D-05 |
| Photos | `teacher.html` | not integrated | BLOCKED | capture and persistence test | dedicated Teacher UI sprint required under D-04; physical-device risk handled by D-01 |
| Signatures | `teacher.html` | not integrated | BLOCKED | touch input and persistence test | dedicated Teacher UI sprint required under D-04; physical-device risk handled by D-01 |
| Queue badge | `teacher.html` | Sync events available | PARTIAL | UI event test | operational Teacher UI deferred under D-04 |
| Offline banner | `teacher.html` | Sync events available | PARTIAL | browser offline/online test | operational Teacher UI deferred under D-04 |
| Backup | legacy Admin workflow | documented cutover process | BLOCKED | Firebase export verification | plan complete; export/rehearsal required under D-09 before production |
| Restore | legacy Admin workflow | documented rollback process | BLOCKED | isolated restore rehearsal | plan complete; isolated rehearsal required under D-09 before production |
| Desktop performance | legacy/V2 comparison | Sprint 3.9 | PASS | Network evidence | observed 4 requests / approximately 1.6 KB core refresh |
| Desktop browser shell | legacy/V2 comparison | `index-v2.html` | PASS | Admin, Teacher, Logout, Console | recorded desktop workflow passes |
| 820 x 1180 responsive shell | legacy/V2 comparison | `index-v2.html` | PASS | Teacher login, Logout, Console, layout | complete current-shell workflow passes |
| Narrow phone viewport | legacy/V2 comparison | V2 | NOT APPLICABLE | explicit product requirement | optional unless phone support enters production scope |
| Physical iPad | legacy/V2 comparison | V2 | DEFERRED | device test or explicit production risk acceptance | skipped under D-01; not required for feature-to-`develop` integration and not PASS |

## Sprint 4.0 Develop Integration Rule

All Sprint 4.0 branch gates passed. Explicitly blocked or deferred production rows may remain while Sprint 4.0 fast-forwards into `develop` because each has a documented decision, owner, production consequence, and protected rollback path.

## Production Cutover Rule

Production cutover is not approved while any safety-critical row remains BLOCKED. Deferred rows require explicit risk acceptance before production approval. Legacy `index.html` and `teacher.html` remain available as the operational rollback path.
