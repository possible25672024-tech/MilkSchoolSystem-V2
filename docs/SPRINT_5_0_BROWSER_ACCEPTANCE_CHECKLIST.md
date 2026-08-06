# Sprint 5.0 — Browser Acceptance Checklist

Date: 2026-07-30

Branch: `feature/sprint-5.0-admin-report-ui`

Status: **PENDING PRODUCT-OWNER LIVE SERVER EVIDENCE**

## Safety

Use `index-v2.html` on Live Server. Do not redirect Production traffic.

This gate is read-only. Do not save, delete, issue, distribute, replay Queue
items, repair stock, or edit Firebase Console data.

Do not use quarantined room `อ.3-3`, room ID `mqn0z13eyx5b`, or date
`2026-07-28` as trusted report evidence.

## A. Admin report

- [ ] Login as `ผู้ดูแลระบบ`.
- [ ] The Admin report panel appears.
- [ ] `รายห้องเรียน` contains all configured rooms.
- [ ] `รายระดับชั้น` groups and sorts Thai levels correctly.
- [ ] `ทั้งโรงเรียน` contains one whole-school total.
- [ ] Distributed, Attendance, Pending, Retroactive, Vacation, remaining, and
      percentage totals match the protected legacy report on the same browser.
- [ ] Local-source status shows expected counts without loading evidence media.

## B. Print and export

- [ ] `พิมพ์รายงาน A4` opens A4 landscape preview.
- [ ] The selected room/grade/school view is preserved.
- [ ] `ส่งออก CSV` downloads a UTF-8 file.
- [ ] Thai column names and values open correctly in Excel or LibreOffice.

## C. Responsive

At Chrome Responsive `820 x 1180`:

- [ ] View buttons remain reachable.
- [ ] Summary cards remain readable.
- [ ] The report table scrolls horizontally without hiding print/export.
- [ ] Logout remains reachable.

## D. Console and Network

- [ ] Console contains no application or Firebase error.
- [ ] Firebase report requests use `GET`.
- [ ] No `PUT`, `POST`, `PATCH`, or `DELETE` occurs during report use.
- [ ] No Main Stock, Room Stock, Queue, ledger, stockLog, or operational record
      changes.

## Result

```text
Admin report:       PENDING
Print/CSV:          PENDING
Responsive:         PENDING
Console/Network:    PENDING
Overall:            PENDING
```

Browser PASS permits Sprint 5.0 review. It does not authorize `main`,
Production deployment, legacy replacement, incident closure, Firebase rule
changes, or backup/restore execution.
