import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentFile = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(currentFile), "..");
const read = relativePath => fs.readFileSync(path.join(root, relativePath), "utf8");

const index = read("index-v2.html");
const loginService = read("modules/services/loginService.js");
const authService = read("modules/login/authService.js");
const loginManager = read("modules/login/loginManager.js");
const bootstrap = read("modules/core/bootstrap.js");
const repository = read("modules/repositories/loginRepository.js");

const dependencyOrder = [
    "config/app-config.js",
    "config/firebase-config.js",
    "modules/config/configManager.js",
    "modules/services/firebaseService.js",
    "modules/repositories/baseRepository.js",
    "modules/repositories/loginRepository.js",
    "modules/services/loginService.js",
    "modules/login/authService.js",
    "modules/login/loginManager.js",
    "modules/core/app.js",
    "modules/core/bootstrap.js"
];

for (let indexPosition = 0; indexPosition < dependencyOrder.length - 1; indexPosition += 1) {
    const current = dependencyOrder[indexPosition];
    const next = dependencyOrder[indexPosition + 1];
    assert.ok(index.indexOf(current) < index.indexOf(next), `${current} must load before ${next}`);
}

assert.equal((bootstrap.match(/DOMContentLoaded/g) || []).length, 1, "Bootstrap must bind DOMContentLoaded once");
assert.ok(!/async\s+login[\s\S]*?return\s+true\s*;/.test(loginService), "LoginService must not contain a fake successful login");
assert.ok(!/async\s+login[\s\S]*?return\s+true\s*;/.test(authService), "AuthService must not contain a fake successful login");
assert.ok(repository.includes("milkApp/settings"), "LoginRepository must read milkApp/settings");
assert.ok(repository.includes("milkApp/rooms"), "LoginRepository must read milkApp/rooms");
assert.ok(loginService.includes("adminPassword"), "Admin password rule must be present");
assert.ok(loginService.includes("teacherPassword"), "Teacher password rule must be present");
assert.ok(authService.includes("milkApp_loginSession"), "Legacy-compatible session key must be preserved");
assert.ok(!loginManager.includes("FirebaseService"), "LoginManager must not access Firebase directly");

console.log("Login foundation static checks passed.");
