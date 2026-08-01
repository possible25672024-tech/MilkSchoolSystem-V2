# Firebase Authentication and Rules UAT Guide

Use only a separate Firebase test project. Never point these commands at the
Production project or the configured Production database URL.

## Prerequisites

- Node.js 24;
- Java 21 or later for current Firebase Emulator releases;
- Firebase CLI login with access only to the isolated test project;
- Email/Password enabled under Firebase Authentication;
- test data based on `firebase/test-seed.template.json`;
- Admin and Teacher Firebase UIDs inserted into `accessControl/users`;
- no `adminPassword`, `teacherPassword`, or `firebaseKey` under settings.
- only non-sensitive school/year/semester/per-crate values under
  `public/appSettings`.

## 1. Install repeatable test dependencies

```powershell
cd D:\MilkSchoolSystem-V2
npm install
```

## 2. Run official Rules Emulator UAT

```powershell
npm run test:firebase-rules
```

Required result:

```text
Firebase Rules Emulator UAT passed: anonymous deny, Admin allow, own-room allow, cross-room deny, disabled-user deny, and password-field deny.
```

The gate verifies anonymous denial, Admin access, Teacher own-room access,
cross-room denial, disabled-user denial, query-scoped history access, and
rejection of legacy password fields.

## 3. Deploy only to the isolated test project

Review the active project before and after deployment:

```powershell
$testProject = "REPLACE_WITH_TEST_PROJECT_ID"
firebase use --clear
firebase projects:list
firebase deploy --only database --project $testProject
```

Do not use a Firebase alias that could silently resolve to Production.

## 4. Configure the V2 test branch

Set the test database URL and Firebase Web API key in
`config/firebase-config.js` on the test branch only. Do not commit test
passwords. Confirm the URL does not contain `realtime-database-9fc52`.

## 5. Run destructive real-project rehearsal

This test signs in through Firebase Authentication, creates one far-future UAT
Attendance probe in the Teacher room, proves the cross-room write is denied,
proves a stale root ETag rejects Restore, then restores the original isolated
root and verifies its SHA-256. It refuses the configured Production host.

```powershell
$env:MILK_FIREBASE_TEST_PROJECT_CONFIRM = "ISOLATED_TEST_PROJECT"
$env:MILK_FIREBASE_TEST_DATABASE_URL = "https://TEST-PROJECT-default-rtdb.REGION.firebasedatabase.app"
$env:MILK_FIREBASE_TEST_API_KEY = "TEST_WEB_API_KEY"
$env:MILK_FIREBASE_ADMIN_EMAIL = "TEST_ADMIN_EMAIL"
$env:MILK_FIREBASE_ADMIN_PASSWORD = "TEST_ADMIN_PASSWORD"
$env:MILK_FIREBASE_TEACHER_EMAIL = "TEST_TEACHER_EMAIL"
$env:MILK_FIREBASE_TEACHER_PASSWORD = "TEST_TEACHER_PASSWORD"
$env:MILK_FIREBASE_TEACHER_ROOM_ID = "TEST_TEACHER_ROOM_ID"
$env:MILK_FIREBASE_OTHER_ROOM_ID = "TEST_OTHER_ROOM_ID"

npm run test:firebase-project
```

Required result:

```text
Real isolated Firebase project UAT passed. Backup SHA-256: ...
```

Clear credentials after the gate:

```powershell
Get-ChildItem Env:MILK_FIREBASE_* | Remove-Item
```

## 6. Live Browser evidence

Record commit, test project, tester, timestamp, browser, viewport, Console, and
Network for:

- Admin login, menus, receipt, distribution, reports, documents, Backup;
- Teacher login and room-only Attendance/Pending/Retroactive/Vacation;
- explicit cross-room denial;
- Logout and refresh-token session restore;
- 1101 px, 820 × 1180, and 600 px layout;
- image/PDF optimization and A4 print previews;
- offline Queue, reconnect, and no duplicate Room Stock mutation.

## 7. Rollback rehearsal

`firebase/database.rules.rollback.json` is a safe freeze-writes Rules version.
To rehearse it on the isolated project, temporarily point `firebase.json` at
the rollback file, deploy to the explicit test project, confirm all operational
writes fail, then restore the active Rules and repeat the Emulator gate.

Production remains unauthorized until the evidence is reviewed and explicit
cutover approval is recorded.
