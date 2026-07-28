# Sprint 4.1 — Teacher UI Shell Validation Report

Date started: 2026-07-28

Last updated: 2026-07-28

Branch: `feature/sprint-4.1-teacher-ui-shell`

Overall status: PARTIAL PASS — automated, responsive, desktop Teacher shell, desktop Logout, and Teacher Network gates passed; desktop Admin, explicit Offline/Online transition, and desktop Console evidence remain pending

## Automated Gate

Verified locally by the user:

- Login foundation checks passed
- Stock module checks passed
- Report module checks passed
- Room module checks passed
- Teacher module checks passed
- Attendance module checks passed
- Sync module checks passed
- Firebase request header checks passed
- Performance module checks passed
- Teacher core payload checks passed
- Cutover concurrency checks passed
- Audit recovery checks passed
- Cutover documentation checks passed
- Teacher UI shell checks passed
- feature branch synchronized with origin
- working tree clean

Result: PASS

## Responsive Browser Gate

Environment recorded from supplied screenshots:

- Browser: Chrome desktop
- Host: Live Server at `127.0.0.1:5500/index-v2.html`
- Device Toolbar: Responsive, 820 x 1180 CSS pixels
- Date observed: 2026-07-28

### Teacher Login and Read-Only Shell

Result: PASS

Observed:

- modular Teacher shell rendered after login
- school name displayed
- room name displayed as `อ.3-2`
- teacher identity displayed
- current Room Stock displayed as `1,073 กล่อง`
- pending queue count displayed as `0 รายการ`
- online badge displayed
- shell remained contained within the emulated viewport
- identity and metric cards remained readable
- Logout button remained visible and usable
- no abnormal horizontal overflow visible
- Console displayed only `MilkSchoolSystem V2 Started`
- no visible application error or warning

### Responsive Logout

Result: PASS

Observed:

- Teacher shell cleared
- login form returned
- room/role selector returned to the unselected state
- password field returned empty
- connection status reported 83 rooms
- Console remained clean with only `MilkSchoolSystem V2 Started`

## Desktop Teacher Shell and Network Gate

Environment recorded from supplied screenshots:

- Browser: Chrome desktop
- Device Toolbar: disabled
- Host: Live Server at `127.0.0.1:5500/index-v2.html`
- Network filter: Fetch/XHR
- Date observed: 2026-07-28

### Desktop Teacher Login

Result: PASS

Observed:

- modular Teacher shell rendered after login
- school name displayed
- room name displayed as `อ.3-1`
- teacher identity displayed
- current Room Stock displayed as `962 กล่อง`
- pending queue count displayed as `0 รายการ`
- online badge displayed
- Logout button remained visible and usable

### Teacher Core Network

Result: PASS

Observed exactly four successful read requests:

- today's Attendance `data.json` — HTTP 200, approximately 0.3 KB
- `settings.json` — HTTP 200, approximately 0.6 KB
- authenticated room `roomStock/<roomId>.json` — HTTP 200, approximately 0.3 KB
- `updatedAt.json` — HTTP 200, approximately 0.3 KB

Recorded total:

- 4 requests
- approximately 1.6 KB transferred

Not visible during Teacher shell rendering:

- no failed application request
- no `PUT`, `PATCH`, `POST`, or `DELETE`
- no full `rooms.json` request
- no room-history `mcAttendance.json?orderBy=...` request
- no `distributes.json`
- no `absentMilk.json`
- no `retroMilk.json`
- no `vacationMilk.json`
- no `stockTransactions.json`
- no Main Stock `stock.json` request

### Desktop Logout Network

Result: PASS

Observed:

- Teacher shell cleared and login form returned
- room/role selector returned to the unselected state
- password field returned empty
- the previous four Teacher read requests remained visible in Network history
- `settings.json` and full `rooms.json` loaded after Logout to rebuild the login form and 83-room selector
- all visible requests returned HTTP 200
- no write request was visible

The post-Logout `rooms.json` request is expected for the login form and does not violate the rule that the Teacher shell must not download all rooms after Teacher login.

## Business and Architecture Evidence

Confirmed by automated tests and browser evidence:

- Room Stock is display-only in Sprint 4.1
- queue count comes from the existing Sync/Queue boundary
- Logout delegates through the existing Login/Auth boundary
- Teacher shell is limited to the authenticated room
- zero and negative Room Stock rendering is protected by tests
- View does not access Firebase, repositories, Local Storage, or Session Storage directly
- View does not calculate or mutate stock
- normal Teacher refresh remains date-scoped
- protected `index.html` and `teacher.html` remain unchanged

## Remaining Evidence Before Merge

Required:

- desktop Admin Login after the Sprint 4.1 role-routing changes
- desktop Admin Logout
- desktop Console confirmation for Admin, Teacher, and post-Logout flows
- DevTools switched to Offline with badge observed as `ออฟไลน์`
- return Online with badge observed as `ออนไลน์`

## Physical iPad

Status: DEFERRED

Physical iPad testing remains outside the Sprint 4.1 merge gate and must not be represented as PASS.

## Decision

Automated, responsive, desktop Teacher, desktop Logout, and Teacher Network gates passed. Sprint 4.1 is not yet ready to merge into `develop` until desktop Admin, explicit Offline/Online transition, and desktop Console evidence are recorded.
