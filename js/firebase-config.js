// =========================================================
// VYRO — FIREBASE CONFIGURATION
// Firebase Authentication + Firestore
// =========================================================

(function () {

    "use strict";

    // ---------------------------------------------------------
    // Firebase Web App Configuration
    // ---------------------------------------------------------

    const FIREBASE_CONFIG = {

        apiKey: "AIzaSyAt_KQ3RqV6JJOk6rS_7wDIQV2V7yg7bhg",

        authDomain:
            "vyro-104df.firebaseapp.com",

        projectId:
            "vyro-104df",

        storageBucket:
            "vyro-104df.firebasestorage.app",

        messagingSenderId:
            "842493262222",

        appId:
            "1:842493262222:web:115d699a41f09cb7c74cdf"
    };

    // ---------------------------------------------------------
    // Firebase State
    // ---------------------------------------------------------

    let firebaseApp = null;
    let firebaseAuth = null;
    let firebaseDb = null;
    let initialized = false;

    // ---------------------------------------------------------
    // Configuration Check
    // ---------------------------------------------------------

    function isConfigured() {

        return Boolean(
            FIREBASE_CONFIG.apiKey &&
            FIREBASE_CONFIG.authDomain &&
            FIREBASE_CONFIG.projectId &&
            FIREBASE_CONFIG.appId
        );
    }

    // ---------------------------------------------------------
    // Initialize Firebase
    // ---------------------------------------------------------

    function initializeFirebase() {

        if (initialized) {
                        return {
                success: true,
                auth: firebaseAuth,
                database: firebaseDb
            };

        if (!isConfigured()) {

            console.error(
                "VYRO Firebase: Configuration is incomplete."
            );

            return false;
        }

        // Firebase SDK must be loaded first.
        if (
            typeof firebase === "undefined"
        ) {

            console.error(
                "VYRO Firebase: Firebase SDK is not loaded."
            );

            return false;
        }

        try {

            // Prevent duplicate initialization.
            if (
                firebase.apps &&
                firebase.apps.length > 0
            ) {

                firebaseApp =
                    firebase.app();

            } else {

                firebaseApp =
                    firebase.initializeApp(
                        FIREBASE_CONFIG
                    );
            }

            // Firebase Authentication
            firebaseAuth =
                firebase.auth();

            // Firestore
            if (
                typeof firebase.firestore ===
                "function"
            ) {

                firebaseDb =
                    firebase.firestore();
            }

                        initialized = true;

            console.log(
                "VYRO Firebase: Initialized successfully."
            );

            return {
                success: true,
                auth: firebaseAuth,
                database: firebaseDb
            };

        } catch (error) {

            console.error(
                "VYRO Firebase: Initialization failed.",
                error
            );

            firebaseApp = null;
            firebaseAuth = null;
            firebaseDb = null;
            initialized = false;

            return false;
        }
    }

    // ---------------------------------------------------------
    // Getters
    // ---------------------------------------------------------

    function getApp() {
        return firebaseApp;
    }

    function getAuth() {
        return firebaseAuth;
    }

    function getDatabase() {
        return firebaseDb;
    }

    function isInitialized() {
        return initialized;
    }

    // ---------------------------------------------------------
    // Public API
    // ---------------------------------------------------------

    window.VYRO_FIREBASE = {

        config:
            FIREBASE_CONFIG,

        initialize:
            initializeFirebase,

        isConfigured:
            isConfigured,

        getApp:
            getApp,

        getAuth:
            getAuth,

        getDatabase:
            getDatabase,

        isInitialized:
            isInitialized
    };

    console.log(
        "VYRO Firebase: Configuration loaded."
    );

})();
