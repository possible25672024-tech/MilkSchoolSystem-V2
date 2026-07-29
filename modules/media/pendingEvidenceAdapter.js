class PendingEvidenceAdapter {
    constructor(options = {}) {
        this.window = options.window || window;
        this.installed = false;
    }

    install() {
        const evidenceManager = this.window.PendingEvidenceManager;
        const pendingMilkManager = this.window.PendingMilkManager;
        const pendingMilkService = this.window.PendingMilkService;
        if (!evidenceManager?.buildLegacyEvidence || !pendingMilkManager?.issue || !pendingMilkService?.buildRecord) {
            throw new Error("Pending Evidence dependencies are not available.");
        }
        this.patchPendingMilkService(pendingMilkService);
        this.patchPendingMilkManager(pendingMilkManager, evidenceManager);
        this.installed = Boolean(
            pendingMilkService.__pendingEvidencePatched &&
            pendingMilkManager.__pendingEvidencePatched
        );
        return this.getStatus();
    }

    patchPendingMilkService(pendingMilkService) {
        if (pendingMilkService.__pendingEvidencePatched) return pendingMilkService;
        const originalBuildRecord = pendingMilkService.buildRecord.bind(pendingMilkService);
        pendingMilkService.buildRecord = (session, state, selectedPairs, input = {}) => {
            const result = originalBuildRecord(session, state, selectedPairs, input);
            result.record.photos = Array.isArray(input.photos) ? [...input.photos] : [];
            result.record.signature = typeof input.signature === "string" ? input.signature : "";
            result.record.signatures = input.signatures && typeof input.signatures === "object" && !Array.isArray(input.signatures)
                ? Object.fromEntries(Object.entries(input.signatures).map(([key, value]) => [key, {
                    sig: String(value?.sig || value?.signature || ""),
                    receiverName: String(value?.receiverName || "")
                }]))
                : {};
            return result;
        };
        pendingMilkService.__pendingEvidencePatched = true;
        return pendingMilkService;
    }

    patchPendingMilkManager(pendingMilkManager, evidenceManager) {
        if (pendingMilkManager.__pendingEvidencePatched) return pendingMilkManager;
        const originalIssue = pendingMilkManager.issue.bind(pendingMilkManager);
        pendingMilkManager.issue = async input => {
            const evidence = await evidenceManager.buildLegacyEvidence(input?.selectedPairs || []);
            const result = await originalIssue({
                ...input,
                photos: evidence.photos,
                signature: evidence.signature,
                signatures: evidence.signatures
            });
            if (result?.record || result?.recordId || result?.id) evidenceManager.markSaved?.();
            return result;
        };
        pendingMilkManager.__pendingEvidencePatched = true;
        return pendingMilkManager;
    }

    getStatus() {
        return {
            installed: this.installed,
            pendingMilkService: Boolean(this.window.PendingMilkService?.__pendingEvidencePatched),
            pendingMilkManager: Boolean(this.window.PendingMilkManager?.__pendingEvidencePatched)
        };
    }
}

window.PendingEvidenceAdapterClass = PendingEvidenceAdapter;
window.PendingEvidenceAdapter = new PendingEvidenceAdapter();
