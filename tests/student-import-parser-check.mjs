import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const currentFile = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(currentFile), "..");
const require = createRequire(import.meta.url);
const source = fs.readFileSync(
    path.join(root, "modules/admin/studentImportParser.js"),
    "utf8"
);
const indexCode = fs.readFileSync(path.join(root, "index-v2.html"), "utf8");

assert.doesNotThrow(() => new vm.Script(source), "StudentImportParser must contain valid JavaScript");
assert.ok(!source.includes("fetch("), "StudentImportParser must not download spreadsheet code");
assert.ok(!source.includes("document."), "StudentImportParser must remain outside the View layer");
assert.match(indexCode, /assets\/vendor\/xlsx\.full\.min\.js/, "V2 must load the local XLSX reader");
assert.doesNotMatch(indexCode, /cdn[^"']*xlsx/i, "V2 must not depend on an XLSX CDN");
assert.ok(
    fs.statSync(path.join(root, "assets/vendor/xlsx.full.min.js")).size > 800_000,
    "The complete local XLSX browser bundle must be present"
);

const context = {
    window: { XLSX: null },
    Promise,
    Uint8Array,
    FileReader: class {},
    Set,
    Array,
    Object,
    String,
    RegExp,
    Error,
    console
};
vm.runInNewContext(source, context);
const StudentImportParser = context.window.StudentImportParser.constructor;
const parser = new StudentImportParser({
    read: () => ({}),
    utils: { sheet_to_json: () => [] }
});

const standard = parser.parseRows([
    ["โรงเรียนทดสอบ"],
    ["ห้อง ป.1/1 ปีการศึกษา 2569"],
    ["เลขที่", "รหัสประจำตัว", "ชื่อ", "นามสกุล", "เพศ"],
    [1, "001", "เด็กหนึ่ง", "ทดสอบ", "ชาย"],
    [2, "002", "เด็กสอง", "ทดสอบ", "หญิง"],
    ["รวม", "", "", "", ""]
], "ป.1/1");
assert.equal(standard.valid, true, "A standard Thai roster must parse");
assert.equal(standard.students.length, 2, "Only numeric student rows must be imported");
assert.equal(standard.students[0]["รหัสประจำตัว"], "001", "Student codes must retain display text");
assert.equal(standard.year, "2569", "Academic year must be extracted");

const merged = parser.parseRows([
    ["โรงเรียนทดสอบ"],
    ["ห้อง อ.3-1 ปีการศึกษา 2569"],
    ["เลขที่", "รหัสประจำตัว", "ชื่อ - นามสกุล", "", "", "วันเกิด"],
    [1, "101", "ชาย", "สมชาย", "ใจดี", "1/1/2562"],
    [2, "102", "หญิง", "สมหญิง", "ใจดี", "2/2/2562"]
], "อ.3-1");
assert.equal(merged.valid, true, "Merged Thai name headers must parse");
assert.deepEqual(
    { gender: merged.students[0]["เพศ"], first: merged.students[0]["ชื่อ"], last: merged.students[0]["นามสกุล"] },
    { gender: "ชาย", first: "สมชาย", last: "ใจดี" },
    "Merged name columns must map to gender, first name and last name"
);
assert.equal(merged.students[0]["วันเกิด"], "1/1/2562", "Columns after the merged name must be retained");

const combinedName = parser.parseRows([
    ["เลขที่", "รหัสนักเรียน", "ชื่อ-นามสกุล", "เพศ"],
    [1, "201", "เด็กชาย รวมชื่อ", "ชาย"]
], "CSV-room");
assert.equal(combinedName.valid, true, "A normal combined-name column must not be treated as three merged columns");
assert.equal(combinedName.students[0]["ชื่อ-นามสกุล"], "เด็กชาย รวมชื่อ");
assert.equal(combinedName.students[0]["เพศ"], "ชาย");

const invalid = parser.parseRows([
    ["ห้องทดสอบ"],
    ["ข้อมูล", "ทั่วไป"],
    ["ค่า", "หนึ่ง"]
], "ผิดรูปแบบ");
assert.equal(invalid.valid, false, "Files without a student header must be blocked");
assert.equal(invalid.errors[0].code, "STUDENT_IMPORT_HEADER_NOT_FOUND");

const badHeader = parser.parseRows([
    ["เลขที่", "ห้อง"],
    [1, "ป.1/1"]
], "ผิดหัวตาราง");
assert.equal(badHeader.valid, false, "Headers without a student name must be blocked");
assert.ok(
    badHeader.errors.some(error => error.code === "STUDENT_IMPORT_HEADER_NOT_FOUND" || error.code === "STUDENT_IMPORT_NAME_HEADER_REQUIRED")
);

const localXlsx = require(path.join(root, "assets/vendor/xlsx.full.min.js"));
const worksheet = localXlsx.utils.aoa_to_sheet([
    ["โรงเรียนทดสอบ"],
    ["ห้อง ป.1/1 ปีการศึกษา 2569"],
    ["เลขที่", "รหัสประจำตัว", "ชื่อ", "นามสกุล", "เพศ"],
    [1, "001", "เด็กหนึ่ง", "ทดสอบ", "ชาย"],
    [2, "002", "เด็กสอง", "ทดสอบ", "หญิง"]
]);
const workbook = localXlsx.utils.book_new();
localXlsx.utils.book_append_sheet(workbook, worksheet, "ป.1-1");
const realParser = new StudentImportParser(localXlsx);
const roundTrip = realParser.parseWorkbook(workbook, {
    fileName: "roster.xlsx",
    extension: "xlsx"
});
assert.equal(roundTrip.valid, true, "The vendored XLSX reader must parse a real workbook");
assert.equal(roundTrip.sheets[0].parsed.students.length, 2);

console.log("Student import parser checks passed.");
