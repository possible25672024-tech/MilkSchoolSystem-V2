class LegacyReadOnlyGuard {
    constructor() {
        this.active = Boolean(
            window.APP_CONFIG?.legacyReadOnly === true ||
            window.APP_CONFIG?.mode === "LEGACY_READ_ONLY"
        );
    }

    async install() {
        if (!this.active) {
            return;
        }

        this.injectStyles();
        this.renderBanner();
        this.disableActions();
        this.hideSyncControls();
    }

    injectStyles() {
        if (document.getElementById("legacy-readonly-style")) {
            return;
        }

        const style = document.createElement("style");
        style.id = "legacy-readonly-style";
        style.textContent = `
            .legacy-readonly-banner {
                position: sticky;
                top: 0;
                z-index: 9999;
                background: #b91c1c;
                color: #ffffff;
                padding: 12px 16px;
                font-size: 0.95rem;
                font-weight: 700;
                text-align: center;
                box-shadow: inset 0 -2px 0 rgba(0,0,0,0.1);
            }

            .legacy-readonly-disabled {
                pointer-events: none !important;
                opacity: 0.55 !important;
                cursor: not-allowed !important;
            }

            .legacy-readonly [data-admin-menu="backup-restore"],
            .legacy-readonly #sync-panel,
            .legacy-readonly .sync-panel,
            .legacy-readonly .sync-actions,
            .legacy-readonly .admin-system-tools {
                display: none !important;
            }
        `;

        document.head.appendChild(style);
    }

    renderBanner() {
        const body = document.body || document.documentElement;

        if (!body || document.getElementById("legacy-readonly-banner")) {
            return;
        }

        const banner = document.createElement("div");
        banner.id = "legacy-readonly-banner";
        banner.className = "legacy-readonly-banner";
        banner.textContent =
            "READ-ONLY — กำลังดูฐานข้อมูลเก่า ห้ามบันทึกข้อมูล";

        body.insertBefore(banner, body.firstChild);
        body.classList.add("legacy-readonly");
    }

    disableActions() {
        const elements = Array.from(
            document.querySelectorAll(
                "button, input[type='button'], input[type='submit'], input[type='reset'], a, [role='button']"
            )
        );

        const keywords = [
            "เพิ่ม",
            "แก้ไข",
            "ลบ",
            "รับนม",
            "จ่ายนม",
            "เช็กชื่อ",
            "Import",
            "Restore",
            "Sync",
            "ซิงก์",
            "บันทึก",
            "Save",
            "Upload",
            "Backup"
        ];

        for (const element of elements) {
            if (this.matchesAction(element, keywords)) {
                this.disableElement(element);
            }
        }
    }

    matchesAction(element, keywords) {
        const text = String(
            element.innerText ||
            element.value ||
            element.getAttribute("aria-label") ||
            element.title ||
            element.id ||
            element.className ||
            ""
        )
            .trim()
            .toLowerCase();

        return keywords.some(keyword =>
            text.includes(String(keyword).toLowerCase())
        );
    }

    disableElement(element) {
        if (typeof element.disabled === "boolean") {
            element.disabled = true;
        }

        element.classList.add("legacy-readonly-disabled");
        element.setAttribute("aria-disabled", "true");

        if (element.tagName.toLowerCase() === "a") {
            element.addEventListener(
                "click",
                event => event.preventDefault(),
                { capture: true }
            );
        }
    }

    hideSyncControls() {
        const selectors = [
            "#sync-panel",
            "#sync-retry-button",
            "[data-admin-menu='backup-restore']",
            "[data-admin-menu*='restore']",
            "[data-admin-menu*='sync']"
        ];

        for (const selector of selectors) {
            const node = document.querySelector(selector);

            if (node) {
                node.hidden = true;
            }
        }
    }
}

window.LegacyReadOnlyGuard = new LegacyReadOnlyGuard();


class Bootstrap {
    constructor() {
        this.startPromise = null;
    }

    start() {
        if (!this.startPromise) {
            this.startPromise = this.run();
        }

        return this.startPromise;
    }

    async run() {
        try {
            await window.loadFirebaseLocalConfig?.();
            await window.LegacyReadOnlyGuard?.install?.();

            const firebaseConfig =
                window.ConfigManager?.getFirebaseConfig?.() || {};

            const appConfig =
                window.ConfigManager?.getAppConfig?.() ||
                window.APP_CONFIG ||
                {};

            const offlineReadOnly =
                String(appConfig.mode || "")
                    .trim()
                    .toUpperCase() === "OFFLINE_READ_ONLY";

            const shouldInitializeFirebase = !offlineReadOnly;

            if (shouldInitializeFirebase) {
                await window.FirebaseService.initialize(firebaseConfig);

                if (!window.FirebaseAuthService?.initialize) {
                    throw new Error(
                        "Firebase Authentication service is not available."
                    );
                }

                window.FirebaseAuthService.initialize(
                    firebaseConfig,
                    window.FirebaseService
                );

                if (window.FirebaseAuthService.isConfigured?.()) {
                    await window.FirebaseAuthService.restoreAuth();
                }
            } else {
                if (!window.FirebaseService?.initializeOffline) {
                    throw new Error(
                        "Offline Firebase service is not available."
                    );
                }

                await window.FirebaseService.initializeOffline(
                    appConfig.offlineBackupURL
                );

                const banner = document.getElementById(
                    "offline-read-only-banner"
                );

                if (banner) {
                    banner.hidden = false;
                }
            }

            if (!window.App?.start) {
                throw new Error(
                    "Application start method is not available."
                );
            }

            await window.App.start();
        } catch (error) {
            console.error(
                "MilkSchoolSystem V2 bootstrap failed.",
                error
            );

            this.renderFatalError(error);
            throw error;
        }
    }

    renderFatalError(error) {
        const errorElement =
            document.getElementById("bootstrap-error");

        if (!errorElement) {
            return;
        }

        errorElement.textContent =
            `เริ่มระบบไม่สำเร็จ: ${error.message}`;

        errorElement.hidden = false;
    }
}

window.Bootstrap = new Bootstrap();


window.addEventListener(
    "DOMContentLoaded",
    () => {
        window.Bootstrap.start().catch(() => {});
    },
    { once: true }
);