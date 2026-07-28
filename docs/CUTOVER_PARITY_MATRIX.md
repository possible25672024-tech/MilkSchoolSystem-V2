# MilkSchoolSystem V2 — Cutover Parity Matrix

Date initialized: 2026-07-28

Last updated: 2026-07-28

Branch: `feature/sprint-4.0-cutover-readiness`

Status values:

- PASS — V2 behavior is verified equivalent or intentionally improved without breaking business rules
- PARTIAL — V2 foundation exists but operational UI, device evidence, or production validation is incomplete
- BLOCKED — production cutover cannot proceed for this workflow
- DEFERRED — validation was explicitly postponed and must not be interpreted as PASS
- NOT APPLICABLE — workflow does not require V2 replacement

| Area | Legacy source | V2 source | Status | Evidence required | Current gap |
|---|---|---|---|---|---|
| Admin login | `index.html` | Login modules | PASS | automated test + browser login | desktop Chrome evidence recorded |
| Teacher login | `teacher.html` | Login and Teacher modules | PASS | automated test + browser login | desktop Chrome evidence recorded; physical iPad validation deferred |
| Logout | legacy pages | Auth/Login modules | PASS | direct browser logout evidence | login form restored, selection reset, and 83-room status displayed |
| Room list loading | `index.html`, `teacher.html` | Login/Room modules | PASS | 83-room dataset | desktop Chrome evidence recorded; physical iPad validation deferred |
| Room creation/edit | `index.html` | Room modules | PARTIAL | operational form parity | V2 operational UI not integrated |
| Student import | `index.html` XLSX parser | RoomService parsed-data boundary | PARTIAL | import fixture + Room ID preservation | binary XLSX parser remains legacy |
| Main Stock receive | `index.html` | Stock modules | PARTIAL | end-to-end operational UI test | V2 operational UI not integrated |
| Classroom distribution | `index.html` | Stock modules | PARTIAL | Main Stock decrease + Room Stock increase | V2 operational UI not integrated |
| Attendance save | `teacher.html` | Attendance modules | PARTIAL | create/edit/delete + Room Stock delta | operational form remains legacy |
| Attendance ETag Room Stock update | legacy `atomicRoomStockDelta` | FirebaseService + AttendanceService | PARTIAL | deterministic conflict test + real Firebase conflict validation | implementation and local deterministic test added; real multi-writer evidence pending |
| Attendance partial-save recovery | legacy `roomStockAdjust` queue | AttendanceManager + SyncService | PARTIAL | attendance-first failure fixture + queue conversion test | implementation and deterministic test added; browser evidence pending |
| Attendance audit write recovery | legacy best-effort stockLog/ledger | QueueStorage + AttendanceManager + SyncService | PARTIAL | audit failure fixture + persistent replay | audit-only queue and local test passed; production evidence pending |
| Pending milk | `teacher.html` | Stock/Teacher foundations | PARTIAL | Room Stock-only operation | operational form and adapter incomplete |
| Retroactive milk | `teacher.html` | Stock/Teacher foundations | PARTIAL | Room Stock-only operation | operational form and adapter incomplete |
| Vacation milk | `teacher.html` | Stock/Teacher foundations | PARTIAL | Room Stock-only operation | operational form and adapter incomplete |
| Offline queue persistence | `teacher.html` | QueueStorage | PASS | restart fixture | local deterministic evidence recorded; physical iPad validation deferred |
| Legacy/V2 queue format compatibility | legacy `rec`/`diff` | QueueStorage normalization | PARTIAL | representative legacy fixtures + replay | fixture coverage exists; actual operational fixture pending |
| Offline retry | `teacher.html` | Sync modules | PARTIAL | reconnect and failure-retention test | browser reconnect evidence pending; physical iPad validation deferred |
| Simultaneous Room Stock writes | legacy ETag path | modular ETag compare-and-retry | PARTIAL | conflict retry + real Firebase multi-writer test | code and deterministic test added; production evidence pending |
| Classroom report | `index.html` | Report modules | PARTIAL | formula comparison | browser-local adapter incomplete |
| Grade report | `index.html` | Report modules | PARTIAL | formula comparison | browser-local adapter incomplete |
| Whole-school report | `index.html` | Report modules | PARTIAL | formula comparison | browser-local adapter incomplete |
| Print report | legacy UI | Report export model | PARTIAL | print layout comparison | operational print UI incomplete |
| Excel export | legacy UI | Report export model | PARTIAL | exported workbook comparison | operational export UI incomplete |
| Photos | `teacher.html` | not integrated | BLOCKED | capture and persistence test | V2 operational UI missing; physical iPad validation deferred |
| Signatures | `teacher.html` | not integrated | BLOCKED | touch input and persistence test | V2 operational UI missing; physical iPad validation deferred |
| Queue badge | `teacher.html` | Sync events available | PARTIAL | UI event test | V2 badge UI missing |
| Offline banner | `teacher.html` | Sync events available | PARTIAL | browser offline/online test | V2 banner UI missing |
| Backup | legacy Admin workflow | not yet integrated | BLOCKED | Firebase export and restore rehearsal | cutover backup checklist pending |
| Restore | legacy Admin workflow | not yet integrated | BLOCKED | isolated restore rehearsal | cutover rollback plan pending |
| Desktop performance | legacy/V2 comparison | Sprint 3.9 | PASS | Network evidence | observed 4 requests / approximately 1.6 KB core refresh |
| Desktop browser shell | legacy/V2 comparison | `index-v2.html` | PASS | Admin, Teacher, Logout, Console | Admin, Teacher, Logout, Teacher Console, and post-Logout Console evidence recorded |
| Responsive mobile | legacy/V2 comparison | V2 | PARTIAL | recorded viewport test | 820 x 1180 layout and clean Console recorded; interaction, Teacher login, and Logout pending |
| iPad-class browser viewport | legacy/V2 comparison | V2 | PARTIAL | approximately 820 x 1180 CSS-pixel test | layout containment and clean Console pass; full login/logout interaction pending |
| Physical iPad | legacy/V2 comparison | V2 | DEFERRED | recorded device test or explicit production risk acceptance | explicitly skipped by the user/product owner on 2026-07-28; not required for feature-to-`develop` merge and not a PASS result |

## Cutover Rule

Production cutover is not approved while any safety-critical row remains BLOCKED. Deferred rows require explicit risk acceptance before production approval. Legacy `index.html` and `teacher.html` remain available as the rollback path.
