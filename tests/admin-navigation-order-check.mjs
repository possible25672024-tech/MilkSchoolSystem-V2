import assert from "node:assert/strict";
import fs from "node:fs";

const html = fs.readFileSync("index-v2.html", "utf8");
const nav = html.match(/<nav class="admin-menu"[\s\S]*?<\/nav>/)?.[0] || "";
assert.ok(nav, "Admin menu navigation must exist");

const groups = [...nav.matchAll(/<span class="admin-menu-group">([^<]+)<\/span>/g)]
    .map(match => match[1]);
assert.deepEqual(groups, [
    "หน้าหลัก",
    "เอกสาร",
    "รับนม",
    "นักเรียน",
    "จ่ายนม",
    "รายงาน",
    "เช็กดื่มนม",
    "ตั้งค่า"
]);

const menus = [...nav.matchAll(/data-admin-menu="([^"]+)"/g)].map(match => match[1]);
assert.deepEqual(menus, [
    "system-dashboard",
    "documents",
    "receipts",
    "student-import",
    "room-management",
    "student-report",
    "distribution",
    "distribution-history",
    "pending",
    "vacation",
    "retroactive",
    "operational-summary",
    "distribution-report",
    "school-report",
    "dashboard",
    "attendance",
    "system-settings",
    "backup-restore",
    "drive-sync"
]);
assert.equal(new Set(menus).size, menus.length, "Admin menus must not be duplicated");

console.log("Admin menu grouping and reference order checks passed.");
