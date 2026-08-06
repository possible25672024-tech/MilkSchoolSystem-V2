# Sprint 6.3 — UAT, Security and Isolated Restore Readiness

Date: 2026-08-01

Branch: `feature/sprint-6.3-uat-security-readiness`

Status: **PARTIAL PASS — LOCAL ISOLATED PASS / LIVE BROWSER BLOCKED / REAL TEST FIREBASE BLOCKED / SERVER-SIDE AUTHORIZATION BLOCKED**

## Goal

Exercise the release candidate through Live HTTP delivery, Responsive source
contracts, security review, and a destructive Backup/Restore rehearsal that is
strictly isolated from Production. Record every unproved gate as blocked rather
than treating an automated substitute as real browser or real Firebase evidence.

## Completed Evidence

### Local isolated Backup/Restore

- started a disposable Firebase REST-compatible HTTP instance on `127.0.0.1`;
- loaded the production `FirebaseService`, `AdminSystemRepository`, and
  `AdminSystemService` against only that isolated URL;
- created a full Backup and verified settings, Main Stock, rooms, rosters,
  Room Stock, histories, documents, and document contents;
- changed the isolated source, validated SHA-256 and current root ETag, then
  restored the Backup with the required safety-backup flag and Thai typed
  confirmation;
- verified the Restore audit entry and the restored counts/content;
- simulated a concurrent write after preview and verified HTTP 412 produces
  `RESTORE_CONFLICT` without overwriting the newer value;
- contacted no `firebaseio.com` or `firebasedatabase.app` host during the
  rehearsal.

Result: **LOCAL ISOLATED PASS**. This proves the application's REST/ETag
contract but does not replace a rehearsal on a separate Google Firebase test
project with its deployed Rules.

### Live HTTP and Responsive source contracts

- served `index-v2.html` and all eager/lazy runtime assets over local HTTP;
- verified every declared runtime script returns `200`, has JavaScript content,
  and is non-empty;
- verified the viewport declaration, Desktop `1101 px`, Tablet `900 px`, and
  Phone `600 px` breakpoints;
- verified horizontal overflow containment, minimum 44 px controls, and unique
  HTML IDs;
- verified the raw eager HTML/JavaScript payload remains below the 2.5 MB
  release budget (current measured total approximately 1.84 MB);
- retained only local runtime script sources.

Result: **SOURCE/HTTP PASS**. Real layout dimensions, Console, Network action
methods, image/PDF selection, print preview, and touch behavior remain
**LIVE BROWSER BLOCKED** because no Chromium, Firefox, or WebKit executable is
installed in this execution environment.

## Security Review

### Controls present

- Admin system functions require an Admin session object;
- Backup uses SHA-256 and a versioned envelope;
- Restore requires a validated preview, current safety Backup, exact typed
  confirmation, and root ETag;
- stale preview Restore is rejected without overwrite;
- the quick core Backup is reference-only and cannot replace the full root;
- Admin Views do not call Firebase or `fetch` directly;
- runtime JavaScript dependencies are local;
- Production Restore, Rules deployment, `main`, release tag, and cutover remain
  unauthorized.

### Critical release blocker: server-side authorization

The current runtime points at the Production Realtime Database URL with an empty
REST `authToken`. Login compares `settings.adminPassword` and
`settings.teacherPassword` in browser JavaScript and stores the resulting
session in `sessionStorage`. A client-side password and client-created session
cannot enforce database authorization.

Before Production cutover, the project must provide and verify all of these:

1. Firebase Authentication or an equivalent trusted authentication service;
2. Firebase Rules that enforce Admin versus Teacher permissions on the server;
3. room-scoped Teacher reads/writes and Admin-only system/Backup/Restore writes;
4. no readable plaintext operational passwords in public database paths;
5. Rules emulator or isolated-project tests for allowed and denied operations;
6. an identified, deployable Rules version plus a rollback Rules version.

Result: **SERVER-SIDE AUTHORIZATION BLOCKED**. Sprint 6.4 must not deploy or
cut over Production until this is remediated and independently verified.

## Remaining Manual/External UAT

Record tester, timestamp, commit, browser/device, and isolated Firebase project
for every row.

| Gate | Expected evidence | Status |
|---|---|---|
| Desktop Admin | Login, all menus, receipt, distribution preview, reports, documents, Backup download, clean Console | PENDING |
| Responsive Admin | 820 × 1180 and phone-width containment, scroll, tables, dialogs, Logout | PENDING |
| Teacher | Login, room-only data, Attendance/Pending/Retroactive/Vacation, Queue, Logout | PENDING |
| Image/PDF | Large image optimization and eligible/non-eligible PDF size display | PENDING |
| Network | No write during previews/reports; expected guarded writes only after confirmation | PENDING |
| Print | Receipt, distribution, student, operational, and Attendance A4 previews | PENDING |
| Real test Firebase | Backup/Restore/count comparison and concurrent ETag rejection | PENDING |
| Rules | Admin allow, Teacher room-scope allow, cross-room/anonymous deny | BLOCKED |
| Physical iPad | Touch, camera, signature, offline queue, reconnect | DEFERRED — requires evidence or explicit risk acceptance |

## Existing Data Blocker

The quarantined incident remains open and must not be silently repaired:

- room `อ.3-3`;
- room ID `mqn0z13eyx5b`;
- date `2026-07-28`;
- recorded discrepancy: `-22` Room Stock.

Close it only through an audited product-owner/data-verifier decision. Do not
rewrite Main Stock, Room Stock, Queue, ledger, stockLog, or history merely to
make the release gate pass.

## Sprint 6.4 Entry Rule

Sprint 6.4 may prepare a Release Candidate and cutover package. Production
Backup, `main` merge, tag, deployment, Restore, or traffic switch requires:

- completed Live Browser evidence;
- a real isolated Firebase rehearsal;
- server-side authorization remediation and Rules tests;
- incident closure or explicit audited disposition;
- explicit product-owner approval.

## Safety Boundary

- Do not change `index.html` or `teacher.html`.
- Do not contact, restore, or mutate Production Firebase during tests.
- Do not auto-repair Stock or historical data.
- Do not merge `main`, create a release tag, deploy, or cut over traffic.
