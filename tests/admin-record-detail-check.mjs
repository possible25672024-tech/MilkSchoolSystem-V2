import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = relative => fs.readFileSync(path.join(root, relative), "utf8");
const viewSource = read("modules/admin/adminRoomView.js");
const serviceSource = read("modules/admin/adminRoomService.js");
const managerSource = read("modules/admin/adminRoomManager.js");
const indexSource = read("index-v2.html");

assert.doesNotThrow(() => new vm.Script(viewSource));
assert.ok(
    !viewSource.includes("this.alert(["),
    "Admin record View must not reduce the selected history to an alert summary"
);
for (const expected of [
    "openRecordDetail",
    "renderRecordDetailStudents",
    "renderRecordDetailEvidence",
    "safeImageSource"
]) {
    assert.ok(viewSource.includes(expected), `Admin full-record View must include ${expected}`);
}
assert.ok(serviceSource.includes("loadRecordDetail"), "Service must own selected-record hydration");
assert.ok(managerSource.includes("loadRecordDetail"), "Manager must expose selected-record hydration");
for (const expected of [
    'id="admin-record-detail"',
    'id="admin-record-detail-facts"',
    'id="admin-record-detail-summary"',
    'id="admin-record-detail-students"',
    'id="admin-record-detail-photos"',
    'id="admin-record-detail-signatures"',
    ".admin-record-detail-evidence",
    "@media (max-width: 600px)"
]) {
    assert.ok(indexSource.includes(expected), `Admin full-record page must contain ${expected}`);
}

const createElement = (tag = "div", id = "") => ({
    tag,
    id,
    hidden: id === "admin-record-detail",
    textContent: "",
    className: "",
    dataset: {},
    children: [],
    attributes: {},
    disabled: false,
    addEventListener() {},
    setAttribute(name, value) {
        this.attributes[name] = value;
    },
    removeAttribute(name) {
        delete this.attributes[name];
        if (name === "hidden") this.hidden = false;
    },
    append(...children) {
        this.children.push(...children);
    },
    appendChild(child) {
        this.children.push(child);
        return child;
    },
    replaceChildren(...children) {
        this.children = children;
    },
    scrollIntoView() {
        this.scrolled = true;
    }
});

const ids = [
    "admin-record-detail",
    "admin-record-detail-title",
    "admin-record-detail-subtitle",
    "admin-record-detail-facts",
    "admin-record-detail-summary",
    "admin-record-detail-students-heading",
    "admin-record-detail-students",
    "admin-record-detail-photo-count",
    "admin-record-detail-photos",
    "admin-record-detail-signatures",
    "admin-room-status",
    "admin-room-error"
];
const elements = new Map(ids.map(id => [id, createElement("div", id)]));
const document = {
    getElementById: id => elements.get(id) || null,
    querySelectorAll: () => [],
    createElement: tag => createElement(tag)
};
const windowObject = {
    addEventListener() {},
    alert() {},
    confirm: () => true,
    prompt: () => null
};
const context = vm.createContext({
    window: windowObject,
    document,
    console,
    Date,
    Number,
    String,
    Object,
    Array,
    Map,
    Set
});
new vm.Script(viewSource).runInContext(context);
const AdminRoomView = context.window.AdminRoomView.constructor;

let detailCall = null;
const manager = {
    async loadRecordDetail(type, input) {
        detailCall = { type, input };
        return {
            type: "attendance",
            id: "room-1_2026-07-30",
            room: {
                id: "room-1",
                name: "อ.3-1",
                teacher: "ครูหนึ่ง"
            },
            students: [
                { id: "s1", num: 1, name: "นักเรียนหนึ่ง" },
                { id: "s2", num: 2, name: "นักเรียนสอง" }
            ],
            record: {
                roomId: "room-1",
                roomName: "อ.3-1",
                teacher: "ครูหนึ่ง",
                date: "2026-07-30",
                year: "2569",
                term: "1",
                data: { s1: "present", s2: "absent" },
                notes: { s2: "ลา" },
                photos: ["data:image/jpeg;base64,PHOTO"],
                signature: "data:image/png;base64,SIGNATURE",
                savedAt: "2026-07-30T08:00:00.000Z"
            }
        };
    },
    clear() {}
};
const view = new AdminRoomView(
    manager,
    { getSession: () => ({ role: "admin", isAdmin: true }) },
    { document, window: windowObject }
);

await view.openRecordDetail("attendance", {
    recordId: "room-1_2026-07-30",
    date: "2026-07-30"
});

assert.deepEqual(detailCall, {
    type: "attendance",
    input: {
        recordId: "room-1_2026-07-30",
        date: "2026-07-30"
    }
});
assert.equal(elements.get("admin-record-detail").hidden, false);
assert.equal(elements.get("admin-record-detail-title").textContent, "ประวัติดื่มนม");
assert.match(elements.get("admin-record-detail-subtitle").textContent, /อ\.3-1/);
assert.equal(elements.get("admin-record-detail-students").children.length, 2);
assert.equal(
    elements.get("admin-record-detail-students").children[1].children[2].textContent,
    "ไม่ดื่มนม"
);
assert.equal(elements.get("admin-record-detail-photo-count").textContent, "1 รูป");
assert.equal(
    elements.get("admin-record-detail-photos").children[0].src,
    "data:image/jpeg;base64,PHOTO"
);
assert.equal(
    elements.get("admin-record-detail-signatures").children[0].children[1].src,
    "data:image/png;base64,SIGNATURE"
);
assert.match(elements.get("admin-room-status").textContent, /ทั้งรายการ/);

view.closeRecordDetail();
assert.equal(elements.get("admin-record-detail").hidden, true);
assert.equal(elements.get("admin-record-detail-students").children.length, 0);

console.log("Admin full-record detail checks passed.");
