import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const source = fs.readFileSync("modules/services/firebaseAuthService.js", "utf8");
const values = new Map();
const storage = {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: key => values.delete(key)
};
let now = 1_000_000;
const requests = [];
const fetchImpl = async (url, options = {}) => {
    requests.push({ url: String(url), options: { ...options } });
    const isRefresh = String(url).includes("/token?");
    return {
        ok: true,
        status: 200,
        text: async () => JSON.stringify(isRefresh ? {
            user_id: "uid-teacher-1",
            id_token: "id-token-refreshed",
            refresh_token: "refresh-token-2",
            expires_in: "3600"
        } : {
            localId: "uid-teacher-1",
            email: "teacher@example.invalid",
            idToken: "id-token-1",
            refreshToken: "refresh-token-1",
            expiresIn: "3600"
        })
    };
};
const tokenLog = [];
const firebaseService = {
    setAuthTokenProvider(provider) { this.provider = provider; },
    setAuthToken(token) { tokenLog.push(token); }
};
const context = vm.createContext({
    window: { FirebaseService: firebaseService },
    sessionStorage: storage,
    fetch: fetchImpl,
    URLSearchParams,
    encodeURIComponent,
    JSON,
    String,
    Number,
    Boolean,
    Object,
    Error,
    Date,
    Math,
    Promise,
    console
});
new vm.Script(source, { filename: "firebaseAuthService.js" }).runInContext(context);
const FirebaseAuthService = context.window.FirebaseAuthService.constructor;
const service = new FirebaseAuthService({ storage, fetchImpl, clock: () => now });
service.initialize({
    auth: {
        mode: "firebase-email-password",
        apiKey: "test-api-key",
        identityToolkitURL: "https://identity.test/v1",
        secureTokenURL: "https://secure-token.test/v1",
        refreshSkewSeconds: 120
    }
}, firebaseService);

const signedIn = await service.signIn("teacher@example.invalid", "never-store-this-password");
assert.equal(signedIn.uid, "uid-teacher-1");
assert.equal(tokenLog.at(-1), "id-token-1");
assert.match(requests[0].url, /accounts:signInWithPassword\?key=test-api-key$/);
assert.equal(JSON.parse(requests[0].options.body).returnSecureToken, true);
assert.doesNotMatch(values.get(service.storageKey), /never-store-this-password/);

now += 3_550_000;
assert.equal(await service.getValidIdToken(), "id-token-refreshed");
assert.match(requests[1].url, /\/token\?key=test-api-key$/);
assert.match(requests[1].options.body, /grant_type=refresh_token/);
assert.equal(tokenLog.at(-1), "id-token-refreshed");

const restored = new FirebaseAuthService({ storage, fetchImpl, clock: () => now });
restored.initialize(service.config ? { auth: service.config } : {}, firebaseService);
assert.equal((await restored.restoreAuth()).uid, "uid-teacher-1");
restored.signOut();
assert.equal(values.has(service.storageKey), false);
assert.equal(tokenLog.at(-1), "");

console.log("Firebase Authentication sign-in, token refresh, restore, redaction, and sign-out checks passed.");
