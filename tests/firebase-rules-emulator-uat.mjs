import fs from "node:fs";
import { pathToFileURL } from "node:url";

const loadModule = async (name, environmentKey) => {
    const explicit = process.env[environmentKey];
    return import(explicit ? pathToFileURL(explicit).href : name);
};
const testing = await loadModule(
    "@firebase/rules-unit-testing",
    "MILK_RULES_TESTING_MODULE"
);
const database = await loadModule(
    "firebase/database",
    "MILK_FIREBASE_DATABASE_MODULE"
);
const {
    initializeTestEnvironment,
    assertSucceeds,
    assertFails
} = testing;
const {
    ref,
    get,
    set,
    query,
    orderByChild,
    orderByKey,
    equalTo,
    startAt,
    endAt
} = database;

const projectId = "demo-milk-school-v2";
const testEnv = await initializeTestEnvironment({
    projectId,
    database: {
        host: "127.0.0.1",
        port: 9000,
        rules: fs.readFileSync("firebase/database.rules.json", "utf8")
    }
});

try {
    await testEnv.withSecurityRulesDisabled(async context => {
        await set(ref(context.database(), "milkApp"), {
            public: {
                loginDirectory: {
                    schoolName: "โรงเรียนทดสอบ Sprint 6.4",
                    accounts: {
                        __admin__: { name: "ผู้ดูแลระบบ", authEmail: "admin@example.invalid" },
                        r1: { name: "ป.1/1", authEmail: "r1@example.invalid" }
                    }
                },
                appSettings: { school: "โรงเรียนทดสอบ", year: "2569", semester: "1", perCrate: 36 }
            },
            accessControl: {
                users: {
                    "uid-admin": { role: "admin", enabled: true },
                    "uid-teacher-r1": { role: "teacher", roomId: "r1", enabled: true },
                    "uid-teacher-r2": { role: "teacher", roomId: "r2", enabled: true },
                    "uid-disabled": { role: "teacher", roomId: "r1", enabled: false }
                }
            },
            settings: { school: "โรงเรียนทดสอบ", year: "2569" },
            rooms: {
                r1: { id: "r1", name: "ป.1/1", teacher: "ครูหนึ่ง" },
                r2: { id: "r2", name: "ป.1/2", teacher: "ครูสอง" }
            },
            roomStock: { r1: 36, r2: 72 },
            mcAttendance: {
                "r1_2026-08-01": { roomId: "r1", data: { s1: "present" } },
                "r2_2026-08-01": { roomId: "r2", data: { s2: "present" } }
            },
            absentMilk: {
                pending_r1: { roomId: "r1", totalBoxes: 1 },
                pending_r2: { roomId: "r2", totalBoxes: 2 }
            },
            stock: 720
        });
    });

    const anonymous = testEnv.unauthenticatedContext().database();
    const admin = testEnv.authenticatedContext("uid-admin", { email: "admin@example.invalid" }).database();
    const teacher = testEnv.authenticatedContext("uid-teacher-r1", { email: "r1@example.invalid" }).database();
    const disabled = testEnv.authenticatedContext("uid-disabled", { email: "disabled@example.invalid" }).database();

    await assertSucceeds(get(ref(anonymous, "milkApp/public/loginDirectory")));
    await assertFails(get(ref(anonymous, "milkApp/settings")));
    await assertFails(set(ref(anonymous, "milkApp/roomStock/r1"), 35));

    await assertSucceeds(get(ref(admin, "milkApp")));
    await assertSucceeds(set(ref(admin, "milkApp/settings/school"), "โรงเรียน UAT"));
    await assertFails(set(ref(admin, "milkApp/settings/adminPassword"), "must-never-return"));

    await assertSucceeds(get(ref(teacher, "milkApp/accessControl/users/uid-teacher-r1")));
    await assertFails(get(ref(teacher, "milkApp/accessControl/users/uid-teacher-r2")));
    await assertSucceeds(get(ref(teacher, "milkApp/public/appSettings")));
    await assertFails(get(ref(teacher, "milkApp/settings")));
    await assertSucceeds(get(ref(teacher, "milkApp/rooms/r1")));
    await assertFails(get(ref(teacher, "milkApp/rooms/r2")));
    await assertSucceeds(set(ref(teacher, "milkApp/rooms/r1/teacher"), "ครูหนึ่ง แก้ไข"));
    await assertFails(set(ref(teacher, "milkApp/rooms/r2/teacher"), "ข้ามห้อง"));
    await assertSucceeds(set(ref(teacher, "milkApp/roomStock/r1"), 35));
    await assertFails(set(ref(teacher, "milkApp/roomStock/r2"), 71));

    await assertSucceeds(get(ref(teacher, "milkApp/mcAttendance/r1_2026-08-01/data")));
    await assertFails(get(ref(teacher, "milkApp/mcAttendance/r2_2026-08-01/data")));
    await assertSucceeds(set(ref(teacher, "milkApp/mcAttendance/r1_2026-08-02"), {
        roomId: "r1",
        data: { s1: "present" }
    }));
    await assertFails(set(ref(teacher, "milkApp/mcAttendance/r2_2026-08-02"), {
        roomId: "r2",
        data: { s2: "present" }
    }));
    await assertSucceeds(get(query(
        ref(teacher, "milkApp/mcAttendance"),
        orderByKey(),
        startAt("r1_"),
        endAt("r1_\uf8ff")
    )));
    await assertFails(get(ref(teacher, "milkApp/mcAttendance")));

    await assertSucceeds(get(query(
        ref(teacher, "milkApp/absentMilk"),
        orderByChild("roomId"),
        equalTo("r1")
    )));
    await assertFails(get(ref(teacher, "milkApp/absentMilk")));
    await assertSucceeds(set(ref(teacher, "milkApp/absentMilk/new_r1"), {
        roomId: "r1",
        totalBoxes: 1
    }));
    await assertFails(set(ref(teacher, "milkApp/absentMilk/new_r2"), {
        roomId: "r2",
        totalBoxes: 1
    }));
    await assertFails(set(ref(teacher, "milkApp/absentMilk/pending_r2"), {
        roomId: "r1",
        totalBoxes: 1
    }));

    await assertFails(get(ref(disabled, "milkApp/rooms/r1")));
    await assertFails(set(ref(disabled, "milkApp/roomStock/r1"), 34));
} finally {
    await testEnv.cleanup();
}

console.log("Firebase Rules Emulator UAT passed: anonymous deny, Admin allow, own-room allow, cross-room deny, disabled-user deny, and password-field deny.");
