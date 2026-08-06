/**
 * MilkSchoolSystem V2
 * Firebase Realtime Database runtime configuration.
 *
 * This default URL matches the current production database used by the
 * protected legacy pages. It can still be overridden at runtime through
 * ConfigManager without changing application modules.
 */
window.firebaseConfig = Object.freeze({
    databaseURL: "https://realtime-database-9fc52-default-rtdb.asia-southeast1.firebasedatabase.app",
    requestTimeoutMs: 15000,
    auth: Object.freeze({
        mode: "firebase-email-password",
        apiKey: "",
        identityToolkitURL: "https://identitytoolkit.googleapis.com/v1",
        secureTokenURL: "https://securetoken.googleapis.com/v1",
        refreshSkewSeconds: 120
    })
});

window.loadFirebaseLocalConfig = async function () {
    try {
        const response = await fetch("config/firebase-local.js", { cache: "no-store" });
        if (!response.ok) {
            return;
        }

        const scriptText = await response.text();
        const script = document.createElement("script");
        script.type = "text/javascript";
        script.textContent = scriptText;
        document.head.appendChild(script);
    } catch (error) {
        console.warn("Firebase local config loader failed.", error);
    }
};
