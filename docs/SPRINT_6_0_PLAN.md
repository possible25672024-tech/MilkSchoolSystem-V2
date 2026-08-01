# Sprint 6.0 — Production Readiness and Release

Date: 2026-08-01

Branch: `feature/sprint-6.0-production-readiness-release`

Status: **STARTED — DISTRIBUTION LIVE CALCULATION FIXED / RELEASE GATES PENDING**

## Goal

Close the final browser-acceptance defects, prove isolated backup/restore and
deployment rollback, prepare the release handoff, and require an explicit
product-owner decision before any Production action.

## First Accepted Correction

- selecting a room shows its actual roster/configured student count immediately;
- manual days calculate `students × days` without hiding the preview when Main
  Stock is insufficient;
- the preview shows total boxes, crate/remainder, Main Stock before/after, Room
  Stock before/after, and exact shortage;
- insufficient Main Stock blocks submission;
- the guarded Stock Service revalidates current Main Stock before the atomic
  Main Stock, Room Stock, distribution, ledger, and operation write.

The product owner confirmed that backup download now works. The existing fast
core and full-evidence profiles remain unchanged in this correction.

## Release Gates Still Required

1. Run Live Server browser acceptance for classroom selection and repeated day
   edits at sufficient and insufficient Main Stock balances.
2. Confirm Console is clean and Network performs no write during preview.
3. Rehearse full backup and Restore only against an isolated Firebase instance.
4. Review Firebase Rules, rollback version, deploy command, and rollback command.
5. Resolve or explicitly retain every Stock anomaly and the quarantined
   room/date incident with signed evidence.
6. Take a Production safety backup immediately before approved cutover.
7. Obtain explicit approval for `main`, release tag, Production deployment, and
   post-deploy smoke testing.

## Safety Boundary

- Do not change `index.html` or `teacher.html`.
- Do not write Main Stock or Room Stock during preview.
- Do not auto-repair historical Stock values.
- Do not run Restore against Production during validation.
- Do not merge `main`, create the release tag, deploy, or cut over traffic
  without explicit product-owner approval.

## Automated Acceptance

- reproduce the reported `38 students × 30 days`, `36 boxes/crate`, Main Stock
  `0`, Room Stock `2280` case;
- expect `1140 boxes`, `31 crates + 24 boxes`, projected Main Stock `-1140`,
  projected Room Stock `3420`, and shortage `1140`;
- confirm submission remains blocked for the insufficient preview;
- run the complete regression suite and verify protected files are unchanged.
