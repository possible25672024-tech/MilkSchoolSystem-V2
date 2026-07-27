# Sprint 3.9 — Performance Audit Report

Date: 2026-07-27

Branch: `feature/sprint-3.9-performance`

## Scope

This report records deterministic code-path request counts and serialization counts produced by automated tests. It does not claim real network speed, payload bytes, or device timings until those values are captured with browser tools on the actual dataset.

Protected files remain unchanged:

- `index.html`
- `teacher.html`

## Implemented Optimizations

### 1. Firebase identical in-flight GET deduplication

`FirebaseService` now shares one Promise when identical GET requests for the same fully built URL are active at the same time.

Properties:

- identical path and query while the first request is active: one network request
- different query values: separate network requests
- completed requests are removed from the in-flight map
- this is not a persistent response cache
- `cache: "no-store"` remains unchanged
- write requests are never deduplicated

Deterministic test result:

- two concurrent identical GET calls: one fetch call
- one later GET after completion: a new fetch call

### 2. Login settings and room context reuse

Before this Sprint, the V2 shell loaded `settings` and `rooms` to populate the login selector, then loaded the same two paths again during credential validation.

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

The table is a code-path request count, not a measured timing or byte result.

### 3. Teacher core and deferred snapshot boundary

The Teacher repository now separates frequently needed core data from deferred dashboard/history collections.

Core snapshot:

- `settings`
- `rooms`
- `roomStock/{roomId}`
- room-scoped `mcAttendance` key-prefix query
- `updatedAt`

Deferred collections:

- `distributes`
- `absentMilk`
- `retroMilk`
- `vacationMilk`
- `stockTransactions`

`TeacherManager.refresh()` defaults to the core snapshot. `TeacherManager.refreshFull()` explicitly requests all deferred collections.

Deterministic code-path count:

| Teacher refresh | Firebase GET count |
|---|---:|
| Core refresh | 5 |
| Explicit full refresh | 10 |

The full refresh keeps its two groups parallel. The normal refresh no longer downloads five nonessential collections.

The attendance request remains scoped with:

- `orderBy="$key"`
- `startAt="{roomId}_"`
- `endAt="{roomId}_"`

An all-school `mcAttendance` read is not used by the modular Teacher flow.

### 4. Queue upsert serialization reduction

`QueueStorage.upsert()` previously saved the normalized queue and immediately called `get()`, which parsed persistent storage a second time only to return the entry just written.

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

## Browser Measurement Procedure

Use Chrome DevTools on `index-v2.html` with Live Server.

### Desktop login request check

1. Open DevTools → Network.
2. Clear the request list.
3. Disable Network cache only for the test run when a cold-load scenario is required.
4. Reload the page.
5. Confirm the room selector loads.
6. Record Firebase request names and transferred sizes.
7. Clear the request list without reloading.
8. Log in with the already loaded room list.
9. Confirm that `settings.json` and `rooms.json` are not downloaded again during immediate credential validation.

### Teacher core snapshot check

After Teacher Login, invoke the project command `TeacherManager.refresh()` from the Console only after reviewing that command.

Expected Firebase reads:

- `settings.json`
- `rooms.json`
- `roomStock/{roomId}.json`
- `mcAttendance.json` with room key-prefix query parameters
- `updatedAt.json`

Not expected during core refresh:

- `distributes.json`
- `absentMilk.json`
- `retroMilk.json`
- `vacationMilk.json`
- `stockTransactions.json`
- all-school `mcAttendance.json` without room query parameters

Run `TeacherManager.refreshFull()` only when validating the explicit full-data path.

### Responsive and iPad-class check

Validate at minimum:

- responsive mobile viewport
- iPad-class viewport
- physical iPad when available

Record:

- browser and version
- viewport or device model
- network profile
- Firebase request count
- transferred bytes
- visible errors
- console errors

Do not convert subjective impressions into benchmark numbers.

## Remaining Performance and Concurrency Gaps

- The operational legacy Teacher UI still owns forms, photos, signatures, printing, queue badge, and offline banner.
- V2 multi-location PATCH remains atomic only for included paths and does not yet provide legacy ETag compare-and-retry protection for simultaneous Room Stock writers.
- Full room and settings collections are still required because the current room collection can be stored as an array and Room ID is not guaranteed to equal the Firebase child key.
- Deferred Teacher collections are still full-path reads when explicitly requested; room-field query migration requires schema/index compatibility validation.
- Real transferred byte totals and timings remain pending browser measurement on the actual 83-room dataset.

## Automated Test

Run:

```powershell
node tests/performance-module-check.mjs
```

Expected output:

```text
Performance module checks passed.
```

All previous regression tests remain required before merge.
