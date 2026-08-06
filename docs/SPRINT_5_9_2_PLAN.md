# Sprint 5.9.2 — Receipt, Print and Large Backup Corrections

Branch: `feature/sprint-5.9.2-receipt-print-backup-fixes`

Status: **AUTOMATED PASS — 87/87 / BROWSER AND ISOLATED FIREBASE UAT PENDING**

## Goal

Close the remaining Admin receipt, classroom-distribution report, responsive
layout, and large-backup gaps from the product-owner screenshots without
changing the protected legacy `index.html` or `teacher.html` files.

## Delivered

- The receipt form stores academic year, up to five processed evidence photos,
  receiver/sender names, and separate signatures.
- A separate `รายการรับนมทั้งหมด` menu follows `รับนมจาก อบต.` and provides
  full detail, edit, and delete actions.
- Receipt edit/delete uses an ETag-checked Admin lock, applies only the receipt
  total delta to Main Stock, and writes a `RECEIVE_EDIT` or `RECEIVE_DELETE`
  ledger entry in the same multi-location update.
- Receipt reduction/deletion is blocked if current Main Stock cannot safely
  absorb the negative delta.
- Classroom distribution visibly stores student count, academic year, note,
  processed photos, and receiver/sender signatures.
- Distribution history and the period distribution report both provide A4
  landscape output with at most 30 data rows per page and UTF-8 BOM CSV.
- The V2 shell expands to the available viewport instead of constraining the
  Admin content to 960 pixels.
- Backup checksum calculation replaces large evidence strings with canonical
  per-value hashes, while file download emits JSON as multiple Blob parts.
  Existing version-1 backups without the new serialization marker remain
  verifiable through the legacy checksum path.

## Safety Boundary

- Main Stock changes only for receipt create/edit/delete and classroom
  distribution under their existing ownership rules.
- Receipt edit/delete never changes Room Stock.
- Print, CSV, detail view, and backup remain read-only.
- Production restore, Firebase Rules deployment, `main`, and cutover remain
  blocked.
- Backup/Restore UAT must use an isolated Firebase database.

## Automated Result

`node tests/run-sprint-4.9-regression.mjs`

Result: `ALL 87 REGRESSION CHECKS PASSED`.
