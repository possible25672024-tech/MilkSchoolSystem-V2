class AttendanceEvidenceAdapter {
    constructor(options = {}) {
        this.window = options.window || window;
        this.installed = false;
    }

    install() {
        const manager = this.window.AttendanceEvidenceManager;
        const attendanceManager = this.window.AttendanceManager;
        const syncService = this.window.SyncService;
        if (!manager?.buildLegacyEvidence || !manager?.hydrateQueueRecord) {
            throw new Error("AttendanceEvidenceManager is not available.");
        }
        this.patchAttendanceManager(attendanceManager, manager);
        this.patchSyncService(syncService, manager);
        this.installed = Boolean(attendanceManager?.__attendanceEvidencePatched && syncService?.__attendanceEvidencePatched);
        return this.getStatus();
    }

    patchAttendanceManager(attendanceManager, evidenceManager) {
        if (!attendanceManager?.save || attendanceManager.__attendanceEvidencePatched) return attendanceManager;
        const originalSave = attendanceManager.save.bind(attendanceManager);
        attendanceManager.save = async input => {
            const evidence = await evidenceManager.buildLegacyEvidence();
            const result = await originalSave({
                ...input,
                photos: evidence.photos,
                signature: evidence.signature
            });
            if (result?.record) evidenceManager.markSaved?.(result.record);
            return result;
        };
        attendanceManager.__attendanceEvidencePatched = true;
        return attendanceManager;
    }

    patchSyncService(syncService, evidenceManager) {
        if (!syncService?.queueAttendance || !syncService?.replayEntry || syncService.__attendanceEvidencePatched) {
            return syncService;
        }
        const originalQueueAttendance = syncService.queueAttendance.bind(syncService);
        const originalReplayEntry = syncService.replayEntry.bind(syncService);

        syncService.queueAttendance = (session, input = {}) => {
            const record = input.record || input.rec;
            const safeRecord = evidenceManager.buildQueueSafeRecordSync(record);
            return originalQueueAttendance(session, { ...input, record: safeRecord, rec: undefined });
        };

        syncService.replayEntry = async (session, entry) => {
            if (entry?.type !== "attendance") return originalReplayEntry(session, entry);
            const hydratedRecord = await evidenceManager.hydrateQueueRecord(entry.record || {});
            return originalReplayEntry(session, { ...entry, record: hydratedRecord });
        };

        syncService.__attendanceEvidencePatched = true;
        return syncService;
    }

    getStatus() {
        return {
            installed: this.installed,
            attendanceManager: Boolean(this.window.AttendanceManager?.__attendanceEvidencePatched),
            syncService: Boolean(this.window.SyncService?.__attendanceEvidencePatched)
        };
    }
}

window.AttendanceEvidenceAdapterClass = AttendanceEvidenceAdapter;
window.AttendanceEvidenceAdapter = new AttendanceEvidenceAdapter();
