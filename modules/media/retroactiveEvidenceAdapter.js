class RetroactiveEvidenceAdapter {
    constructor(options = {}) {
        this.window = options.window || window;
        this.installed = false;
    }

    install() {
        const evidenceManager = this.window.RetroactiveEvidenceManager;
        const retroactiveMilkManager = this.window.RetroactiveMilkManager;
        const retroactiveMilkService = this.window.RetroactiveMilkService;
        if (!evidenceManager?.buildLegacyEvidence || !retroactiveMilkManager?.issue || !retroactiveMilkService?.buildRecord) {
            throw new Error("Retroactive Evidence dependencies are not available.");
        }
        this.patchService(retroactiveMilkService);
        this.patchManager(retroactiveMilkManager, evidenceManager);
        this.installed = Boolean(
            retroactiveMilkService.__retroactiveEvidencePatched &&
            retroactiveMilkManager.__retroactiveEvidencePatched
        );
        return this.getStatus();
    }

    patchService(service) {
        if (service.__retroactiveEvidencePatched) return service;
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
        service.__retroactiveEvidencePatched = true;
        return service;
    }

    patchManager(manager, evidenceManager) {
        if (manager.__retroactiveEvidencePatched) return manager;
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
        manager.__retroactiveEvidencePatched = true;
        return manager;
    }

    getStatus() {
        return {
            installed: this.installed,
            retroactiveMilkService: Boolean(this.window.RetroactiveMilkService?.__retroactiveEvidencePatched),
            retroactiveMilkManager: Boolean(this.window.RetroactiveMilkManager?.__retroactiveEvidencePatched)
        };
    }
}

window.RetroactiveEvidenceAdapterClass = RetroactiveEvidenceAdapter;
window.RetroactiveEvidenceAdapter = new RetroactiveEvidenceAdapter();