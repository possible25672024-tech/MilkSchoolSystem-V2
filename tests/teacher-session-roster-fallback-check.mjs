import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const currentFile = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(currentFile), "..");
const code = fs.readFileSync(path.join(root, "modules/teacher/teacherManager.js"), "utf8");

assert.doesNotThrow(() => new vm.Script(code), "teacherManager.js must contain valid JavaScript");
assert.ok(code.includes("session-fallback"), "TeacherManager must expose an explicit session fallback source");
assert.ok(code.includes("roomSnapshot"), "TeacherManager fallback must use the authenticated room snapshot");

const teacherSession = {
    role: "teacher",
    classId: "room-fallback",
    roomId: "room-fallback",
    roomName: "ห้องทดสอบ fallback",
    teacher: "ครู fallback",
    schoolName: "โรงเรียนทดสอบ",
    roomSnapshot: {
        id: "room-fallback",
        name: "ห้องทดสอบ fallback",
        teacher: "ครู fallback",
        stock: 476,
        students: {
            a: { id: "s1", no: 1, name: "นักเรียนหนึ่ง" },
            b: { id: "s2", no: 2, name: "นักเรียนสอง" }
        }
    }
};

const teacherService = {
    loadTeacherView() {
        throw new Error("Live refresh must not be required for fallback snapshot creation.");
    },
    requireSession(session) {
        if (session?.role !== "teacher") throw new Error("Teacher session required.");
        return session.roomId;
    },
    normalizeRoom(room) {
        const students = Array.isArray(room.students)
            ? room.students
            : Object.values(room.students || {});
        return {
            ...room,
            id: String(room.id || ""),
            name: String(room.name || room.id || ""),
            teacher: String(room.teacher || "ครูประจำชั้น"),
            students: students.map((student, index) => ({
                ...student,
                id: String(student.id || `student_${index + 1}`),
                num: String(student.no || student.num || index + 1),
                name: String(student.name || `นักเรียนคนที่ ${index + 1}`)
            })),
            stock: Number(room.stock) || 0
        };
    }
};

const authService = {
    session: teacherSession,
    getSession() {
        return this.session;
    }
};

const listeners = new Map();
const windowObject = {
    TeacherService: teacherService,
    AuthService: authService,
    addEventListener(name, listener) {
        const values = listeners.get(name) || [];
        values.push(listener);
        listeners.set(name, values);
    },
    dispatchEvent() {}
};
const context = {
    window: windowObject,
    CustomEvent: class CustomEvent {
        constructor(type, options) {
            this.type = type;
            this.detail = options?.detail;
        }
    },
    Date,
    Number,
    String,
    Object,
    Array,
    Error,
    console
};

vm.runInNewContext(code, context);
const manager = context.window.TeacherManager;

const fallback = manager.getSnapshot();
assert.ok(fallback, "TeacherManager must provide a fallback snapshot while live refresh is not ready");
assert.equal(fallback.roomSource, "session-fallback", "Fallback source must be explicit");
assert.equal(fallback.degraded, true, "Fallback snapshot must be marked degraded");
assert.equal(fallback.room.id, "room-fallback", "Fallback must remain scoped to authenticated room");
assert.equal(fallback.students.length, 2, "Fallback must retain the authenticated room roster");
assert.equal(fallback.students[0].name, "นักเรียนหนึ่ง", "Fallback must preserve student names");
assert.equal(fallback.roomStock, 476, "Fallback must expose the session Room Stock preview");
assert.equal(fallback.extrasLoaded, false, "Fallback must not pretend historical extras were loaded");
assert.deepEqual(Object.keys(fallback.attendance), [], "Fallback must not invent Attendance records");
assert.deepEqual(Array.from(fallback.vacationMilk), [], "Fallback must not invent Vacation Milk records");

const liveSnapshot = {
    room: { id: "room-fallback", students: [{ id: "live-1", name: "ข้อมูลสด" }] },
    students: [{ id: "live-1", name: "ข้อมูลสด" }],
    roomStock: 470,
    roomSource: "firebase-live",
    degraded: false
};
manager.currentView = { snapshot: liveSnapshot, dashboard: {} };
assert.equal(manager.getSnapshot(), liveSnapshot, "Live snapshot must replace the temporary session fallback");

manager.clear();
authService.session = { role: "admin", classId: "__admin__" };
assert.equal(manager.getSnapshot(), null, "Admin session must never receive a Teacher fallback snapshot");

console.log("Teacher session roster fallback checks passed.");
