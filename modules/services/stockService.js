class StockService {
    constructor(repository = window.StockRepository, options = {}) {
        this.repository = repository;
        this.clock = options.clock || (() => new Date());
        this.idFactory = options.idFactory || (() => (
            Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
        ));
        this.distributionLockTtlMs = Number(options.distributionLockTtlMs) || 120_000;
        this.receiptLockTtlMs = Number(options.receiptLockTtlMs) || 120_000;
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

    async acquireReceiptLock(operationId) {
        const repository = this.ensureRepository();
        if (!repository.loadReceiptLockVersioned || !repository.setReceiptLockIfMatch) {
            throw this.businessError(
                "RECEIPT_CONCURRENCY_UNAVAILABLE",
                "Milk receipt concurrency protection is unavailable."
            );
        }
        const snapshot = await repository.loadReceiptLockVersioned();
        const current = snapshot?.value;
        const now = this.clock();
        const expiresAt = current?.expiresAt ? new Date(current.expiresAt) : null;
        if (current?.owner && expiresAt && expiresAt.getTime() > now.getTime()) {
            throw this.businessError(
                "RECEIPT_LOCKED",
                "Another milk receipt is currently being changed."
            );
        }
        const lock = {
            owner: operationId,
            acquiredAt: now.toISOString(),
            expiresAt: new Date(now.getTime() + this.receiptLockTtlMs).toISOString()
        };
        const write = await repository.setReceiptLockIfMatch(lock, snapshot?.etag);
        if (write?.status !== "ok") {
            throw this.businessError(
                "RECEIPT_LOCKED",
                "Another milk receipt changed the Main Stock first."
            );
        }
        return lock;
    }

    async adjustReceiptGuarded(command = {}) {
        const repository = this.ensureRepository();
        const operationId = String(command.operationId || "").trim();
        const referenceId = String(command.referenceId || "").trim();
        const action = String(command.action || "edit").trim().toLowerCase();
        if (!operationId) {
            throw this.businessError("RECEIPT_OPERATION_REQUIRED", "A receipt operation id is required.");
        }
        if (!referenceId) {
            throw this.businessError("RECEIPT_REFERENCE_REQUIRED", "A receipt reference id is required.");
        }
        if (!new Set(["edit", "delete"]).has(action)) {
            throw this.businessError("RECEIPT_ACTION_INVALID", "Receipt action must be edit or delete.");
        }

        await this.acquireReceiptLock(operationId);
        try {
            const versioned = await repository.loadReceiptWithEtag(referenceId);
            const current = versioned?.value;
            if (!current || typeof current !== "object") {
                throw this.businessError("RECEIPT_NOT_FOUND", "Milk receipt was not found.");
            }
            const expectedEtag = String(command.expectedEtag || "").trim();
            if (expectedEtag && expectedEtag !== String(versioned.etag || "")) {
                throw this.businessError(
                    "RECEIPT_CONFLICT",
                    "Milk receipt changed after it was opened. Reload it before saving."
                );
            }

            const previousTotal = this.requirePositiveInteger(current.total, "previousTotal");
            const nextTotal = action === "delete"
                ? 0
                : this.requirePositiveInteger(command.record?.total, "total");
            const stockBefore = this.toNumber(await repository.loadMainStock());
            const delta = nextTotal - previousTotal;
            const stockAfter = stockBefore + delta;
            if (stockAfter < 0) {
                throw this.businessError(
                    "INSUFFICIENT_MAIN_STOCK_FOR_RECEIPT_CHANGE",
                    "Main Stock is too low to reduce or delete this receipt."
                );
            }

            const now = this.nowIso();
            const nextRecord = action === "delete" ? null : {
                ...current,
                ...command.record,
                id: referenceId,
                total: nextTotal,
                createdAt: current.createdAt || now,
                updatedAt: now
            };
            const ledger = this.buildLedgerEntry({
                type: action === "delete" ? "RECEIVE_DELETE" : "RECEIVE_EDIT",
                quantity: delta,
                stockBefore,
                stockAfter,
                source: command.source || "admin",
                user: command.user || "admin",
                referenceId
            });
            ledger.previousTotal = previousTotal;
            ledger.nextTotal = nextTotal;
            ledger.operationId = operationId;

            await repository.applyReceiptUpdate({
                stock: stockAfter,
                [`receives/${referenceId}`]: nextRecord,
                [`stockTransactions/${ledger.id}`]: ledger
            });
            return {
                action,
                record: nextRecord,
                ledger,
                delta,
                stockBefore,
                stockAfter,
                previousTotal,
                nextTotal
            };
        } finally {
            if (repository.releaseReceiptLock) {
                await repository.releaseReceiptLock(operationId).catch(() => {});
            }
        }
    }

    async receiveMilkGuarded(command = {}) {
        const repository = this.ensureRepository();
        const operationId = String(command.operationId || "").trim();
        if (!operationId) {
            throw this.businessError("RECEIPT_OPERATION_REQUIRED", "A receipt operation id is required.");
        }
        await this.acquireReceiptLock(operationId);
        try {
            return await this.receiveMilk(command);
        } finally {
            if (repository.releaseReceiptLock) {
                await repository.releaseReceiptLock(operationId).catch(() => {});
            }
        }
    }

    normalizeDistributionCommand(command = {}) {
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

        return { roomId, calculation };
    }

    async prepareDistribution(command = {}) {
        const repository = this.ensureRepository();
        const { roomId, calculation } = this.normalizeDistributionCommand(command);

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

        const updates = {
            stock: mainStockAfter,
            [`roomStock/${roomId}`]: roomStockAfter,
            [`distributes/${referenceId}`]: record,
            [`stockTransactions/${ledger.id}`]: ledger
        };

        return {
            result: {
                record,
                ledger,
                mainStockBefore,
                mainStockAfter,
                roomStockBefore,
                roomStockAfter
            },
            updates
        };
    }

    async distributeToRoom(command = {}) {
        const repository = this.ensureRepository();
        const prepared = await this.prepareDistribution(command);
        await repository.applyMultiLocationUpdate(prepared.updates);
        return prepared.result;
    }

    distributionFingerprint(command = {}, normalized = this.normalizeDistributionCommand(command)) {
        return [
            normalized.roomId,
            String(command.record?.date || command.date || ""),
            normalized.calculation.students,
            normalized.calculation.days,
            normalized.calculation.total
        ].join("|");
    }

    async acquireDistributionLock(operationId) {
        const repository = this.ensureRepository();
        if (!repository.loadDistributionLockVersioned || !repository.setDistributionLockIfMatch) {
            throw this.businessError(
                "DISTRIBUTION_CONCURRENCY_UNAVAILABLE",
                "Classroom distribution concurrency protection is unavailable."
            );
        }
        const snapshot = await repository.loadDistributionLockVersioned();
        const current = snapshot?.value;
        const now = this.clock();
        const expiresAt = current?.expiresAt ? new Date(current.expiresAt) : null;
        if (current?.owner && expiresAt && expiresAt.getTime() > now.getTime()) {
            throw this.businessError(
                "DISTRIBUTION_LOCKED",
                "Another classroom distribution is currently being saved."
            );
        }
        const lock = {
            owner: operationId,
            acquiredAt: now.toISOString(),
            expiresAt: new Date(now.getTime() + this.distributionLockTtlMs).toISOString()
        };
        const write = await repository.setDistributionLockIfMatch(lock, snapshot?.etag);
        if (write?.status !== "ok") {
            throw this.businessError(
                "DISTRIBUTION_LOCKED",
                "Another classroom distribution changed the stock first."
            );
        }
        return lock;
    }

    async distributeToRoomGuarded(command = {}) {
        const repository = this.ensureRepository();
        const operationId = String(command.operationId || "").trim();
        if (!operationId) {
            throw this.businessError(
                "DISTRIBUTION_OPERATION_REQUIRED",
                "A classroom distribution operation id is required."
            );
        }
        const normalized = this.normalizeDistributionCommand(command);
        const fingerprint = this.distributionFingerprint(command, normalized);
        await this.acquireDistributionLock(operationId);

        try {
            const completed = await repository.loadDistributionCommand(operationId);
            if (completed) {
                if (String(completed.fingerprint || "") !== fingerprint) {
                    throw this.businessError(
                        "DISTRIBUTION_OPERATION_MISMATCH",
                        "This operation id was already used for a different classroom distribution."
                    );
                }
                return { ...(completed.result || {}), operationId, idempotent: true };
            }

            const prepared = await this.prepareDistribution(command);
            const commandRecord = {
                id: operationId,
                status: "completed",
                fingerprint,
                referenceId: prepared.result.record.id,
                completedAt: this.nowIso(),
                result: prepared.result
            };
            await repository.applyDistributionUpdate(
                prepared.updates,
                operationId,
                commandRecord
            );
            return { ...prepared.result, operationId, idempotent: false };
        } finally {
            if (repository.releaseDistributionLock) {
                await repository.releaseDistributionLock(operationId).catch(() => {});
            }
        }
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
