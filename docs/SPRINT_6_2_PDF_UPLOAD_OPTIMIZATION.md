# Sprint 6.2 — Safe PDF Upload Optimization

Date: 2026-08-01

Branch: `feature/sprint-6.2-pdf-upload-optimization`

Status: **AUTOMATED PASS — 92/92 / LIVE BROWSER UAT PENDING**

## Goal

Reduce eligible PDF upload size in the browser before Cloud persistence without
rasterizing pages, reducing visual quality, changing the page count, or risking
protected documents.

## Accepted PDF Policy

- Load and structurally rewrite eligible PDFs with local `pdf-lib` 1.17.1 and
  PDF object streams for lossless compression.
- Re-open the generated PDF and require the same page count before accepting it.
- Use the compressed version only when it saves at least 4 KB and 1%.
- Use the original PDF when the compressed output is not smaller.
- Preserve the original PDF when a digital signature or encrypted document is
  detected so signatures and protection are not invalidated.
- Fall back to the original if compression or post-compression validation fails.
- Keep the existing 12 MB source-file limit and show original → saved size.
- Do not rewrite historical PDFs automatically.

The optimizer is lossless: it does not convert pages to JPEG images, lower scan
resolution, or remove searchable text. PDFs whose size is dominated by already
compressed scan images may therefore remain at their original size.

## Safety Boundary

- `index.html` and `teacher.html` remain unchanged.
- No Main Stock, Room Stock, Attendance, Queue, ledger, stockLog, Backup, or
  Restore business rule changes.
- No Production Restore, deployment, `main`, release tag, or cutover without
  isolated UAT and explicit product-owner approval.

## Remaining Release Roadmap

There are **two remaining release Sprints** after Sprint 6.2:

1. Sprint 6.3 — Live Browser, responsive, performance, security, and isolated
   Firebase Backup/Restore UAT; no Production writes.
2. Sprint 6.4 — Release Candidate, approved Production backup/cutover, rollback
   readiness, and post-release smoke verification. Production actions require
   explicit product-owner approval.
