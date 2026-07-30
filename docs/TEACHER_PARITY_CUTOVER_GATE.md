# Sprint 4.9 — Teacher Parity and Cutover Gate

Date: 2026-07-30

Branch: `feature/sprint-4.9-teacher-parity-cutover`

Status: **AUTOMATED PASS / LOCAL BROWSER GATE PENDING**

## Implemented boundary

- one-student authenticated-room Attendance report;
- selected-range present, absent, unchecked, rate, notes, and timeline;
- deterministic A4 student-report print pages;
- one landscape Room A4 date matrix containing the whole selected range, with ✓ / ✕ / — status, totals, and drinking percentages;
- Room daily photos and homeroom Teacher signatures on following evidence pages grouped at up to five dates per page;
- Student daily photos and the homeroom Teacher signature inline after the selected-student report;
- one photo row of at most five images per evidence date;
- matching Pending, Retroactive, and Vacation A4 reports with student/quantity detail, photos, available receiver signatures, and Teacher approval;
- Attendance History Edit/Delete actions with exact-date Daily Attendance routing;
- actual read-only Room Stock and last-updated view;
- room-isolated device-local display preferences;
- complete 12-item Teacher navigation;
- fixed blue Teacher header plus a dark-blue left desktop sidebar that starts below it, with compact narrow-screen fallback;
- room/Teacher identity, grouped menus, active-item marker, scrollable menu area, and identity footer;
- editable authenticated-room homeroom Teacher name;
- `ดื่มนม` / `ไม่ดื่มนม` user-facing wording while persisted `present` / `absent` values remain compatible;
- App dynamic-load and initialization wiring.

## Read-only ownership

`TeacherParityView` and `TeacherParityManager` contain no direct:

- Firebase Service or Repository access;
- `fetch` or `XMLHttpRequest`;
- Attendance, Pending, Retroactive, or Vacation write;
- Room Stock or Main Stock mutation;
- Queue creation or replay;
- ledger or stockLog repair;
- media payload hydration.

The only operational write added in this revision is:

```text
TeacherParityView
  -> TeacherParityManager
  -> TeacherManager
  -> TeacherService
  -> RoomRepository
  -> milkApp/rooms/{matchedRoomKey}/teacher
```

The room ID comes from the authenticated Teacher session. Cross-room targets, blank names, and names longer than 120 characters fail before the write. The Repository updates only the `teacher` leaf; it does not replace students, Room Stock, Attendance, Queue, ledger, stockLog, or the room record.

The preference store writes only the allowlisted UI settings under:

```text
milkapp_teacher_preferences_v1
```

It stores no operational, student, evidence, Queue, credential, or stock data.

## Automated evidence

Isolated results:

```text
Teacher parity service checks passed.
Teacher preference store checks passed.
Teacher parity manager checks passed.
Teacher parity UI checks passed.
Authenticated-room Teacher profile checks passed.
Sprint 4.9 plan checks passed.
Cutover documentation checks passed.
```

Complete regression:

```text
Discovered 54 regression checks.
ALL 54 REGRESSION CHECKS PASSED (2.9s)
```

Additional checks:

- JavaScript syntax checks passed;
- `git diff --check` passed;
- protected legacy diff is empty.

Requested UI revision gates:

- all 12 menu items remain available in the desktop left sidebar;
- the fixed blue top header, below-header left sidebar, room/Teacher identity, groups, icons, active highlight, scrollable area, and identity footer are present;
- daily controls, summaries, reports, student timelines, Pending rows, and A4 print use milk-consumption wording;
- Room A4 uses the accepted date-column matrix;
- Room evidence starts on following pages grouped at five dates per page, and each Room/Student evidence date is limited to one five-photo row;
- Pending, Retroactive, and Vacation history exposes matching A4 print actions;
- no Attendance payload, Queue format, Firebase schema, or Room Stock calculation changed.

## Publication evidence

```text
Draft PR:       #3
Base:           develop
Head:           feature/sprint-4.9-teacher-parity-cutover
Remote commit:  e28c2576cd129660d1587911e0939844f1b6c87f
Source tree:    3acd19b91beae241d3f96ee829aad5ce02420fc6
State:          OPEN / DRAFT / MERGEABLE
```

The local and GitHub source-tree SHAs match. Publication does not authorize merge or deployment.

## Protected files

```text
index.html   unchanged
teacher.html unchanged
```

## Local browser gate

Pending updated evidence for:

- desktop header/left-sidebar and all 12 controls;
- Chrome Responsive `820 x 1180`;
- Room and Student A4 date/photo/signature layout;
- Pending, Retroactive, and Vacation A4 reports;
- clean Console and read-only report Network traffic;
- one approved scoped Teacher-name leaf write.

Use `docs/SPRINT_4_9_BROWSER_ACCEPTANCE_CHECKLIST.md`.

## Decision

The branch is ready for Draft PR review into `develop`. Browser PASS is required before final merge into `develop`.

No `main` merge, production deployment, legacy replacement, Firebase rule change, incident closure, backup/restore execution, or physical iPad PASS is authorized.
