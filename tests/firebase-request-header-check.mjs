import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const currentFile = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(currentFile), "..");
const source = fs.readFileSync(
    path.join(root, "modules/services/firebaseService.js"),
    "utf8"
);

const requests = [];
const context = {
    window: {
        ConfigManager: {
            getFirebaseConfig: () => ({}),
            getDatabaseURL: () => "",
            getAuthToken: () => ""
        }
    },
    URLSearchParams,
    AbortController,
    fetch: async (url, options) => {
        requests.push({ url, options });
        return {
            ok: true,
            status: 200,
            text: async () => "null"
        };
    },
    setTimeout,
    clearTimeout,
    JSON,
    String,
    Number,
    Boolean,
    Object,
    Map,
    Error,
    console
};

vm.runInNewContext(source, context);
const FirebaseService = context.window.FirebaseService.constructor;
const service = new FirebaseService();
service.databaseURL = "https://example.firebaseio.com";

await service.get("milkApp/settings");
assert.equal(requests.length, 1, "GET test must produce one request");
assert.equal(requests[0].options.method, "GET", "GET method must remain unchanged");
assert.equal(
    Object.keys(requests[0].options.headers || {}).some(
        name => name.toLowerCase() === "content-type"
    ),
    false,
    "Body-less Firebase GET must not send Content-Type and trigger a CORS preflight"
);

await service.set("milkApp/settings", { school: "test" });
assert.equal(requests.length, 2, "PUT test must produce a second request");
assert.equal(requests[1].options.method, "PUT", "PUT method must remain unchanged");
assert.equal(
    requests[1].options.headers["Content-Type"],
    "application/json",
    "JSON writes must keep the application/json Content-Type"
);

console.log("Firebase request header checks passed.");
