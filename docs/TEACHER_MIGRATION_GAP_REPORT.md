# Teacher Module Migration Gap Report

Date: 2026-07-27

Branch: `feature/sprint-3.6-teacher`

## Scope

Sprint 3.6 extracts the teacher room-scoped read boundary, teacher-session validation, teacher dashboard calculations, and teacher command preparation. It does not replace the operational `teacher.html` page and does not change the offline queue.

## Legacy Findings

### Login and Session

The operational teacher page supports two session sources:

- its own `tc_sess` browser session
- `sessionStorage.milkApp_loginSession` created by the admin/V2 login flow

The modular implementation uses `AuthService.getSession()` and requires:

- `role === "teacher"`
- a non-admin `classId` or `roomId`
- all teacher commands to target exactly that authenticated room

### Essential Login Data

The legacy page already separates essential login data from lazy operational data. Essential data includes:

- settings
- rooms
- Room Stock
- update timestamps

The modular Teacher repository keeps the same room-oriented intent.

### Attendance Performance

The legacy performance fix removed all-school `mcAttendance` from the login payload and reads only keys in this range:

- start: `{roomId}_`
- end: `{roomId}_\uf8ff`

Sprint 3.6 preserves that key-prefix query through `TeacherRepository.loadAttendanceForRoom()` and extends `FirebaseService`/`BaseRepository` with read-query support.

### Room Stock Rules

The teacher page currently performs these Room Stock operations:

- ATTENDANCE
- PENDING
- RETRO
- VACATION
- ROLLBACK

All of them must have `mainStockDelta: 0`.

Sprint 3.6 prepares and validates these commands but does not write them. Operational writes remain in the protected legacy page until the Attendance and Sync migrations are complete.

## Implemented V2 Boundaries

### TeacherRepository

- reads `milkApp/settings`
- reads `milkApp/rooms`
- reads only the authenticated Room Stock path
- reads attendance with a room-key prefix query
- reads distributions, pending, retroactive, vacation, ledger, and update timestamps
- remains read-only

### TeacherService

- validates teacher sessions
- rejects Admin and cross-room access
- normalizes room and student data
- filters every operational collection to the authenticated room
- calculates distributed, attendance, pending, retroactive, vacation, expected Room Stock, actual Room Stock, and variance
- prepares Room Stock commands with Main Stock isolation

### TeacherManager

- resolves the active session through AuthService
- refreshes the room-scoped teacher snapshot
- exposes dashboard and command preparation boundaries
- emits teacher events
- does not access Firebase directly

## Remaining Gaps

### Operational Teacher UI

`index-v2.html` remains an integration shell. It does not yet contain the full teacher dashboard, daily attendance form, pending milk form, retroactive milk form, vacation milk form, media capture, signatures, or print views.

### Attendance Writes

Creating, editing, and deleting attendance records remains scheduled for Sprint 3.7. Sprint 3.6 does not write `mcAttendance`.

### Atomic Room Stock Writes

The legacy page uses a Room Stock transaction operation for consumption and rollback. The modular command boundary is ready, but repository writes and conflict handling must be connected with Attendance/Sync work.

### Offline Queue

The current persistent teacher offline queue, retry timer, and reconnect flushing remain untouched. They are scheduled for Sprint 3.8.

### Other Room-Scoped Collections

Attendance is queried by Firebase key prefix because its collection is the largest and its key format supports safe prefix matching. Other teacher collections are currently read and then filtered in the Service because adding `orderByChild/equalTo` queries may require Firebase `.indexOn` rule changes. This avoids breaking the current production rules during extraction.

### Media Payloads

Photos and signatures remain in legacy records. Sprint 3.6 does not change compression, storage, or IndexedDB behavior.

## Safety Result

The extracted module does not:

- modify Main Stock
- write Room Stock
- write attendance or milk records
- change Firebase schema
- change `index.html`
- change `teacher.html`
- change offline behavior

## Validation Required

Run:

```powershell
node tests/login-foundation-check.mjs
node tests/stock-module-check.mjs
node tests/report-module-check.mjs
node tests/room-module-check.mjs
node tests/teacher-module-check.mjs
```

Then open `index-v2.html` through Live Server and verify Admin login, Teacher login, Logout, room loading, and a clean browser console.
