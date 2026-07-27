/**
 * MilkSchoolSystem V2
 * Firebase Realtime Database runtime configuration.
 *
 * Keep credentials and school-specific values outside application modules.
 * databaseURL may be overridden at runtime through ConfigManager.
 */
window.firebaseConfig = Object.freeze({
    databaseURL: "",
    authToken: "",
    requestTimeoutMs: 15000
});
