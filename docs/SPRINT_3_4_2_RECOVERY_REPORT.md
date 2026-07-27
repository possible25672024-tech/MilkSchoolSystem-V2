# Sprint 3.4.2 Recovery Report

Date: 2026-07-27

Branch: `feature/recovery-sprint-3.4.2`

## Reason for Recovery

Four previously reported foundation commits were not available in the local Git object database, reflog, unreachable objects, or GitHub history. Recovery was performed from the current `develop` head (`68fc0ec`) on an isolated feature branch.

## Recovered Foundation

### Runtime Configuration

- Supports `config/firebase-config.js`.
- Supports runtime overrides through `ConfigManager`.
- Supports the legacy `milk_school_db.settings.firebaseUrl` and `firebaseKey` values.
- Does not hard-code school credentials in application modules.

### Firebase Realtime Database REST

- `GET`
- `PUT`
- `PATCH`
- `POST`
- `DELETE`
- Request timeout handling
- `cache: no-store`
- Repository access routed through `FirebaseService`

### Login

Confirmed legacy-compatible data paths:

- `milkApp/settings`
- `milkApp/rooms`

Confirmed password fields:

- `settings.adminPassword`
- `settings.teacherPassword`
- default fallback: `1234`

Confirmed session key:

- `sessionStorage.milkApp_loginSession`

The login flow is now:

`index-v2.html → LoginManager → AuthService → LoginService → LoginRepository → FirebaseService → Realtime Database`

## Files Changed

- `config/firebase-config.js`
- `modules/config/configManager.js`
- `modules/services/firebaseService.js`
- `modules/repositories/baseRepository.js`
- `modules/repositories/loginRepository.js`
- `modules/services/loginService.js`
- `modules/login/authService.js`
- `modules/login/loginManager.js`
- `modules/core/app.js`
- `modules/core/bootstrap.js`
- `index-v2.html`
- `tests/login-foundation-check.mjs`
- `SPRINT_STATUS.md`

## Protected Legacy Files

The following files were not modified:

- `index.html`
- `teacher.html`

## Validation Completed

- JavaScript syntax checks passed for all recovered JavaScript files.
- Login foundation static validation passed.
- Dependency order was checked.
- Bootstrap has one `DOMContentLoaded` binding.
- Fake unconditional login success was removed.
- `LoginManager` does not call Firebase directly.
- Feature branch diff contains no changes to legacy files.

## Local Validation Required

Run:

```powershell
git pull --ff-only origin feature/recovery-sprint-3.4.2
node tests/login-foundation-check.mjs
```

Then open `index-v2.html` through Live Server and test:

1. Classroom list loads.
2. Incorrect admin password is rejected.
3. Correct admin password succeeds.
4. Incorrect teacher password is rejected.
5. Correct teacher password succeeds for a selected classroom.
6. Refresh restores the session for the same browser tab.
7. Logout removes `milkApp_loginSession`.

## Merge Gate

Do not merge into `develop` and do not begin Sprint 3.4.3 until the local browser smoke test passes.
