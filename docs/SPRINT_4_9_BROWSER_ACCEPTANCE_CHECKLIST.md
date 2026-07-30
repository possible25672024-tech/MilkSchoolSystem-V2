# Sprint 4.9 — Browser Acceptance Checklist

Date: 2026-07-30

Branch: `feature/sprint-4.9-teacher-parity-cutover`

Draft PR: `#3`

Status: **PENDING PRODUCT-OWNER BROWSER EVIDENCE**

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

- [ ] Login to one approved non-quarantined Teacher room.
- [ ] The fixed blue header remains visible.
- [ ] The dark-blue left sidebar starts below the header and fills the available height.
- [ ] All 12 menu controls are visible or reachable by sidebar scrolling.
- [ ] School, room, Teacher identity, group headings, icons, active highlight, and footer are correct.
- [ ] `ดื่มนม`, `ไม่ดื่มนม`, and `อัตราดื่มนม` are used consistently.

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

- [ ] Navigation remains usable without hiding operational controls.
- [ ] Daily Attendance rows, notes, photos, and signature controls remain reachable.
- [ ] History tables and action buttons remain usable.
- [ ] No horizontal clipping prevents a save, print, edit, or delete confirmation.

Evidence:

```text
Responsive screenshot:
Console result:
```

## C. Room and Student A4

Use an already-saved non-quarantined date range. Do not create new Attendance data.

- [ ] Room A4 displays every selected date as a consecutive column in one landscape matrix page.
- [ ] `✓` means ดื่มนม, `✕` means ไม่ดื่มนม, and `—` means ยังไม่ตรวจ.
- [ ] Student totals and percentages are correct.
- [ ] Room photos begin on the page after the matrix and use one row of at most five images per date.
- [ ] Room evidence pages contain at most five dates, each with the saved homeroom Teacher signature.
- [ ] The homeroom Teacher signature and name are present when saved.
- [ ] Student A4 retains its selected-student inline evidence rule.

Evidence:

```text
Room A4 screenshot:
Student A4 screenshot:
```

## D. Pending, Retroactive and Vacation A4

Use already-loaded history records only. Do not issue or delete milk.

- [ ] นมค้างรายสัปดาห์ opens its matching A4 report.
- [ ] จ่ายนมย้อนหลัง opens its matching A4 report.
- [ ] จ่ายนมช่วงปิดเทอม opens its matching A4 report.
- [ ] Each report contains the correct student/quantity table.
- [ ] Photos appear directly after the table in one row of at most five.
- [ ] Available receiver signatures appear.
- [ ] The homeroom Teacher approval line appears.

Evidence:

```text
Pending A4 screenshot:
Retroactive A4 screenshot:
Vacation A4 screenshot:
```

## E. History actions

- [ ] `แก้ไข` opens the exact selected date in Daily Attendance.
- [ ] Existing statuses, notes, photos, and signature load for that date.
- [ ] `ลบ` shows confirmation.
- [ ] Cancel the confirmation; do not delete real data.

Evidence:

```text
Selected test date:
Edit screenshot:
Delete-confirmation screenshot:
```

## F. Console and Network

Read-only actions include navigation, report load, Room Stock refresh, and print preview.

- [ ] Console contains no application or Firebase error.
- [ ] Read-only report and Room Stock requests use `GET`.
- [ ] No Queue entry is created, replayed, removed, or altered.
- [ ] No Main Stock or Room Stock value changes during read-only validation.
- [ ] If an approved Teacher-name test is performed, exactly one scoped write targets the authenticated room's `teacher` leaf.
- [ ] No Teacher-name save writes Attendance, stock, Queue, ledger, stockLog, students, or another room.

Evidence:

```text
Console screenshot:
Network screenshot:
Teacher leaf request path (if approved):
```

## Result

Mark PASS only when every required item has evidence:

```text
Desktop:             PENDING
Responsive:          PENDING
Room/Student A4:     PENDING
Operational A4:      PENDING
History actions:     PENDING
Console/Network:     PENDING
Overall:             PENDING
```

Browser PASS permits Sprint 4.9 review for `develop`. It does not authorize `main`, Production deployment, Firebase rule changes, incident closure, or backup/restore execution.
