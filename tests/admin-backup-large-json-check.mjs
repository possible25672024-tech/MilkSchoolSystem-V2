import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const serviceSource = fs.readFileSync("modules/admin/adminSystemService.js", "utf8");
const viewSource = fs.readFileSync("modules/admin/adminSystemView.js", "utf8");
assert.ok(!viewSource.includes("JSON.stringify(value, null, 2)"));
assert.ok(viewSource.includes("jsonChunks(value)"));
assert.ok(serviceSource.includes("canonicalizeForDigest"));

const digestInputs = [];
const digest = async value => {
    digestInputs.push(String(value).length);
    let hash = 0;
    for (const character of String(value).slice(0, 10000)) {
        hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
    }
    return `sha256-${hash.toString(16).padStart(8, "0")}-${String(value).length}`;
};
const serviceContext = vm.createContext({ console, Date, Math, Promise, window: {} });
new vm.Script(serviceSource).runInContext(serviceContext);
const Service = serviceContext.window.AdminSystemService.constructor;
const service = new Service({}, { digest });
const large = "A".repeat(1024 * 1024);
const data = { first: large, second: large, stock: 1 };
const checksum = await service.checksumData(data);
assert.ok(checksum.startsWith("sha256-"));
assert.ok(
    Math.max(...digestInputs) < large.length + 1000,
    "Checksum must not concatenate all large evidence strings into one giant string"
);

const documentStub = { getElementById() { return null; } };
const windowStub = { confirm() { return true; } };
const viewContext = vm.createContext({ console, Date, Blob, document: documentStub, window: windowStub });
new vm.Script(viewSource).runInContext(viewContext);
const View = viewContext.window.AdminSystemView.constructor;
const view = new View({}, {}, windowStub, { document: documentStub, window: windowStub });
const chunks = view.jsonChunks({ first: large, nested: { second: large }, stock: 1 }, 64 * 1024);
assert.ok(chunks.length >= 3, "Large backup JSON must be emitted as multiple Blob parts");
const restored = JSON.parse(chunks.join(""));
assert.equal(restored.first.length, large.length);
assert.equal(restored.nested.second.length, large.length);
assert.equal(restored.stock, 1);

console.log("Admin large-backup canonical checksum and chunked JSON Blob checks passed.");
