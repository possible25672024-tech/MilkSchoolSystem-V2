import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const currentFile = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(currentFile), "..");
const adapterCode = fs.readFileSync(path.join(root, "modules/media/vacationEvidenceAdapter.js"), "utf8");

assert.doesNotThrow(() => new vm.Script(adapterCode), "vacationEvidenceAdapter.js must contain valid JavaScript");
assert.ok(adapterCode.includes("milkapp:login-success"), "Vacation evidence adapter must listen for Teacher login");
assert.ok(adapterCode.includes("Promise.resolve().then"), "Vacation evidence login replay must wait until login handlers finish");

const listeners = new Map();
let previewReplayCount = 0;
const fakeWindow = {
    VacationEvidenceManager: {
        async buildLegacyEvidence() {
            return { photos: [], signature: "", signatures: {} };
        },
        markSaved() {}
    },
    VacationMilkManager: {
        async issue() {
            return { id: "vacation-login-replay" };
        }
    },
    VacationMilkService: {
        buildRecord() {
            return { photos: [], signature: "", signatures: {} };
        }
    },
    VacationMilkView: {
        handlePreviewChange() {
            previewReplayCount += 1;
        }
    },
    addEventListener(name, listener) {
        const current = listeners.get(name) || [];
        current.push(listener);
        listeners.set(name, current);
    }
};

vm.runInNewContext(adapterCode, {
    window: fakeWindow,
    Object,
    Array,
    String,
    Error,
    Promise,
    console
});

const adapter = fakeWindow.VacationEvidenceAdapter;
adapter.install();
adapter.install();
assert.equal((listeners.get("milkapp:login-success") || []).length, 1, "Repeated adapter installation must not duplicate login replay listeners");

for (const listener of listeners.get("milkapp:login-success") || []) {
    listener({ detail: { session: { role: "admin" } } });
}
await Promise.resolve();
assert.equal(previewReplayCount, 0, "Non-Teacher login must not replay Vacation evidence preview");

for (const listener of listeners.get("milkapp:login-success") || []) {
    listener({ detail: { session: { role: "teacher", roomId: "vacation-room" } } });
}
await Promise.resolve();
assert.equal(previewReplayCount, 1, "Teacher login must replay Vacation preview after evidence activation");

console.log("Vacation evidence login replay checks passed.");