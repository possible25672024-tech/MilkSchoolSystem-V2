import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const currentFile = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(currentFile), "..");
const read = relativePath => fs.readFileSync(path.join(root, relativePath), "utf8");
const count = (values, target) => values.filter(value => value === target).length;

const files = {
    attendance: read("modules/media/attendanceEvidenceManager.js"),
    pending: read("modules/media/pendingEvidenceManager.js"),
    retroactive: read("modules/media/retroactiveEvidenceManager.js"),
    vacation: read("modules/media/vacationEvidenceManager.js"),
    pendingAdapter: read("modules/media/pendingEvidenceAdapter.js"),
    retroactiveAdapter: read("modules/media/retroactiveEvidenceAdapter.js"),
    vacationAdapter: read("modules/media/vacationEvidenceAdapter.js")
};

for (const [name, code] of Object.entries(files)) {
    assert.doesNotThrow(() => new vm.Script(code), `${name} must contain valid JavaScript`);
}

assert.ok(
    files.attendance.includes("this.recordKey === nextKey && !record"),
    "Attendance evidence must preserve an unsaved draft when the room and date are unchanged"
);
assert.ok(
    files.retroactive.includes("this.recordKey === nextKey && !record"),
    "Retroactive evidence must preserve an unsaved draft when the record identity is unchanged"
);
assert.ok(
    files.vacation.includes("this.recordKey === nextKey && !record"),
    "Vacation evidence must preserve an unsaved draft when the record identity is unchanged"
);
assert.ok(
    !/receiverName:\s*entry\.receiverName/.test(files.pending),
    "Pending safe state must not expose receiver identity"
);

function createHarness() {
    let photoCounter = 0;
    let signatureCounter = 0;
    const payloads = new Map();
    const removed = [];

    const policy = {
        validatePhotoCount(value) {
            return value <= 5
                ? { valid: true }
                : { valid: false, code: "MEDIA_PHOTO_COUNT_EXCEEDED", message: "too many photos" };
        },
        validateRecordEvidence() {
            return { valid: true };
        }
    };

    const processor = {
        async processFiles(input) {
            return Array.from(input || []).map(() => {
                photoCounter += 1;
                const dataUrl = `data:image/jpeg;base64,${Buffer.from(`photo-${photoCounter}`).toString("base64")}`;
                return {
                    id: `photo-${photoCounter}`,
                    dataUrl,
                    mime: "image/jpeg",
                    size: 1000 + photoCounter,
                    width: 1000,
                    height: 500,
                    thumbnail: { dataUrl }
                };
            });
        }
    };

    const mediaStore = {
        async put(entry) {
            const mediaId = String(entry.id);
            const reference = {
                mediaId,
                kind: entry.kind,
                mime: entry.mime,
                size: entry.size,
                width: entry.width,
                height: entry.height,
                recordKey: entry.recordKey,
                ownerKey: entry.ownerKey,
                createdAt: entry.createdAt
            };
            payloads.set(mediaId, { ...reference, dataUrl: entry.dataUrl });
            return reference;
        },
        async getPayload(mediaId) {
            return payloads.get(mediaId) || null;
        },
        async remove(mediaId) {
            removed.push(mediaId);
            payloads.delete(mediaId);
        },
        isReference(value) {
            return Boolean(value?.mediaId && !String(value?.dataUrl || "").startsWith("data:"));
        }
    };

    class FakeSignaturePad {
        initialize() {
            return { initialized: true };
        }

        clear() {}

        destroy() {}

        exportSignature() {
            signatureCounter += 1;
            const dataUrl = `data:image/png;base64,${Buffer.from(`signature-${signatureCounter}`).toString("base64")}`;
            return {
                id: `signature-${signatureCounter}`,
                dataUrl,
                mime: "image/png",
                size: 700 + signatureCounter,
                width: 640,
                height: 240,
                empty: false
            };
        }

        buildSafeSummary(value) {
            return { id: value.id, mime: value.mime, size: value.size, empty: false };
        }
    }

    const context = {
        window: {
            MediaProcessor: processor,
            MediaStore: mediaStore,
            MediaPolicy: policy,
            SignaturePadClass: FakeSignaturePad
        },
        Buffer,
        Date,
        Math,
        Number,
        String,
        Boolean,
        Object,
        Array,
        Set,
        Map,
        Error,
        Promise,
        console
    };

    return { context, processor, mediaStore, policy, FakeSignaturePad, payloads, removed };
}

