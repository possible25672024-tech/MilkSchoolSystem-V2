# Sprint 6.1 — Image Upload Optimization

Date: 2026-08-01

## Goal

Make every new V2 raster-image upload pass through a bounded browser-side image
pipeline before Cloud persistence, while retaining original PDF files and all
existing historical evidence unchanged.

## Accepted Policy

| Upload path | New image handling |
|---|---|
| Attendance evidence | JPEG, longest edge 1,000 px, quality 0.70, max 400 KB |
| Pending evidence | JPEG, longest edge 1,000 px, quality 0.70, max 400 KB |
| Retroactive evidence | JPEG, longest edge 1,000 px, quality 0.70, max 400 KB |
| Vacation evidence | JPEG, longest edge 1,000 px, quality 0.70, max 400 KB |
| Admin receipt evidence | JPEG, longest edge 1,000 px, quality 0.70, max 400 KB |
| Admin distribution evidence | JPEG, longest edge 1,000 px, quality 0.70, max 400 KB |
| Admin JPG/PNG document | JPEG, longest edge 1,000 px, quality 0.70, max 400 KB |
| Admin PDF document | Original bytes, max 12 MB |
| Signatures | PNG canvas 640 × 240, max 120 KB |

Each milk-operation record remains limited to five photos and an aggregate
evidence limit. Newly optimized Admin document metadata records the original
name, type and byte size plus the saved dimensions and byte size.

## Safety Boundary

- No historical image is rewritten or migrated automatically.
- No PDF is rasterized or recompressed.
- No Main Stock, Room Stock, Attendance calculation, Queue, ledger, or stockLog
  rule changes.
- `index.html` and `teacher.html` remain protected.
- Production Restore, deployment, `main`, tag and cutover remain blocked until
  live and isolated UAT plus explicit approval.
