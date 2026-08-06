import assert from "node:assert/strict";
import vm from "node:vm";
import fs from "node:fs";
import { pathToFileURL } from "node:url";

const source = fs.readFileSync("modules/services/firebaseService.js", "utf8");
const window = {
    APP_CONFIG: { mode: "LEGACY_READ_ONLY", legacyReadOnly: true },
    ConfigManager: {
        getFirebaseConfig() {
            return { databaseURL: "https://example-rtdb.firebaseio.com", requestTimeoutMs: 15000, auth: { apiKey: "local-api-key" } };
        },
        getAppConfig() {
            return window.APP_CONFIG || {};
        }
    }
};
const context = vm.createContext({ window, fetch: async () => { throw new Error("fetch should never be called in read-only mode"); }, URLSearchParams, AbortController, console, setTimeout, clearTimeout, Error, Promise, String, Number, Object, Array, Map, URL });
new vm.Script(source, { filename: "firebaseService.js" }).runInContext(context);

assert.ok(window.FirebaseService, "FirebaseService should be initialized on window");
window.FirebaseService.initialize(window.ConfigManager.getFirebaseConfig());

await assert.rejects(
    window.FirebaseService.performRequest("test/path", { method: "PUT", body: JSON.stringify({ test: true }) }, {}),
    error => {
        assert.equal(error.message, "Firebase write operations are blocked in legacy read-only mode.");
        return true;
    }
);

await assert.rejects(
    window.FirebaseService.performRequest("test/path", { method: "POST", body: JSON.stringify({ test: true }) }, {}),
    error => {
        assert.equal(error.message, "Firebase write operations are blocked in legacy read-only mode.");
        return true;
    },
    "POST should also be blocked in legacy read-only mode"
);

console.log("FirebaseService read-only write operations are blocked as expected.");
