# Sprint 4.7 — Media and Signature Legacy Audit

Last updated: 2026-07-29

Branch: `feature/sprint-4.7-media-signature-ui`

Status: **LEGACY FIELD AND OWNERSHIP AUDIT COMPLETE / SIZE FIXTURE MEASUREMENT PENDING**

## 1. Purpose

This audit defines the protected `teacher.html` evidence contract that V2 must retain before shared Media and Signature runtime code is introduced.

The protected legacy file remains read-only. V2 implementation must not change Main Stock behavior, Room Stock arithmetic, Firebase record ownership, or authenticated-room boundaries.

## 2. Legacy image processing behavior

The protected Teacher application currently:

- accepts browser-selected `image/*` files;
- limits each Attendance, Pending, Retroactive, or Vacation record to five photos;
- reads each file as a data URL;
- scales the image so its longest edge is at most 1,000 pixels;
- encodes the processed image as JPEG at quality `0.7`;
- falls back to the original data URL when canvas processing fails or when the processed result is not smaller;
- stores photo data URLs inline in the Firebase record.

Observed constants:

```text
PHOTO_MAX_DIM = 1000
PHOTO_QUALITY = 0.7
MAX_PHOTOS_PER_RECORD = 5
```

Legacy risk: there is no explicit source-byte limit, compressed-byte limit, MIME allowlist beyond `image/*`, or aggregate-record payload limit. The raw-data fallback can therefore retain a very large original image.

## 3. Legacy signature behavior

All protected signature canvases use an intrinsic canvas size of `800 x 100`.

Legacy signatures are exported with `canvas.toDataURL()` and are therefore normally PNG data URLs.

Two signature ownership forms exist:

1. Attendance Teacher signature — one record-level `signature` string.
2. Pending, Retroactive, and Vacation recipient signatures — record-level `signatures` object containing `{ sig, receiverName }` entries.

The compatibility field `signature: ""` remains present in Pending, Retroactive, and Vacation records even though their operational signatures are stored in `signatures`.

## 4. Exact Firebase field contracts

### 4.1 Daily Attendance

Path:

```text
milkApp/mcAttendance/{roomId}_{YYYY-MM-DD}
```

Record shape:

```js
{
  clsId,
  roomName,
  date,
  year,
  term,
  teacher,
  data: { [studentId]: "present" | "absent" },
  notes: { [studentId]: string },
  photos: [dataUrl, ...],
  signature: dataUrl | "",
  savedAt
}
```

Evidence owner:

- authenticated Teacher room;
- selected Attendance date;
- Teacher is the signer.

Deletion behavior:

- Attendance deletion removes the record and restores only the previously deducted present count to Room Stock;
- evidence deletion must not perform an additional stock mutation.

### 4.2 Pending Milk / Weekly Absent Milk

Path:

```text
milkApp/absentMilk/{pushId}
```

Record evidence shape:

```js
{
  weekStart,
  weekEnd,
  roomId,
  roomName,
  teacher,
  date,
  students: {
    [studentId]: {
      name,
      days: ["YYYY-MM-DD", ...]
    }
  },
  totalBoxes,
  note,
  signature: "",
  signatures: {
    [studentId + "_" + absentDate]: {
      sig: dataUrl | "",
      receiverName: string
    }
  },
  photos: [dataUrl, ...],
  savedAt
}
```

Evidence owner:

- authenticated Teacher room;
- one recipient signature per student-and-absence-date entitlement;
- photos belong to the whole weekly distribution record.

Stock behavior:

- issue deducts `totalBoxes` from Room Stock only;
- delete restores exactly `totalBoxes` to Room Stock;
- Main Stock delta remains zero.

### 4.3 Retroactive Milk

Path:

```text
milkApp/retroMilk/{pushId}
```

Record evidence shape:

```js
{
  academicYear,
  semester,
  date,
  retroStart,
  retroEnd,
  roomId,
  roomName,
  teacher,
  studentCount,
  days,
  totalBoxes,
  debtBoxes,
  status: "debt" | "paid",
  note,
  signature: "",
  signatures: {
    [studentId]: {
      sig: dataUrl | "",
      receiverName: string
    }
  },
  photos: [dataUrl, ...],
  savedAt
}
```

Evidence owner:

- authenticated Teacher room;
- one recipient or parent signature per student;
- photos belong to the whole retroactive distribution record.

Stock behavior:

- issue deducts `totalBoxes` from Room Stock only;
- delete restores exactly the recorded `totalBoxes`;
- debt status does not change stock arithmetic;
- Main Stock delta remains zero.

