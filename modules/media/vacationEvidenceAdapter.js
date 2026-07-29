class VacationEvidenceAdapter {
    constructor(options = {}) {
        this.window = options.window || window;
        this.installed = false;
    }

    install() {
        const evidenceManager = this.window.VacationEvidenceManager;
        const vacationMilkManager = this.window.VacationMilkManager;
        const vacationMilkService = this.window.VacationMilkService;
        if (!evidenceManager?.buildLegacyEvidence || !vacationMilkManager?.issue || !vacationMilkService?.buildRecord) {
            throw new Error("Vacation Evidence dependencies are not available.");
        }
        this.patchService(vacationMilkService);
        this.patchManager(vacationMilkManager, evidenceManager);
        this.installed = Boolean(
            vacationMilkService.__vacationEvidencePatched &&
            vacationMilkManager.__vacationEvidencePatched
        );
        return this.getStatus();
    }

    patchService(service) {
        if (service.__vacationEvidencePatched) return service;
        const originalBuildRecord = service.buildRecord.bind(service);
        service.buildRecord = (session, preview, input = {}) => {
            const record = originalBuildRecord(session, preview, input);
            record.photos = Array.isArray(input.photos) ? [...input.photos] : [];
            record.signature = typeof input.signature === "string" ? input.signature : "";
            record.signatures = input.signatures && typeof input.signatures === "object" && !Array.isArray(input.signatures)
                ? Object.fromEntries(Object.entries(input.signatures).map(([key, value]) => [key, {
                    sig: String(value?.sig || value?.signature || ""),
                    receiverName: String(value?.receiverName || "")
                }]))
                : {};
            return record;
        };
        service.__vacationEvidencePatched = true;
        return service;
    }

    patchManager(manager, evidenceManager) {
        if (manager.__vacationEvidencePatched) return manager;
        const originalIssue = manager.issue.bind(manager);
        manager.issue = async input => {
            const evidence = await evidenceManager.buildLegacyEvidence();
            const result = await originalIssue({
                ...input,
                photos: evidence.photos,
                signature: evidence.signature,
                signatures: evidence.signatures
            });
            if (result?.record || result?.recordId || result?.id) evidenceManager.markSaved?.();
            return result;
        };
        manager.__vacationEvidencePatched = true;
        return manager;
    }

    getStatus() {
        return {
            installed: this.installed,
            vacationMilkService: Boolean(this.window.VacationMilkService?.__vacationEvidencePatched),
            vacationMilkManager: Boolean(this.window.VacationMilkManager?.__vacationEvidencePatched)
        };
    }
}

window.VacationEvidenceAdapterClass = VacationEvidenceAdapter;
window.VacationEvidenceAdapter = new VacationEvidenceAdapter();