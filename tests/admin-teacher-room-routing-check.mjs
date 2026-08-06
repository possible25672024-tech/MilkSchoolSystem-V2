import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const roomView = fs.readFileSync("modules/admin/adminRoomView.js", "utf8");
const roomManager = fs.readFileSync("modules/admin/adminRoomManager.js", "utf8");
const teacherView = fs.readFileSync("modules/teacher/teacherParityView.js", "utf8");
const html = fs.readFileSync("index-v2.html", "utf8");

for (const [name, source] of [
    ["AdminRoomView", roomView],
    ["AdminRoomManager", roomManager],
    ["TeacherParityView", teacherView]
]) {
    assert.doesNotThrow(() => new vm.Script(source), `${name} must contain valid JavaScript`);
}

for (const [adminMenu, teacherSection] of [
    ["pending", "pending"],
    ["retroactive", "retroactive"],
    ["vacation", "vacation"]
]) {
    assert.ok(
        roomView.includes(`${adminMenu}: "${teacherSection}"`),
        `${adminMenu} must route to the selected room's full Teacher page`
    );
}
assert.match(roomManager, /milkapp:teacher-section-requested/);
assert.match(teacherView, /handleSectionRequested/);
assert.match(teacherView, /teacher-admin-return/);
assert.match(teacherView, /AdminRoomManager\?\.restoreAdmin/);
for (const menu of ["pending", "retroactive", "vacation"]) {
    assert.ok(html.includes(`data-admin-menu="${menu}"`));
}

const calls = [];
const fakeManager = {
    async enterSelectedRoom(options) { calls.push(options); },
    clear() {}
};
const fakeDocument = {
    getElementById() { return null; },
    querySelectorAll() { return []; }
};
const context = vm.createContext({
    console,
    Date,
    Map,
    window: { confirm() {}, prompt() {}, alert() {} },
    document: fakeDocument
});
new vm.Script(roomView).runInContext(context);
const View = context.window.AdminRoomView.constructor;
const view = new View(fakeManager, { getSession: () => ({ role: "admin" }) }, {
    document: fakeDocument,
    window: { addEventListener() {} }
});
view.setBusy = () => {};
view.showError = () => {};
view.setStatus = () => {};
await view.openAdminMenu("pending");
await view.openAdminMenu("vacation");
await view.openAdminMenu("retroactive");
assert.deepEqual(
    calls.map(call => String(call.teacherSection)),
    ["pending", "vacation", "retroactive"]
);

console.log("Admin selected-room Teacher page routing checks passed.");
