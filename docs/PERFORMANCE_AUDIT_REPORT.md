# Sprint 3.9 — Performance Audit Report

Date: 2026-07-28

Branch: `feature/sprint-3.9-performance`

## Scope

This report records deterministic code-path counts from automated tests and actual browser Network measurements captured on the school dataset. It does not claim that the observed timings or transferred sizes will be identical on every device, browser, network, or Firebase dataset.

Protected files remained unchanged:

- `index.html`
- `teacher.html`

## Implemented Optimizations

### 1. Firebase identical in-flight GET deduplication

`FirebaseService` shares one Promise when identical GET requests for the same fully built URL are active at the same time.

Properties:

- identical path and query while the first request is active: one network request
- different query values: separate requests
- completed requests are removed from the in-flight map
- this is not a persistent response cache
- `cache: "no-store"` remains unchanged
- write requests are never deduplicated

Deterministic test result:

- two concurrent identical GET calls: one fetch call
- one later GET after completion: a new fetch call

### 2. Firebase GET preflight removal

A body-less GET no longer sends `Content-Type: application/json` automatically.

Behavior:

- GET without a body: no Content-Type header
- PUT, PATCH, and POST with JSON body: `Content-Type: application/json`
- explicit caller-provided headers remain supported

This removed the unnecessary browser CORS preflight rows previously observed for Firebase GET requests.

### 3. Login settings and room context reuse

Before this Sprint, the V2 shell loaded `settings` and `rooms` to populate the login selector, then loaded the same two paths again during immediate credential validation.

The normalized Login context now has a five-minute in-memory TTL:

- page option load: repository context read
- credential validation inside TTL: cached normalized context
- manual room reload: forced repository refresh
- expired context: repository refresh
- returned objects are cloned so UI code cannot mutate the cache

Deterministic code-path count:

| Scenario | Before | After |
|---|---:|---:|
| Initial option load | 2 Firebase GETs | 2 Firebase GETs |
| Login immediately after option load | 2 additional Firebase GETs | 0 additional Firebase GETs |
| Total option load plus immediate login | 4 Firebase GETs | 2 Firebase GETs |

The selected Teacher room is copied into the authenticated session as `roomSnapshot`. This allows the Teacher core refresh to reuse the room data already downloaded for the login selector instead of downloading or querying the full rooms collection again.

Sessions created before this change remain compatible. They fall back to a complete rooms read until the user logs out and logs in again.

### 4. Teacher core and deferred snapshot boundary

Teacher loading is separated into core and deferred groups.

Default core refresh:

- `settings`
- `roomStock/{roomId}`
- `mcAttendance/{roomId}_{today}/data`
- `updatedAt`
- room data from the authenticated session snapshot

Deferred collections:

- `distributes`
- `absentMilk`
- `retroMilk`
- `vacationMilk`
- `stockTransactions`

`TeacherManager.refresh()` loads only the core data and defaults attendance to today's `/data` child.

`TeacherManager.refreshFull()` explicitly loads room attendance history and deferred collections.

Deterministic request count with a new Teacher session:

| Teacher refresh | Firebase GET count |
|---|---:|
| Default core refresh | 4 |
| Explicit full refresh | 9 |

The default core refresh does not request:

- the complete rooms collection
- room-wide attendance history
- photos or signatures stored outside the attendance `/data` child
- deferred Teacher history collections

### 5. Queue upsert serialization reduction

`QueueStorage.upsert()` previously saved the normalized queue and immediately called `get()`, parsing persistent storage a second time only to return the entry just written.

It now returns the matching entry from the normalized result returned by `save()`.

Deterministic operation count per upsert:

| Operation | Before | After |
|---|---:|---:|
| Persistent storage reads | 2 | 1 |
| Persistent storage writes | 1 | 1 |

Queue semantics remain unchanged:

- latest repeated attendance record wins
- original `baselinePresent` remains
- original `queuedAt` remains
- attempts reset for a newer edit

## Queue Compatibility Fixtures

Automated fixtures cover:

- legacy attendance entry using `rec`
- V2 attendance entry using `record`
- legacy Room Stock adjustment using `diff`
- V2 Room Stock adjustment using `difference`
- repeated edits for one attendance key
- mixed valid and corrupt entries

Expected behavior:

- valid legacy and V2 records remain
- aliases normalize to V2 fields
- corrupt records are filtered individually
- original attendance baseline remains stable

## Actual Desktop Browser Measurement

Environment:

- Chrome desktop on Windows
- Live Server at `127.0.0.1:5500`
- actual school dataset containing 83 rooms
- DevTools Network filtered to Fetch/XHR
- no throttling

### Before final Teacher core optimization

Observed core refresh:

| Request group | Observed transferred size |
|---|---:|
| Complete rooms collection | approximately 589 KB |
| Room-scoped attendance history | approximately 19,924 KB |
| Total Network result | approximately 20.5 MB |

Observed request count: 5.

The attendance-history request took approximately 2.43 seconds in the captured run.

### After final Teacher core optimization

Observed core refresh:

| Request | Observed transferred size | Observed time |
|---|---:|---:|
| `settings.json` | approximately 0.6 KB | approximately 134 ms |
| `roomStock/{roomId}.json` | approximately 0.3 KB | approximately 136 ms |
| `mcAttendance/{roomId}_{date}/data.json` | approximately 0.3 KB | approximately 135 ms |
| `updatedAt.json` | approximately 0.3 KB | approximately 144 ms |

Observed result:

- 4 requests
- approximately 1.6 KB transferred
- no rooms request
- no room-history attendance request
- no deferred collection request
- no GET preflight
- no HTTP error

These values describe the captured environment only. They are not universal production benchmarks.

## Automated Tests

Required checks:

```powershell
node tests/login-foundation-check.mjs
node tests/stock-module-check.mjs
node tests/report-module-check.mjs
node tests/room-module-check.mjs
node tests/teacher-module-check.mjs
node tests/attendance-module-check.mjs
node tests/sync-module-check.mjs
node tests/firebase-request-header-check.mjs
node tests/performance-module-check.mjs
node tests/teacher-core-payload-check.mjs
```

All checks passed during Sprint closeout.

## Remaining Performance and Cutover Gaps

- Physical iPad and responsive-mobile validation were not demonstrated in the Sprint 3.9 closeout and remain required before production cutover.
- The operational legacy Teacher UI still owns forms, photos, signatures, printing, queue badge, and offline banner.
- V2 multi-location PATCH remains atomic only for included paths and does not yet provide legacy ETag compare-and-retry protection for simultaneous Room Stock writers.
- Deferred Teacher collections remain full-path reads when explicitly requested.
- Production cutover still requires compatibility validation between queues written by legacy `teacher.html` and queues normalized by V2.
- Report browser-local adapters, XLSX import parsing, and complete-room multi-admin concurrency remain unresolved migration gaps.

## Conclusion

Sprint 3.9 met the desktop performance objective without changing Firebase schema, stock calculations, protected legacy files, attendance keys, queue semantics, or authentication rules. Production cutover remains gated by device validation and unresolved compatibility/concurrency items.
