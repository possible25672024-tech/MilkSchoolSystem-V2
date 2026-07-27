class StockService {
    constructor(repository = window.StockRepository, options = {}) {
        this.repository = repository;
        this.clock = options.clock || (() => new Date());
        this.idFactory = options.idFactory || (() => (
            Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
        ));
        this.allowedRoomConsumptionTypes = new Set([
            "ATTENDANCE",
            "PENDING",
            "RETRO",
            "VACATION"
        ]);
    }

    ensureRepository() {
        if (!this.repository) {
            this.repository = window.StockRepository;
        }

        if (!this.repository) {
            throw this.businessError("REPOSITORY_UNAVAILABLE", "StockRepository is not available.");
        }

        return this.repository;
    }

    businessError(code, message) {
        const error = new Error(message);
        error.code = code;
        return error;
    }

    createId() {
        return String(this.idFactory());
    }

    nowIso() {
        return this.clock().toISOString();
    }

    toNumber(value, fallback = 0) {
        const number = Number(value);
        return Number.isFinite(number) ? number : fallback;
    }

    requirePositiveInteger(value, fieldName) {
        const number = Number(value);
        if (!Number.isInteger(number) || number < 1) {
            throw this.businessError(
                "INVALID_QUANTITY",
                `${fieldName} must be a positive integer.`
            );
        }
        return number;
    }

    requireNonNegativeInteger(value, fieldName) {
        const number = Number(value);
        if (!Number.isInteger(number) || number < 0) {
            throw this.businessError(
                "INVALID_QUANTITY",
                `${fieldName} must be a non-negative integer.`
            );
        }
        return number;
    }

    requireRoomId(roomId) {
        const normalized = String(roomId || "").trim();
        if (!normalized) {
            throw this.businessError("ROOM_REQUIRED", "A room id is required.");
        }
        return normalized;
    }

    entries(collection) {
        if (Array.isArray(collection)) {
            return collection
                .map((record, index) => [String(record?.id || index), record])
                .filter(([, record]) => record && typeof record === "object");
        }

        if (collection && typeof collection === "object") {
            return Object.entries(collection)
                .filter(([, record]) => record && typeof record === "object");
        }

        return [];
    }

    values(collection) {
        return this.entries(collection).map(([, record]) => record);
    }

    resolveRoomId(record = {}, key = "") {
        const explicit = record.roomId || record.classId || record.clsId;
        if (explicit !== undefined && explicit !== null && String(explicit).trim()) {
            return String(explicit);
        }

        const keyMatch = String(key).match(/^(.*)_\d{4}-\d{2}-\d{2}$/);
        return keyMatch ? keyMatch[1] : "";
    }

    recordQuantity(record = {}, fields = ["totalBoxes", "total", "boxes", "quantity"]) {
        for (const field of fields) {
            const value = Number(record[field]);
            if (Number.isFinite(value)) {
                return value;
            }
        }
        return 0;
    }

    attendanceQuantity(record = {}) {
        if (record.data && typeof record.data === "object") {
            return Object.values(record.data).filter(status => status === "present").length;
        }

        return this.recordQuantity(record, ["presentCount", "consumed", "totalBoxes"]);
    }

    calculateReceiveTotal({ crates, extra = 0, perCrate = 36 }) {
        const normalizedCrates = this.requirePositiveInteger(crates, "crates");
        const normalizedExtra = this.requireNonNegativeInteger(extra, "extra");
        const normalizedPerCrate = this.requirePositiveInteger(perCrate, "perCrate");

        return normalizedCrates * normalizedPerCrate + normalizedExtra;
    }

    calculateDistributionTotal({ students, days, perCrate = 36 }) {
        const normalizedStudents = this.requirePositiveInteger(students, "students");
        const normalizedDays = this.requirePositiveInteger(days, "days");
        const normalizedPerCrate = this.requirePositiveInteger(perCrate, "perCrate");
        const total = normalizedStudents * normalizedDays;

        return {
            students: normalizedStudents,
            days: normalizedDays,
            total,
            crates: Math.floor(total / normalizedPerCrate),
            boxes: total % normalizedPerCrate,
            perCrate: normalizedPerCrate
        };
    }

    calculateMainStock(snapshot = {}) {
        const received = this.values(snapshot.receives)
            .reduce((sum, record) => sum + this.recordQuantity(record, ["total"]), 0);
        const distributed = this.values(snapshot.distributes)
            .reduce((sum, record) => sum + this.recordQuantity(record, ["total"]), 0);

        return {
            received,
            distributed,
            expected: received - distributed
        };
    }

    initializeRoomBreakdown(snapshot = {}) {
        const breakdown = {};
        const addRoom = roomId => {
            const normalized = String(roomId || "").trim();
            if (!normalized || breakdown[normalized]) {
                return;
            }
            breakdown[normalized] = {
                roomId: normalized,
                incoming: 0,
                attendance: 0,
                pending: 0,
                retro: 0,
                vacation: 0,
                expected: 0
            };
        };

        this.entries(snapshot.rooms).forEach(([key, room]) => addRoom(room.id || key));
        Object.keys(snapshot.roomStock || {}).forEach(addRoom);

        return { breakdown, addRoom };
    }

    addRecordsToBreakdown(collection, breakdownState, bucket, quantityResolver) {
        this.entries(collection).forEach(([key, record]) => {
            const roomId = this.resolveRoomId(record, key);
            if (!roomId) {
                return;
            }

            breakdownState.addRoom(roomId);
            breakdownState.breakdown[roomId][bucket] += quantityResolver(record, key);
        });
    }

    calculateRoomStock(snapshot = {}) {
        const state = this.initializeRoomBreakdown(snapshot);

        this.addRecordsToBreakdown(
            snapshot.distributes,
            state,
            "incoming",
            record => this.recordQuantity(record, ["total"])
        );
        this.addRecordsToBreakdown(
            snapshot.attendance || snapshot.mcAttendance,
            state,
            "attendance",
            record => this.attendanceQuantity(record)
        );
        this.addRecordsToBreakdown(
            snapshot.absentMilk,
            state,
            "pending",
            record => this.recordQuantity(record)
        );
        this.addRecordsToBreakdown(
            snapshot.retroMilk,
            state,
            "retro",
            record => this.recordQuantity(record)
        );
        this.addRecordsToBreakdown(
            snapshot.vacationMilk,
            state,
            "vacation",
            record => this.recordQuantity(record)
        );

        this.addRecordsToBreakdown(
            snapshot.localPending,
            state,
            "pending",
            record => this.recordQuantity(record, ["boxes", "totalBoxes", "total"])
        );
        this.addRecordsToBreakdown(
            snapshot.localRetro,
            state,
            "retro",
            record => this.recordQuantity(record, ["total", "totalBoxes"])
        );
        this.addRecordsToBreakdown(
            snapshot.localVacation,
            state,
            "vacation",
            record => this.recordQuantity(record, ["total", "totalBoxes"])
        );

        Object.values(state.breakdown).forEach(room => {
            room.expected = room.incoming
                - room.attendance
                - room.pending
                - room.retro
                - room.vacation;
        });

        return state.breakdown;
    }

    validateSnapshot(snapshot = {}) {
        const main = this.calculateMainStock(snapshot);
        const roomBreakdown = this.calculateRoomStock(snapshot);
        const actualMain = this.toNumber(snapshot.stock);
        const actualRoomStock = snapshot.roomStock || {};

        const roomResults = Object.values(roomBreakdown).map(room => {
            const actual = this.toNumber(actualRoomStock[room.roomId]);
            return {
                ...room,
                actual,
                difference: actual - room.expected,
                valid: actual === room.expected
            };
        });

        return {
            main: {
                ...main,
                actual: actualMain,
                difference: actualMain - main.expected,
                valid: actualMain === main.expected
            },
            rooms: roomResults,
            valid: actualMain === main.expected && roomResults.every(room => room.valid)
        };
    }

    buildLedgerEntry({ roomId = null, type, quantity, stockBefore, stockAfter, source = "admin", user = "admin", referenceId = null }) {
        return {
            id: this.createId(),
            timestamp: this.nowIso(),
            roomId,
            type,
            quantity,
            stockBefore,
            stockAfter,
            source,
            user,
            referenceId
        };
    }

    async loadSnapshot() {
        return this.ensureRepository().loadStockSnapshot();
    }

    async receiveMilk(command = {}) {
        const repository = this.ensureRepository();
        const total = command.total !== undefined
            ? this.requirePositiveInteger(command.total, "total")
            : this.calculateReceiveTotal(command);
        const stockBefore = this.toNumber(await repository.loadMainStock());
        const stockAfter = stockBefore + total;
        const referenceId = String(command.referenceId || this.createId());
        const record = {
            ...command.record,
            id: referenceId,
            total,
            createdAt: command.record?.createdAt || this.nowIso()
        };
        const ledger = this.buildLedgerEntry({
            type: "RECEIVE",
            quantity: total,
            stockBefore,
            stockAfter,
            source: command.source || "admin",
            user: command.user || "admin",
            referenceId
        });

        await repository.applyMultiLocationUpdate({
            stock: stockAfter,
            [`receives/${referenceId}`]: record,
            [`stockTransactions/${ledger.id}`]: ledger
        });

        return { record, ledger, stockBefore, stockAfter, total };
    }

    async distributeToRoom(command = {}) {
        const repository = this.ensureRepository();
        const roomId = this.requireRoomId(command.roomId);
        const calculation = command.total !== undefined
            ? {
                total: this.requirePositiveInteger(command.total, "total"),
                students: this.requirePositiveInteger(command.students, "students"),
                days: this.requirePositiveInteger(command.days, "days"),
                perCrate: this.requirePositiveInteger(command.perCrate || 36, "perCrate")
            }
            : this.calculateDistributionTotal(command);

        if (calculation.crates === undefined) {
            calculation.crates = Math.floor(calculation.total / calculation.perCrate);
            calculation.boxes = calculation.total % calculation.perCrate;
        }

        const [rawMainStock, rawRoomStock] = await Promise.all([
            repository.loadMainStock(),
            repository.loadRoomStock(roomId)
        ]);
        const mainStockBefore = this.toNumber(rawMainStock);
        const roomStockBefore = this.toNumber(rawRoomStock);

        if (calculation.total > mainStockBefore) {
            throw this.businessError("INSUFFICIENT_MAIN_STOCK", "Main Stock is insufficient for this classroom distribution.");
        }

        const mainStockAfter = mainStockBefore - calculation.total;
        const roomStockAfter = roomStockBefore + calculation.total;
        const referenceId = String(command.referenceId || this.createId());
        const record = {
            ...command.record,
            id: referenceId,
            roomId,
            roomName: command.roomName || command.record?.roomName || roomId,
            students: calculation.students,
            days: calculation.days,
            total: calculation.total,
            crates: calculation.crates,
            boxes: calculation.boxes,
            stockBefore: mainStockBefore,
            stockAfter: mainStockAfter,
            roomStockBefore,
            roomStockAfter,
            createdAt: command.record?.createdAt || this.nowIso()
        };
        const ledger = this.buildLedgerEntry({
            roomId,
            type: "DISTRIBUTE",
            quantity: calculation.total,
            stockBefore: roomStockBefore,
            stockAfter: roomStockAfter,
            source: command.source || "admin",
            user: command.user || "admin",
            referenceId
        });

        await repository.applyMultiLocationUpdate({
            stock: mainStockAfter,
            [`roomStock/${roomId}`]: roomStockAfter,
            [`distributes/${referenceId}`]: record,
            [`stockTransactions/${ledger.id}`]: ledger
        });

        return {
            record,
            ledger,
            mainStockBefore,
            mainStockAfter,
            roomStockBefore,
            roomStockAfter
        };
    }

    async consumeRoomStock(command = {}) {
        const repository = this.ensureRepository();
        const roomId = this.requireRoomId(command.roomId);
        const quantity = this.requirePositiveInteger(command.quantity, "quantity");
        const type = String(command.type || "").toUpperCase();

        if (!this.allowedRoomConsumptionTypes.has(type)) {
            throw this.businessError("INVALID_STOCK_TYPE", "Room Stock can only be consumed by attendance, pending, retroactive, or vacation operations.");
        }

        const roomStockBefore = this.toNumber(await repository.loadRoomStock(roomId));
        const roomStockAfter = roomStockBefore - quantity;
        const referenceId = String(command.referenceId || this.createId());
        const ledger = this.buildLedgerEntry({
            roomId,
            type,
            quantity: -quantity,
            stockBefore: roomStockBefore,
            stockAfter: roomStockAfter,
            source: command.source || "teacher",
            user: command.user || "teacher",
            referenceId
        });
        const updates = {
            [`roomStock/${roomId}`]: roomStockAfter,
            [`stockTransactions/${ledger.id}`]: ledger
        };

        if (command.recordPath) {
            updates[String(command.recordPath).replace(/^\/+/, "")] = command.record ?? null;
        }

        await repository.applyMultiLocationUpdate(updates);

        return { ledger, roomStockBefore, roomStockAfter, quantity, type, referenceId };
    }

    async rollbackRoomStock(command = {}) {
        const repository = this.ensureRepository();
        const roomId = this.requireRoomId(command.roomId);
        const quantity = this.requirePositiveInteger(command.quantity, "quantity");
        const roomStockBefore = this.toNumber(await repository.loadRoomStock(roomId));
        const roomStockAfter = roomStockBefore + quantity;
        const referenceId = String(command.referenceId || "");
        const ledger = this.buildLedgerEntry({
            roomId,
            type: "ROLLBACK",
            quantity,
            stockBefore: roomStockBefore,
            stockAfter: roomStockAfter,
            source: command.source || "teacher",
            user: command.user || "teacher",
            referenceId
        });
        const updates = {
            [`roomStock/${roomId}`]: roomStockAfter,
            [`stockTransactions/${ledger.id}`]: ledger
        };

        if (command.recordPath) {
            updates[String(command.recordPath).replace(/^\/+/, "")] = null;
        }

        await repository.applyMultiLocationUpdate(updates);

        return { ledger, roomStockBefore, roomStockAfter, quantity, referenceId };
    }

    async rebuildAndPersist(snapshot = null) {
        const repository = this.ensureRepository();
        const source = snapshot || await repository.loadStockSnapshot();
        const main = this.calculateMainStock(source);
        const roomBreakdown = this.calculateRoomStock(source);
        const updates = { stock: main.expected };

        Object.values(roomBreakdown).forEach(room => {
            updates[`roomStock/${room.roomId}`] = room.expected;
        });

        await repository.applyMultiLocationUpdate(updates);

        return {
            stock: main.expected,
            roomStock: Object.fromEntries(
                Object.values(roomBreakdown).map(room => [room.roomId, room.expected])
            ),
            main,
            rooms: roomBreakdown
        };
    }
}

window.StockService = new StockService();
