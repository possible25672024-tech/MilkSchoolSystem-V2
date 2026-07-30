# Sprint 4.9 — Browser Acceptance Checklist

Date: 2026-07-30

Branch: `feature/sprint-4.9-teacher-parity-cutover`

Draft PR: `#3`

Status: **PASS — PRODUCT-OWNER BROWSER ACCEPTANCE**

## Safety setup

Use `index-v2.html` only. Do not redirect Production traffic.

Do not use:

- room `อ.3-3`;
- room ID `mqn0z13eyx5b`;
- date `2026-07-28`;
- a real-classroom save or delete;
- Firebase Console mutation;
- manual Queue, stock, ledger, stockLog, or transaction repair.

Open Chrome DevTools before login:

1. select **Console** and clear existing messages;
2. select **Network**;
3. enable **Preserve log**;
4. filter with `Fetch/XHR`;
5. keep **Disable cache** off so the normal user path is tested.

## A. Desktop shell

- [x] Login to one approved non-quarantined Teacher room.
- [x] The fixed blue header remains visible.
- [x] The dark-blue left sidebar starts below the header and fills the available height.
- [x] All 12 menu controls are visible or reachable by sidebar scrolling.
- [x] School, room, Teacher identity, group headings, icons, active highlight, and footer are correct.
- [x] `ดื่มนม`, `ไม่ดื่มนม`, and `อัตราดื่มนม` are used consistently.

Evidence:

```text
Desktop screenshot:
Console result:
```

## B. Responsive 820 × 1180

In DevTools Device Toolbar set:

```text
Width:  820
Height: 1180
Zoom:   50% or Fit to window
```

- [x] Navigation remains usable without hiding operational controls.
- [x] Daily Attendance rows, notes, photos, and signature controls remain reachable.
- [x] History tables and action buttons remain usable.
- [x] No horizontal clipping prevents a save, print, edit, or delete confirmation.

Evidence:

```text
Responsive screenshot:
Console result:
```

## C. Monthly paper roster

Open `รายงานนักเรียน` without loading or saving Attendance.

- [x] The monthly paper-roster card appears below the selected-student report.
- [x] Selecting a month and pressing `พิมพ์รายชื่อนักเรียน 1 เดือน` opens A4 landscape preview.
- [x] The preview contains every student in the authenticated room.
- [x] Date columns include Monday-Friday only and remain blank for handwritten ✓ / ✕.
- [x] Manual `ดื่ม` and `ไม่ดื่ม` total columns, legend, and homeroom Teacher signature line appear.
- [x] No Fetch/XHR write occurs and no stock, Attendance, or Queue value changes.

Evidence:

```text
Monthly paper-roster screenshot:
Console result:
Network result:
```

## D. Room and Student A4

Use an already-saved non-quarantined date range. Do not create new Attendance data.

- [x] Room A4 displays every selected date as a consecutive column in one landscape matrix page.
- [x] `✓` means ดื่มนม, `✕` means ไม่ดื่มนม, and `—` means ยังไม่ตรวจ.
- [x] Student totals and percentages are correct.
- [x] Room photos begin on the page after the matrix and use one row of at most five images per date.
- [x] Room evidence pages contain at most five dates, each with the saved homeroom Teacher signature.
- [x] The homeroom Teacher signature and name are present when saved.
- [x] Student A4 retains its selected-student inline evidence rule.

Evidence:

```text
Room A4 screenshot:
Student A4 screenshot:
```

## E. Pending, Retroactive and Vacation A4

Use already-loaded history records only. Do not issue or delete milk.

- [x] นมค้างรายสัปดาห์ opens its matching A4 report.
- [x] จ่ายนมย้อนหลัง opens its matching A4 report.
- [x] จ่ายนมช่วงปิดเทอม opens its matching A4 report.
- [x] Each report contains the correct student/quantity table.
- [x] Photos appear directly after the table in one row of at most five.
- [x] Available receiver signatures appear.
- [x] The homeroom Teacher approval line appears.

Evidence:

```text
Pending A4 screenshot:
Retroactive A4 screenshot:
Vacation A4 screenshot:
```

## F. History actions

- [x] `แก้ไข` opens the exact selected date in Daily Attendance.
- [x] Existing statuses, notes, photos, and signature load for that date.
- [x] `ลบ` shows confirmation.
- [x] Cancel the confirmation; do not delete real data.

Evidence:

```text
Selected test date:
Edit screenshot:
Delete-confirmation screenshot:
```

## F. Console and Network

Read-only actions include navigation, report load, Room Stock refresh, and print preview.

- [x] Console contains no application or Firebase error.
- [x] Read-only report and Room Stock requests use `GET`.
- [x] No Queue entry is created, replayed, removed, or altered.
- [x] No Main Stock or Room Stock value changes during read-only validation.
- [x] If an approved Teacher-name test is performed, exactly one scoped write targets the authenticated room's `teacher` leaf.
- [x] No Teacher-name save writes Attendance, stock, Queue, ledger, stockLog, students, or another room.

Evidence:

```text
Console screenshot:
Network screenshot:
Teacher leaf request path (if approved):
```

## Result

Mark PASS only when every required item has evidence:

```text
Desktop:             PASS
Responsive:          PASS
Monthly roster:      PASS
Room/Student A4:     PASS
Operational A4:      PASS
History actions:     PASS
Console/Network:     PASS
Overall:             PASS
```

Product-owner acceptance was confirmed on 2026-07-30 after the complete
54-check regression and local Live Server validation.

Browser PASS permits Sprint 4.9 review for `develop`. It does not authorize `main`, Production deployment, Firebase rule changes, incident closure, or backup/restore execution.
