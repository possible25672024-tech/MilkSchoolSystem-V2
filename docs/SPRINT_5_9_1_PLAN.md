# Sprint 5.9.1 — Admin Parity Corrections

Date: 2026-07-31

Status: **AUTOMATED PASS — 84/84 / LIVE BROWSER AND ISOLATED FIREBASE UAT PENDING**

## Goal

Close the eight Admin acceptance gaps reported after Sprint 5.9 without
duplicating Teacher workflows, silently repairing historical Stock, or loading
media-bearing whole-school collections.

## Delivered Scope

1. Classroom distribution now records up to five processed photos plus separate
   receiver and sender names/signatures with the guarded Stock transaction.
2. Weekly pending, retroactive, and vacation Admin menus delegate to the full
   selected-room Teacher page and provide an explicit return-to-Admin action.
3. The drinking overview aggregates every classroom for one date and shows
   school totals, monthly drinking rate, latest checks, and per-room status.
4. Attendance history discovers lightweight record keys, filters by room/month,
   and hydrates the full selected record only when details are requested.
5. Distribution reports calculate `effectiveStockAfter = stockBefore - total`,
   show the original stored value separately when it is inconsistent, and keep
   current Main Stock sourced only from `milkApp/stock`.
6. Backup root consistency checks use `X-Firebase-ETag` with `print=silent` and
   perform root key discovery in a separate `shallow=true` request. Firebase
   never receives the unsupported ETag-plus-shallow combination.

## Safety Boundary

- Historical `stockAfter` values remain immutable audit evidence.
- No automatic Main Stock or Room Stock rebuild is introduced.
- Current Main Stock is never derived from a malformed historical row.
- Teacher room operations continue to use their accepted Service/Repository
  paths and selected-room authorization.
- Whole-school Attendance lists never hydrate photos or signatures until one
  explicit detail action.
- Restore remains previewed, checksum-verified, typed-confirmed, backed up, and
  ETag guarded.
- Production restore, Rules deployment, `main`, and cutover remain blocked.

## Automated Acceptance

- Admin school-wide drinking overview and history behavior;
- Admin selected-room routing to Pending, Retroactive, and Vacation pages;
- distribution photo/signature persistence contract;
- calculated-versus-stored Main Stock audit output;
- Firebase root marker URL contains `print=silent` and no `shallow`;
- chunked Backup verifies root ETag and key set before and after hydration;
- complete regression: **84/84 PASS**;
- protected `index.html` and `teacher.html`: byte-identical to Sprint 5.9.

## Pending Manual Acceptance

1. Open all eight reported screens through Live Server on desktop and mobile.
2. Verify one controlled Admin distribution with disposable evidence.
3. Verify Pending, Retroactive, and Vacation selected-room ownership.
4. Verify school overview/history against known Teacher records.
5. Download a full backup from isolated Firebase and verify SHA-256.
6. Preview and restore only into an isolated Firebase target.