### 4.4 Vacation Milk

Path:

```text
milkApp/vacationMilk/{pushId}
```

Record evidence shape:

```js
{
  academicYear,
  semester,
  date,
  days,
  roomId,
  roomName,
  teacher,
  studentCount,
  totalBoxes,
  note,
  signature: "",
  signatures: {
    [studentId]: {
      sig: dataUrl | "",
      receiverName: string
    }
  },
  photos: [dataUrl, ...],
  savedAt
}
```

Evidence owner:

- authenticated Teacher room;
- one parent or recipient signature per student;
- photos belong to the whole vacation distribution record.

Stock behavior:

- issue deducts `totalBoxes` from Room Stock only;
- delete restores exactly `totalBoxes`;
- Main Stock delta remains zero.

## 5. Loading and performance contract

V2 must not restore the old login behavior that downloads all historical evidence.

Required loading rules:

- Login loads only the authenticated room snapshot needed to open the Teacher shell.
- Attendance evidence loads only for the selected room and date.
- Pending, Retroactive, and Vacation history loads only for the authenticated room.
- Full photo and signature payloads load only when a selected record is opened, previewed, or printed.
- History lists use metadata and thumbnails, not every full-size evidence payload.
- Logout clears active in-memory previews and object URLs.

## 6. Shared storage and Queue design

Target design:

```text
UI/View
  -> MediaManager / SignatureManager
  -> MediaPolicy validation
  -> MediaProcessor compression
  -> MediaStorage evidence references
  -> workflow Manager/Service
  -> workflow Repository
```

Queue requirements:

- `tc_pending_saves_v1` remains the queue index.
- SyncView must never display raw data URLs, Blob content, signatures, receiver names, or student evidence details.
- Queue summaries may expose only workflow type, room-safe label, evidence count, aggregate bytes, attempt count, and timestamps.
- Large processed evidence should be stored outside the queue index and referenced by opaque evidence IDs.
- A successful workflow record write must not be repeated merely because audit evidence cleanup failed.
- A successful Room Stock mutation must never run again during evidence-only retry.
- Evidence references are removed only after the owning workflow write and required audit steps have succeeded.

## 7. Replacement, deletion, rollback, backup, and restore

### Replacement

- Selecting a replacement photo creates a new processed evidence item before the old item is released.
- A signature replacement updates the same logical signature owner key.
- Canceling the editor leaves the persisted record unchanged.

### Deletion

- Deleting a photo or signature from an unsaved form removes only its temporary evidence item.
- Deleting a persisted workflow record follows the existing workflow delete transaction and Room Stock rollback rules.
- Evidence cleanup failure must be reported and retried without repeating the stock rollback.

### Backup and restore

- Backup must preserve `photos`, `signature`, and `signatures` exactly enough to restore legacy-compatible records.
- Restore validation must reject malformed evidence references or unsupported MIME types before replacing live data.
- Evidence IDs must remain collision-safe across restore.

## 8. Proposed policy values pending fixture measurement

These are implementation candidates, not yet a passed gate:

```text
Maximum photos per record: 5
Maximum longest edge: 1000 px
JPEG output quality: 0.70
Allowed source MIME: image/jpeg, image/png, image/webp
Maximum source size per photo: to be fixed after generated-fixture measurement
Maximum processed size per photo: to be fixed after generated-fixture measurement
Maximum signature data size: to be fixed after generated-fixture measurement
Maximum aggregate evidence size per record: to be fixed after generated-fixture measurement
```

The fixture measurement must cover:

- small JPEG;
- large phone-style JPEG;
- transparent PNG;
- WebP;
- blank and nonblank `800 x 100` signatures;
- one-photo and five-photo records;
- processing failure and oversized-source rejection.

No real classroom image or signature may be used for these measurements.

## 9. Open audit gates

Before Media runtime integration:

1. create generated in-memory image/signature fixtures;
2. measure encoded and decoded sizes;
3. approve source, processed, signature, and aggregate byte limits;
4. implement `modules/media/mediaPolicy.js`;
5. pass `tests/media-policy-check.mjs`;
6. implement pure image processing and signature-pad tests;
7. prove Queue summaries redact full evidence payloads;
8. prove Main Stock and existing Room Stock calculations are unchanged.

## 10. Browser restriction

Until isolated Media and Signature gates pass:

- do not attach a real classroom photo;
- do not save a real signature;
- do not press Attendance, Pending, Retroactive, or Vacation save/delete for evidence testing;
- do not replay a browser Queue containing evidence;
- use generated in-memory fixtures only.
