# Sprint 6.4 — Firebase Authentication, Security Rules and UAT

Date: 2026-08-01

Branch: `feature/sprint-6.4-firebase-auth-rules-uat`

Status: **PARTIAL PASS — 100/100 AUTOMATED / AUTH IMPLEMENTED / EXTERNAL RULES AND LIVE UAT BLOCKED**

Release decision: **NOT READY FOR DEPLOYMENT**

## Implemented

- Firebase Email/Password REST authentication with short-lived ID tokens;
- session-scoped refresh token, automatic token refresh, restore, and sign-out;
- Realtime Database requests receive the current ID token dynamically;
- legacy static database secret loading is disabled;
- public login directory contains labels and account email identifiers only;
- Teacher-safe school/year/term values are isolated under `public/appSettings`
  while full `settings` reads are Admin-only;
- authorization is loaded from `milkApp/accessControl/users/{firebaseUid}`;
- Admin and Teacher sessions are bound to the authenticated Firebase UID;
- browser-side `settings.adminPassword`, `settings.teacherPassword`, and the
  default `1234` credential path are removed;
- Teacher collection reads use room-scoped Firebase queries;
- deny-by-default Realtime Database Rules define Admin access, Teacher
  room-scope access, anonymous denial, disabled-user denial, and forbidden
  legacy password/key fields;
- a freeze-writes rollback Rules version is included;
- full-root Restore rejects backups that omit the active Admin Firebase UID,
  public safe settings, or that reintroduce legacy password/key fields;
- emulator and real isolated-project UAT programs are included.

## Automated Evidence

- full regression: **100/100 PASS**;
- Auth sign-in, refresh, restore, password redaction, and sign-out: PASS;
- UID profile, Admin role, Teacher room match, and cross-room rejection: PASS;
- static Rules contract and rollback contract: PASS;
- Sprint 6.3 isolated Backup/Restore and stale ETag gate: PASS;
- Live HTTP assets, responsive source contracts, payload, and unique IDs: PASS;
- `index.html` and `teacher.html`: unchanged.

## External UAT Status

The Firebase CLI was installed in the isolated build environment, but the
Realtime Database Emulator Java artifact is hosted outside the allowed network
boundary and could not be downloaded. No isolated Google Firebase project,
accounts, API key, or authorization to deploy test Rules was available.

Therefore these are prepared but not claimed as PASS:

1. `npm run test:firebase-rules` against the official Database Emulator;
2. `npm run test:firebase-project` against a separate Google Firebase project;
3. Live Browser login and Admin/Teacher workflows using real Firebase ID tokens;
4. clean Console/Network, Responsive, print, image/PDF, offline Queue, and
   reconnect evidence under deployed Rules.

See `docs/FIREBASE_AUTH_RULES_UAT_GUIDE.md` for the repeatable gate.

## Data Migration Preconditions

Before deploying these Rules even to a test project:

- enable Firebase Authentication Email/Password;
- create one Admin account and one account per Teacher room;
- create `accessControl/users/{uid}` profiles with `enabled`, `role`, and
  Teacher `roomId`;
- create `public/loginDirectory` entries without passwords;
- copy only school/year/semester/per-crate display values to
  `public/appSettings`;
- remove `settings.adminPassword`, `settings.teacherPassword`, and
  `settings.firebaseKey` from the isolated dataset;
- retain a verified full Backup and root ETag.

## Remaining Production Blockers

- official Emulator or real isolated-project Rules allow/deny evidence;
- real Firebase Authentication browser evidence;
- real isolated-project Backup → probe write → stale Restore rejection →
  current-ETag Restore → SHA-256 comparison;
- Live Browser and physical-device evidence or explicit risk acceptance;
- audited disposition of room `mqn0z13eyx5b` on `2026-07-28`;
- explicit approval for Production Backup, `main`, tag, Rules deployment,
  application deployment, traffic cutover, and post-release verification.

## Safety Boundary

- no Production Firebase request or write was performed;
- no Rules were deployed;
- no Production Backup or Restore was performed;
- no `main` merge or tag was created;
- no Stock or history record was repaired;
- protected legacy pages remain unchanged.

Final status: **NOT READY FOR DEPLOYMENT**
