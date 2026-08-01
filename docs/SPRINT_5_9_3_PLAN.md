# Sprint 5.9.3 — Receipt A4, Distribution Summary and Backup Profiles

Branch: `feature/sprint-5.9.3-a4-distribution-backup-optimization`

Status: **AUTOMATED PASS — 88/88 / BROWSER AND ISOLATED FIREBASE UAT PENDING**

## Goal

Close the product-owner gaps for printable receipt detail, the classroom
distribution calculation summary, and practical daily backup size without
claiming that a legacy-sized file contains all V2 evidence.

## Delivered

- Receipt detail has an A4 portrait action containing receipt facts, total,
  evidence photos, receiver/sender names, and signatures.
- Classroom distribution shows the selected room's student count, manually
  entered days, total boxes, crate remainder, current Main Stock, and Main Stock
  after payment before the guarded write.
- Daily core backup reads an allowlisted legacy-like operational scope and does
  not hydrate Teacher operation history or `documentFiles`.
- Full backup remains available for all `milkApp` data including evidence.
- Core backup is marked `reference-only`; whole-root Restore is disabled for it
  so an apparently small file cannot silently delete evidence.

## Safety Boundary

- Student count still comes from the actual room roster/configured count.
- Distribution still decreases Main Stock and increases only the selected Room
  Stock through the accepted guarded Stock Service.
- Print and both backup profiles are read-only.
- Only a validated full backup may enter the guarded whole-root Restore path.
- Production Restore, `main`, and cutover remain blocked.

## Automated Result

`node tests/run-sprint-4.9-regression.mjs`

Result: `ALL 88 REGRESSION CHECKS PASSED`.
