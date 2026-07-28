# MilkSchoolSystem V2 — Sprint 4.0 Cutover Decision Register

Date: 2026-07-28

Branch: `feature/sprint-4.0-cutover-readiness`

Scope: decisions required to complete the Sprint 4.0 readiness record without claiming that V2 is ready for production.

## Decision Status

- APPROVED FOR DEVELOP — acceptable for merging the Sprint branch into `develop`
- DEFERRED — postponed with a documented owner, risk, and production consequence
- BLOCKS PRODUCTION — must be completed or explicitly risk-accepted before production cutover

## D-01 — Physical iPad Validation

Decision: DEFERRED / APPROVED FOR DEVELOP / BLOCKS PRODUCTION

- Physical iPad testing is not required for the Sprint 4.0 feature-to-`develop` merge gate.
- The result must not be represented as PASS.
- No claim is made for physical touch behavior, Safari storage limits, reconnect behavior, photos, or signatures.
- Before production approval, the project must either collect physical-device evidence or explicitly accept the remaining risk.

Owner: product owner for final production approval.

## D-02 — Report Browser-Local Data Adapter

Decision: DEFERRED / APPROVED FOR DEVELOP / BLOCKS PRODUCTION

Current foundation:

- `ReportService.generate(view, extraSources)` already accepts injected non-Firebase sources.
- Report formulas already recognize local aliases for pending, retroactive, and vacation collections.
- Report code remains read-only and does not access Local Storage directly.

Decision:

- Do not add direct Local Storage ownership to `ReportService` or `ReportRepository` in Sprint 4.0.
- Build a separate browser adapter during operational Admin UI integration.
- The adapter must read legacy-local collections, normalize them, deduplicate against Firebase records, and pass them through `extraSources`.
- Until that adapter and formula parity test exist, report operational cutover remains PARTIAL/BLOCKED for production.

Owner: next operational Admin/report UI sprint.

## D-03 — XLSX Binary Parser

Decision: KEEP LEGACY PARSER / APPROVED FOR DEVELOP / BLOCKS V2-ONLY IMPORT

Current foundation:

- `RoomService.prepareImport()` accepts already-parsed sheet data.
- Existing room IDs remain immutable and Room Stock links remain stable.

Decision:

- Keep binary workbook parsing in the legacy operational Admin flow for now.
- Do not copy the large parser into V2 merely for structural parity.
- A future V2 import adapter may parse the workbook and call the existing parsed-sheet boundary.
- Student import remains PARTIAL until the operational adapter passes representative workbook tests.

Owner: future Room/Admin import sprint.

## D-04 — Operational Teacher UI

Decision: DEFERRED TO A DEDICATED UI SPRINT / APPROVED FOR DEVELOP / BLOCKS PRODUCTION

- Attendance, pending milk, retroactive milk, vacation milk, photos, signatures, printing, queue badge, and offline banner remain operational in `teacher.html`.
- Sprint 4.0 validates service, repository, queue, concurrency, and recovery foundations only.
- `teacher.html` remains protected and available as the rollback/operational path.
- V2 production cutover is blocked until the replacement UI passes parity and device gates.

Owner: dedicated Teacher UI integration sprint.

## D-05 — Operational Admin UI

Decision: DEFERRED TO A DEDICATED UI SPRINT / APPROVED FOR DEVELOP / BLOCKS PRODUCTION

- Room forms, stock receipt, classroom distribution, report presentation, print/export, backup, and restore remain operational in `index.html`.
- Modular services may merge to `develop`, but `index-v2.html` is not an operational replacement yet.
- `index.html` remains protected and available as the rollback/operational path.

Owner: dedicated Admin UI integration sprint.

## D-06 — Real Firebase Multi-Writer Validation

Decision: ISOLATED TEST REQUIRED / APPROVED FOR DEVELOP / BLOCKS PRODUCTION CONFIDENCE

- Deterministic tests verify ETag reads, `If-Match`, HTTP 412 retry, latest-value recalculation, and no Main Stock mutation.
- Do not intentionally create concurrency writes against production classroom stock for validation.
- Run the real multi-writer exercise only on an isolated Firebase project or a dedicated disposable test room/path with a recorded before/after snapshot.
- Production approval must retain a risk note until this evidence exists.

Owner: release operator with access to an isolated Firebase environment.

## D-07 — Legacy Queue Operational Fixture

Decision: SAMPLE REQUIRED WHEN AVAILABLE / APPROVED FOR DEVELOP / BLOCKS COMPLETE MIGRATION EVIDENCE

- Automated fixtures already cover legacy `rec`, legacy `diff`, repeated edits, mixed valid/corrupt entries, persistence, sequential replay, success removal, and failure retention.
- A real exported queue sample from an operational browser has not been supplied.
- Do not fabricate an operational sample.
- When available, sanitize the sample, add it as a test fixture, and verify normalization/replay without changing the storage key.

Owner: operator who can export a non-sensitive legacy queue sample.

## D-08 — Responsive and Device Scope

Decision: EMULATED 820 × 1180 PASSED; PHYSICAL IPAD DEFERRED

- Layout containment and clean Console evidence at 820 × 1180 are recorded.
- Teacher login completed successfully in the emulated viewport.
- The successful-login panel remained inside the viewport and displayed the correct room/teacher identity.
- Logout completed successfully and returned to the login form without layout breakage.
- The Console remained free of visible application errors before and after Logout.
- A narrower phone viewport is optional unless phone support becomes an explicit production requirement.
- This browser-emulated PASS does not replace physical iPad validation under D-01.

Owner: responsive browser gate completed by the local browser tester; physical-device risk remains with the product owner.

## D-09 — Backup and Restore

Decision: PLAN NOW, REHEARSE BEFORE PRODUCTION

- Sprint 4.0 must contain a complete backup and rollback procedure.
- A live production backup/restore rehearsal is not required for feature-to-`develop` merge.
- Production cutover remains blocked until Firebase export verification and isolated restore rehearsal are recorded.

Owner: release operator and product owner.

## Merge and Production Meaning

Merging Sprint 4.0 into `develop` means:

- the modular foundation and readiness record are preserved for continued integration;
- protected legacy files remain unchanged and operational;
- production cutover is still blocked;
- no production traffic switch, `main` merge, or legacy removal is authorized.
