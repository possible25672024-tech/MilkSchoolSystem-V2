class PendingEvidenceAdapter {
    constructor(options = {}) {
        this.window = options.window || window;
        this.installed = false;
    }

    install() {
        const evidenceManager = this.window.PendingEvidenceManager;
        const pendingMilkManager = this.window.PendingMilkManager;
        if (!evidenceManager?.buildLegacyEvidence || !pendingMilkManager?.issue) {
            throw new Error("Pending Evidence dependencies are not available.");
        }
        if (!pendingMilkManager.__pendingEvidencePatched) {
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
        }
        this.installed = Boolean(pendingMilkManager.__pendingEvidencePatched);
        return this.getStatus();
    }

    getStatus() {
        return {
            installed: this.installed,
            pendingMilkManager: Boolean(this.window.PendingMilkManager?.__pendingEvidencePatched)
        };
    }
}

window.PendingEvidenceAdapterClass = PendingEvidenceAdapter;
window.PendingEvidenceAdapter = new PendingEvidenceAdapter();