// Attendance: unchanged date preserves draft; replacement and context change clean each draft once.
{
    const harness = createHarness();
    vm.runInNewContext(files.attendance, harness.context);
    const Manager = harness.context.window.AttendanceEvidenceManagerClass;
    const manager = new Manager(harness.processor, harness.mediaStore, harness.policy, harness.FakeSignaturePad);

    await manager.setRecordContext({ roomId: "room-a", date: "2026-08-03", record: null });
    manager.attachSignaturePad({ getContext: () => ({}) });
    await manager.addPhotos([{ name: "generated-a.jpg" }]);
    const photoId = manager.photoReferences[0].mediaId;
    await manager.commitSignature();
    const firstSignatureId = manager.signatureReference.mediaId;

    await manager.setRecordContext({ roomId: "room-a", date: "2026-08-03", record: null });
    assert.equal(manager.getState().photoCount, 1, "Repeated Attendance context must preserve the photo draft");
    assert.equal(manager.getState().signaturePresent, true, "Repeated Attendance context must preserve the signature draft");
    assert.deepEqual(harness.removed, [], "Repeated Attendance context must not remove payloads");

    await manager.commitSignature();
    const replacementSignatureId = manager.signatureReference.mediaId;
    assert.notEqual(replacementSignatureId, firstSignatureId, "Signature replacement must create a new payload first");
    assert.equal(count(harness.removed, firstSignatureId), 1, "Replaced Attendance signature must be removed exactly once");
    assert.equal(count(harness.removed, photoId), 0, "Replacing a signature must not remove the photo draft");

    await manager.setRecordContext({ roomId: "room-a", date: "2026-08-04", record: null });
    assert.equal(count(harness.removed, photoId), 1, "Changing Attendance date must remove the unsaved photo once");
    assert.equal(count(harness.removed, replacementSignatureId), 1, "Changing Attendance date must remove the active signature once");

    await manager.addPhotos([{ name: "generated-saved.jpg" }]);
    const savedPayloadId = manager.photoReferences[0].mediaId;
    manager.markSaved();
    await manager.clear();
    assert.equal(count(harness.removed, savedPayloadId), 0, "Successful save ownership must not be deleted as an unsaved draft");
}

// Pending: safe state redacts identity while the legacy write boundary retains it.
{
    const harness = createHarness();
    vm.runInNewContext(files.pending, harness.context);
    const Manager = harness.context.window.PendingEvidenceManagerClass;
    const manager = new Manager(harness.processor, harness.mediaStore, harness.policy, harness.FakeSignaturePad);
    const owner = {
        key: "s1_2026-08-03",
        studentId: "s1",
        date: "2026-08-03",
        name: "นักเรียนทดสอบ"
    };

    await manager.setRecordContext({
        roomId: "room-p",
        weekStart: "2026-08-03",
        weekEnd: "2026-08-07",
        owners: [owner]
    });
    manager.attachSignaturePad({ getContext: () => ({}) });
    await manager.addPhotos([{ name: "generated-pending.jpg" }]);
    const photoId = manager.photoReferences[0].mediaId;
    manager.selectOwner(owner.key);
    await manager.commitActiveSignature("ชื่อผู้รับที่ต้องปกปิด");
    const firstSignatureId = manager.signatures.get(owner.key).reference.mediaId;

    const safeStateText = JSON.stringify(manager.getState());
    assert.equal(safeStateText.includes("ชื่อผู้รับที่ต้องปกปิด"), false, "Pending safe state must redact receiver identity");
    assert.equal(safeStateText.includes("data:image"), false, "Pending safe state must redact evidence payloads");

    const legacyEvidence = await manager.buildLegacyEvidence([owner]);
    assert.equal(legacyEvidence.signatures[owner.key].receiverName, "ชื่อผู้รับที่ต้องปกปิด");
    assert.ok(legacyEvidence.photos[0].startsWith("data:image/jpeg"));

    await manager.commitActiveSignature("ชื่อผู้รับใหม่");
    const replacementSignatureId = manager.signatures.get(owner.key).reference.mediaId;
    assert.equal(count(harness.removed, firstSignatureId), 1, "Pending signature replacement must remove the old draft exactly once");

    await manager.setOwners([]);
    assert.equal(count(harness.removed, replacementSignatureId), 1, "Removing a Pending owner must clean that unsaved signature exactly once");
    assert.equal(count(harness.removed, photoId), 0, "Removing one Pending owner must not remove record-level photos");

    await manager.clear();
    assert.equal(count(harness.removed, photoId), 1, "Pending clear must remove the unsaved record photo exactly once");
}

