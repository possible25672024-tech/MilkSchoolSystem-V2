# MilkSchoolSystem V2 — Cutover Parity Matrix

Date initialized: 2026-07-28

Last updated: 2026-07-28

Branch: `feature/sprint-4.0-cutover-readiness`

Status values:

- PASS — V2 behavior is verified equivalent or intentionally improved without breaking business rules
- PARTIAL — V2 foundation exists but operational UI, device evidence, or production validation is incomplete
- BLOCKED — production cutover cannot proceed for this workflow
- NOT APPLICABLE — workflow does not require V2 replacement

| Area | Legacy source | V2 source | Status | Evidence required | Current gap |
|---|---|---|---|---|---|
| Admin login | `index.html` | Login modules | PASS | automated test + browser login | none recorded |
| Teacher login | `teacher.html` | Login and Teacher modules | PASS | automated test + browser login | physical iPad validation pending |
| Logout | legacy pages | Auth/Login modules | PASS | browser logout | none recorded |
| Room list loading | `index.html`, `teacher.html` | Login/Room modules | PASS | 83-room dataset | physical iPad validation pending |
| Room creation/edit | `index.html` | Room modules | PARTIAL | operational form parity | V2 operational UI not integrated |
| Student import | `index.html` XLSX parser | RoomService parsed-data boundary | PARTIAL | import fixture + Room ID preservation | binary XLSX parser remains legacy |
| Main Stock receive | `index.html` | Stock modules | PARTIAL | end-to-end operational UI test | V2 operational UI not integrated |
| Classroom distribution | `index.html` | Stock modules | PARTIAL | Main Stock decrease + Room Stock increase | V2 operational UI not integrated |
| Attendance save | `teacher.html` | Attendance modules | PARTIAL | create/edit/delete + Room Stock delta | operational form remains legacy |
| Attendance ETag Room Stock update | legacy `atomicRoomStockDelta` | FirebaseService + AttendanceService | PARTIAL | deterministic conflict test + real Firebase conflict validation | implementation added; local regression and real multi-writer evidence pending |
| Attendance partial-save recovery | legacy `roomStockAdjust` queue | AttendanceManager + SyncService | PARTIAL | attendance-first failure fixture + queue conversion test | implementation added; local regression pending |
| Attendance audit write recovery | legacy best-effort stockLog/ledger | AttendanceService audit retry | BLOCKED | persistent audit-recovery decision | retries are bounded but no persistent audit-only queue exists after Room Stock succeeds |
| Pending milk | `teacher.html` | Stock/Teacher foundations | PARTIAL | Room Stock-only operation | operational form and adapter incomplete |
| Retroactive milk | `teacher.html` | Stock/Teacher foundations | PARTIAL | Room Stock-only operation | operational form and adapter incomplete |
| Vacation milk | `teacher.html` | Stock/Teacher foundations | PARTIAL | Room Stock-only operation | operational form and adapter incomplete |
| Offline queue persistence | `teacher.html` | QueueStorage | PASS | restart fixture | production device evidence pending |
| Legacy/V2 queue format compatibility | legacy `rec`/`diff` | QueueStorage normalization | PARTIAL | representative legacy fixtures + replay | fixture coverage exists; local Sprint 4.0 execution pending |
| Offline retry | `teacher.html` | Sync modules | PARTIAL | reconnect and failure-retention test | physical device validation pending |
| Simultaneous Room Stock writes | legacy ETag path | modular ETag compare-and-retry | PARTIAL | conflict retry + real Firebase multi-writer test | code and deterministic test added; production evidence pending |
| Classroom report | `index.html` | Report modules | PARTIAL | formula comparison | browser-local adapter incomplete |
| Grade report | `index.html` | Report modules | PARTIAL | formula comparison | browser-local adapter incomplete |
| Whole-school report | `index.html` | Report modules | PARTIAL | formula comparison | browser-local adapter incomplete |
| Print report | legacy UI | Report export model | PARTIAL | print layout comparison | operational print UI incomplete |
| Excel export | legacy UI | Report export model | PARTIAL | exported workbook comparison | operational export UI incomplete |
| Photos | `teacher.html` | not integrated | BLOCKED | mobile/iPad capture test | V2 operational UI missing |
| Signatures | `teacher.html` | not integrated | BLOCKED | touch input and persistence test | V2 operational UI missing |
| Queue badge | `teacher.html` | Sync events available | PARTIAL | UI event test | V2 badge UI missing |
| Offline banner | `teacher.html` | Sync events available | PARTIAL | browser offline/online test | V2 banner UI missing |
| Backup | legacy Admin workflow | not yet integrated | BLOCKED | Firebase export and restore rehearsal | cutover backup checklist pending |
| Restore | legacy Admin workflow | not yet integrated | BLOCKED | isolated restore rehearsal | cutover rollback plan pending |
| Desktop performance | legacy/V2 comparison | Sprint 3.9 | PASS | Network evidence | observed 4 requests / approximately 1.6 KB core refresh |
| Responsive mobile | legacy/V2 comparison | V2 | BLOCKED | recorded viewport test | evidence pending |
| Physical iPad | legacy/V2 comparison | V2 | BLOCKED | recorded device test | evidence pending |

## Cutover Rule

Production cutover is not approved while any safety-critical row remains BLOCKED. Legacy `index.html` and `teacher.html` remain available as the rollback path.
