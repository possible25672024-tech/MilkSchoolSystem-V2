# Sprint 4.5 — Retroactive Milk Browser Validation Report

Date: 2026-07-29

Branch: `feature/sprint-4.5-retroactive-milk-ui`

Status: READY FOR READ-ONLY VALIDATION

## Preconditions

Confirmed before browser validation:

- all four Sprint-specific Retroactive Milk tests passed;
- all 26 regression checks passed;
- feature branch synchronized with origin;
- working tree clean;
- `/milkApp/retroMilk` has `.indexOn: ["roomId"]` published;
- protected `index.html` and `teacher.html` remain unchanged.

## Safety Boundary

This browser gate is read-only.

Do not press:

- `บันทึกนมย้อนหลัง`;
- any Retroactive Milk delete/rollback button;
- `จ่ายนมค้าง`;
- any Pending Milk delete/rollback button;
- Attendance Save/Delete;
- manual Queue retry against a real pending entry.

Do not use:

- room `อ.3-3`;
- room ID `mqn0z13eyx5b`;
- date `2026-07-28` as a test target.

## Gate 1 — Local Queue Safety

Before Teacher Login:

1. open Application → Local Storage;
2. select `http://127.0.0.1:5500`;
3. filter for `tc_pending_saves_v1`.

Safe result:

```text
key absent
```

or:

```json
[]
```

If the array contains entries, stop. Do not delete or replay them. Use a separate clean Chrome profile or Guest window and inspect the same origin again.

## Gate 2 — Admin Regression

Validate:

- Admin Login succeeds;
- existing Admin authenticated shell renders;
- Teacher Pending, Retroactive, and Queue panels do not activate;
- Console has no JavaScript error;
- Admin Logout returns to Login.

## Gate 3 — Teacher Read-Only Retroactive Panel

Use a non-quarantined room.

Validate:

- heading `จ่ายนมย้อนหลัง` renders;
- academic year and semester render;
- issue date renders;
- authenticated room is read-only;
- start and end date inputs render;
- student, weekday, total-box, and debt summary cards render;
- note input renders;
- `โหลดประวัติ` renders;
- `บันทึกนมย้อนหลัง` is not pressed;
- history area renders;
- any existing delete button is not pressed;
- Logout and Queue panel remain reachable.

Preview calculation from changing start/end dates is local read-only behavior and may be used. It must not send a write request.

## Gate 4 — Indexed History Read

Open Network and clear prior requests.

Press only:

```text
โหลดประวัติ
```

Expected request:

```text
/milkApp/retroMilk.json?orderBy="roomId"&equalTo="<authenticated-room-id>"
```

Required:

- HTTP 200;
- room-scoped response;
- no Firebase index error;
- history records or a correct empty state render;
- no `POST`;
- no `PUT`;
- no `PATCH`;
- no `DELETE`.

## Gate 5 — Console

Clear Console before the indexed history load.

Required after load:

- no red JavaScript error;
- no Firebase HTTP 400 index error;
- normal startup message is allowed.

The DevTools Issues counter is not itself a JavaScript Console error. Any visible red Console entry must be reviewed.

## Gate 6 — Responsive 820 x 1180

Use Chrome Device Toolbar:

```text
820 x 1180
```

After indexed history has loaded successfully, validate:

- academic year and semester fields remain readable;
- issue date and room remain contained;
- start/end date controls remain reachable;
- four summary cards remain readable;
- note field remains contained;
- Load History and disabled/unpressed Issue action remain reachable;
- history cards and unpressed delete actions remain contained;
- Logout remains reachable;
- Queue panel remains reachable;
- no abnormal horizontal overflow;
- Console remains clean.

## Required Evidence

Provide screenshots showing:

1. Local Storage queue key absent or `[]` before Teacher Login;
2. Admin shell with clean Console;
3. Teacher Retroactive Milk panel after a valid read-only preview;
4. Network row for indexed `retroMilk` request with HTTP 200 and no write methods;
5. history or correct empty state plus clean Console;
6. loaded responsive view at 820 x 1180 including history, Logout, and Queue panel.

## Acceptance Decision

Sprint 4.5 may close only after every read-only browser and responsive item above passes and the branch remains synchronized with a clean working tree.

Passing this gate authorizes only fast-forward integration into `develop`. It does not authorize `main`, production deployment, real-classroom writes, legacy replacement, media/signature completion, report completion, security sign-off, physical iPad sign-off, or incident closure.