async function verifyRangeManager({ code, className, initial, unchanged, changed, label }) {
    const harness = createHarness();
    vm.runInNewContext(code, harness.context);
    const Manager = harness.context.window[className];
    const manager = new Manager(harness.processor, harness.mediaStore, harness.policy, harness.FakeSignaturePad);

    await manager.setRecordContext(initial);
    manager.attachSignaturePad({ getContext: () => ({}) });
    await manager.addPhotos([{ name: `generated-${label}.jpg` }]);
    const photoId = manager.photoReferences[0].mediaId;
    const ownerKey = initial.owners[0].id;
    manager.selectOwner(ownerKey);
    await manager.commitActiveSignature("ชื่อผู้รับภายใน");
    const signatureId = manager.signatures.get(ownerKey).reference.mediaId;

    const safeText = JSON.stringify(manager.getState());
    assert.equal(safeText.includes("ชื่อผู้รับภายใน"), false, `${label} safe state must redact receiver identity`);
    assert.equal(safeText.includes("data:image"), false, `${label} safe state must redact Data URLs`);

    await manager.setRecordContext(unchanged);
    assert.equal(manager.getState().photoCount, 1, `${label} unchanged context must preserve the photo draft`);
    assert.equal(manager.getState().signatureCount, 1, `${label} unchanged context must preserve the signature draft`);
    assert.equal(count(harness.removed, photoId), 0, `${label} unchanged context must not remove the photo`);
    assert.equal(count(harness.removed, signatureId), 0, `${label} unchanged context must not remove the signature`);

    await manager.setRecordContext(changed);
    assert.equal(count(harness.removed, photoId), 1, `${label} changed context must remove the photo exactly once`);
    assert.equal(count(harness.removed, signatureId), 1, `${label} changed context must remove the signature exactly once`);
}

const owners = [{ id: "s1", studentId: "s1", name: "นักเรียนหนึ่ง" }];
await verifyRangeManager({
    code: files.retroactive,
    className: "RetroactiveEvidenceManagerClass",
    label: "Retroactive",
    initial: {
        roomId: "room-r",
        academicYear: "2569",
        semester: "1",
        retroStart: "2026-08-03",
        retroEnd: "2026-08-07",
        owners
    },
    unchanged: {
        roomId: "room-r",
        academicYear: "2569",
        semester: "1",
        retroStart: "2026-08-03",
        retroEnd: "2026-08-07",
        record: null,
        owners
    },
    changed: {
        roomId: "room-r",
        academicYear: "2569",
        semester: "1",
        retroStart: "2026-08-10",
        retroEnd: "2026-08-14",
        record: null,
        owners
    }
});

await verifyRangeManager({
    code: files.vacation,
    className: "VacationEvidenceManagerClass",
    label: "Vacation",
    initial: {
        roomId: "room-v",
        academicYear: "2569",
        semester: "1",
        issueDate: "2026-08-03",
        days: 30,
        owners
    },
    unchanged: {
        roomId: "room-v",
        academicYear: "2569",
        semester: "1",
        issueDate: "2026-08-03",
        days: 30,
        record: null,
        owners
    },
    changed: {
        roomId: "room-v",
        academicYear: "2569",
        semester: "1",
        issueDate: "2026-08-03",
        days: 31,
        record: null,
        owners
    }
});

// Adapter installation guards must prevent nested wrappers and duplicate hydration.
for (const [label, code, markers] of [
    ["Pending", files.pendingAdapter, ["__pendingEvidencePatched", "PendingEvidenceAdapterClass"]],
    ["Retroactive", files.retroactiveAdapter, ["__retroactiveEvidencePatched", "RetroactiveEvidenceAdapterClass"]],
    ["Vacation", files.vacationAdapter, ["__vacationEvidencePatched", "VacationEvidenceAdapterClass"]]
]) {
    assert.ok(code.includes(markers[0]), `${label} adapter must use an idempotent patch marker`);
    assert.ok(code.includes(markers[1]), `${label} adapter class must remain testable`);
}

console.log("Media evidence recovery and duplicate prevention checks passed.");