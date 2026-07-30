# Sprint 4.9 — Non-Destructive Cutover Rehearsal

Date: 2026-07-30

Status: **DOCUMENTED DRY RUN ONLY — PRODUCTION REHEARSAL NOT EXECUTED**

## Purpose

Confirm that the completed modular Teacher navigation can be evaluated without changing production routes, Firebase data, protected legacy pages, or browser Queue contents.

## Dry-run sequence

1. Record the approved `develop` commit and candidate feature commit.
2. Confirm `index.html` and `teacher.html` are unchanged.
3. Run all automated regression checks.
4. Open `index-v2.html` locally without redirecting production traffic.
5. Login to a non-quarantined Teacher room.
6. Validate all 12 Teacher navigation items.
7. Run read-only Student Report and Room Stock checks.
8. Validate device-local display settings without Firebase writes.
9. Validate the Teacher-profile form only in an approved non-quarantined room and confirm the Network write targets only `rooms/{matchedRoomKey}/teacher`.
10. Validate one landscape Room A4 matrix for all selected date columns, then evidence pages of up to five dates with one-row photos and the homeroom Teacher signature.
11. Validate matching Pending, Retroactive, and Vacation A4 reports from already-loaded history.
12. Confirm Console and Network evidence.
13. Logout and verify the legacy pages remain available.

## Stop conditions

Stop immediately if:

- any Main Stock or Room Stock value changes during a read-only check;
- a report, Room Stock, or device-display action sends `POST`, `PUT`, `PATCH`, or `DELETE`;
- a Teacher-profile save writes any path other than the authenticated room's `teacher` leaf;
- a Queue entry is created, replayed, removed, or altered;
- another room's students or records appear;
- protected files differ;
- Console shows an application or Firebase error.

## Production rehearsal still required

This document does not execute or replace:

- Firebase export;
- isolated restore;
- maintenance-window freeze;
- physical iPad validation;
- real isolated Firebase concurrency validation;
- sanitized legacy Queue replay;
- production deployment or rollback;
- product-owner production approval.

The authoritative production sequence remains `docs/PRODUCTION_ROLLBACK_PLAN.md`.
