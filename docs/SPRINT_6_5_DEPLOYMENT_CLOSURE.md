# Sprint 6.5 — External UAT, Incident Closure and Production Approval

Date: 2026-08-01

Branch: `feature/sprint-6.5-deployment-closure`

Status: **IMPLEMENTED GATES / EXTERNAL EXECUTION PENDING**

Release decision: **NOT READY FOR DEPLOYMENT**

## Scope

This Sprint addresses Sprint 6.4 blockers 1, 2, 4, and 5 without claiming
evidence that was not executed:

1. official Firebase Realtime Database Rules Emulator UAT;
2. destructive rehearsal on a separate Google Firebase test project;
4. formal disposition of room `mqn0z13eyx5b` on `2026-07-28`;
5. explicit Production, `main`, tag, deployment, cutover, and post-release
   approval.

Live Browser/device blocker 3 remains a separate mandatory release input.

## Delivered controls

- `scripts/run-sprint-6.5-closure.ps1` runs external gates in a fixed order and
  refuses a dirty or non-Sprint-6.5 branch;
- Java 21+, required isolated-project environment, and explicit test-project
  confirmation are enforced before destructive UAT;
- `scripts/audit-room-incident.mjs` performs a read-only, SHA-256-bound forensic
  audit of the quarantined room from a Backup file;
- `release/production-approval.template.json` separates each Production
  authorization instead of treating “continue” as blanket deployment consent;
- `scripts/verify-production-approval.mjs` binds signed approval to the exact
  release commit and requires Emulator, real test project, incident closure,
  and Live Browser/device evidence;
- external logs and evidence are ignored by Git to prevent accidental commits
  of environment-specific or sensitive material.

Automated regression passes **101/101**. The protected `index.html` and
`teacher.html` remain unchanged.

## Current execution result

The dependency tree installed successfully in the isolated build environment.
The official Rules Emulator still could not be executed because its Java
artifact is downloaded from a network host outside this environment's allowed
boundary. The installed Java runtime is 17 while the repeatable gate requires
Java 21 or later.

No Firebase test project ID, Web API key, Admin/Teacher test accounts, or
authorization to deploy test Rules was available. Therefore real-project UAT
was not executed.

The previously referenced `milk_backup_2026-07-31.json` was not available in
the active project workspace, so the room incident cannot be closed from
authoritative data in this build environment. Known facts remain recorded in
`docs/INCIDENT_MQN0Z13EYX5B_CLOSURE_GATE.md`.

## One-command external gate

After configuring the environment variables from
`docs/FIREBASE_AUTH_RULES_UAT_GUIDE.md`, use:

```powershell
.\scripts\run-sprint-6.5-closure.ps1 `
  -IncidentBackup D:\path\to\milk_backup_2026-07-31.json
```

The command does not merge `main`, create a tag, or deploy Production.

## Production approval boundary

Do not change any `false` value in the approval template until its named
evidence exists. After all evidence passes, copy the template outside Git,
enter the exact full release commit, sign every authorization deliberately,
then verify it:

```powershell
node scripts/verify-production-approval.mjs `
  evidence\production-approval.signed.json
```

Verification confirms approval only; it intentionally performs no deployment.

Final status: **NOT READY FOR DEPLOYMENT**
