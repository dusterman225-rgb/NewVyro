/* =========================================================
   VYRO — AUTHENTICATION SYSTEM
   New Build / Authentication Foundation
   ========================================================= */

(function () {
    "use strict";


    /* =======================================================
       STATE
       ======================================================= */

    let initialized = false;
    let currentUser = null;
    let authListener = null;


    /* =======================================================
       SHORTCUTS
       ======================================================= */

    const CONFIG =
        window.VYRO_CONFIG || {};

    const HELPERS =
        window.VYRO_CONFIG_HELPERS || {};

    const FIREBASE =
        window.VYRO_FIREBASE || null;


    /* =======================================================
       STORAGE
       ======================================================= */

    const STORAGE = (
        CONFIG.storage || {}
    );


    function storageKey(name, fallback) {

        return STORAGE[name] || fallback;
    }


    function saveLocal(key, value) {

        try {

            localStorage.setItem(
                key,
                JSON.stringify(value)
            );

        } catch (error) {

            console.error(
                "VYRO: Could not save local data.",
                error
            );
        }
    }


    function getLocal(key) {

        try {

            const value =
                localStorage.getItem(key);

            if (!value) {
                return null;
            }

            return JSON.parse(value);

        } catch (error) {

            console.error(
                "VYRO: Could not read local data.",
                error
            );

            return null;
        }
    }


    function removeLocal(key) {

        try {

            localStorage.removeItem(key);

        } catch (error) {

            console.error(
                "VYRO: Could not remove local data.",
                error
            );
        }
    }


    /* =======================================================
       UI HELPERS
       ======================================================= */

    function getElement(id) {

        return document.getElementById(id);
    }


    function showScreen(screenId) {

        const screens =
            document.querySelectorAll(".screen");

        screens.forEach(function (screen) {

            screen.classList.remove("active");

        });


        const target =
            getElement(screenId);

        if (target) {

            target.classList.add("active");

            window.scrollTo(
                0,
                0
            );
        }
    }


    function setStatus(
        elementId,
        message,
        type
    ) {

        const element =
            getElement(elementId);

        if (!element) {
            return;
        }


        element.textContent =
            message || "";


        element.className =
            "form-status";


        if (type) {

            element.classList.add(
                type
            );
        }
    }


    function setButtonLoading(
        button,
        loading,
        normalText
    ) {

        if (!button) {
            return;
        }


        if (loading) {

            button.disabled = true;

            button.dataset.originalText =
                button.textContent;

            button.textContent =
                "Please wait...";

        } else {

            button.disabled = false;

            button.textContent =
                button.dataset.originalText ||
                normalText ||
                button.textContent;
        }
    }


    function showToast(message) {

        const toast =
            getElement("toast");

        const messageElement =
            getElement("toast-message");


        if (!toast || !messageElement) {
            return;
        }


        messageElement.textContent =
            message;


        toast.classList.add(
            "show"
        );


        const duration =
            CONFIG.ui &&
            CONFIG.ui.toastDuration
                ? CONFIG.ui.toastDuration
                : 3500;


        window.setTimeout(
            function () {

                toast.classList.remove(
                    "show"
                );

            },
            duration
        );
    }


    /* =======================================================
       ERROR TRANSLATION
       ======================================================= */

    function firebaseErrorMessage(error) {

        if (!error) {

            return "Something went wrong. Please try again.";
        }


        const code =
            error.code || "";


        switch (code) {

            case "auth/email-already-in-use":
                return "That email address is already registered.";

            case "auth/invalid-email":
                return "Please enter a valid email address.";

            case "auth/weak-password":
                return "Your password is too weak.";

            case "auth/user-not-found":
                return "No VYRO account was found with that email.";

            case "auth/wrong-password":
                return "The email or password is incorrect.";

            case "auth/invalid-credential":
                return "The email or password is incorrect.";

            case "auth/too-many-requests":
                return "Too many attempts. Please wait and try again.";

            case "auth/network-request-failed":
                return "A network error occurred. Check your connection.";

            case "auth/user-disabled":
                return "This account has been disabled.";

            case "auth/requires-recent-login":
                return "Please log in again before performing this action.";

            default:

                return (
                    error.message ||
                    "Something went wrong. Please try again."
                );
        }
    }


    /* =======================================================
       FIREBASE AVAILABILITY
       ======================================================= */

    function firebaseReady() {

        if (!FIREBASE) {
            return false;
        }


        if (
            typeof FIREBASE.isConfigured !==
            "function"
        ) {
            return false;
        }


        if (!FIREBASE.isConfigured()) {
            return false;
        }


        if (
            typeof firebase ===
            "undefined"
        ) {
            return false;
        }


        return true;
    }


    function getAuth() {

        if (!FIREBASE) {
            return null;
        }


        return FIREBASE.getAuth();
    }


    /* =======================================================
       FIREBASE INITIALIZATION
       ======================================================= */

    function initialize() {

        if (initialized) {
            return true;
        }


        if (!firebaseReady()) {

            console.warn(
                "VYRO Auth: Firebase is not ready yet."
            );

            return false;
        }


        try {

            const result =
                FIREBASE.initialize();


            if (
                !result ||
                result.success !== true
            ) {

                return false;
            }


            const auth =
                result.auth;


            if (!auth) {

                console.error(
                    "VYRO Auth: Firebase Auth is unavailable."
                );

                return false;
            }


            /*
             * Listen for Firebase authentication changes.
             */

            authListener =
                auth.onAuthStateChanged(
                    handleAuthStateChanged
                );


            initialized = true;


            console.log(
                "VYRO Auth: initialized successfully."
            );


            return true;

        } catch (error) {

            console.error(
                "VYRO Auth initialization error:",
                error
            );

            return false;
        }
    }


    /* =======================================================
       AUTH STATE
       ======================================================= */

    function handleAuthStateChanged(user) {

        currentUser =
            user || null;


        if (!user) {

            return;
        }


        saveLocal(
            storageKey(
                "email",
                "vyro_email"
            ),
            user.email || ""
        );


        saveLocal(
            storageKey(
                "authState",
                "vyro_auth_state"
            ),
            {
                authenticated: true,
                uid: user.uid,
                email: user.email || ""
            }
        );


        /*
         * We do NOT automatically send the user through
         * the application here.
         *
         * app.js will control screen routing.
         */
    }


    function getCurrentUser() {

        return currentUser;
    }


    function isLoggedIn() {

        return !!currentUser;
    }


    /* =======================================================
       USERNAME VALIDATION
       ======================================================= */

    function normalizeUsername(username) {

        if (
            HELPERS &&
            typeof HELPERS.normalizeUsername ===
            "function"
        ) {

            return HELPERS.normalizeUsername(
                username
            );
        }


        if (
            typeof username !==
            "string"
        ) {

            return "";
        }


        return username
            .trim()
            .replace(/^@+/, "")
            .toLowerCase();
    }


    function validateUsername(username) {

        const value =
            normalizeUsername(username);


        const minimum =
            CONFIG.username &&
            CONFIG.username.minimumLength
                ? CONFIG.username.minimumLength
                : 3;


        const maximum =
            CONFIG.username &&
            CONFIG.username.maximumLength
                ? CONFIG.username.maximumLength
                : 20;


        if (!value) {

            return {
                valid: false,
                message: "Enter a username."
            };
        }


        if (value.length < minimum) {

            return {
                valid: false,
                message:
                    "Username must be at least " +
                    minimum +
                    " characters."
            };
        }


        if (value.length > maximum) {

            return {
                valid: false,
                message:
                    "Username must be no more than " +
                    maximum +
                    " characters."
            };
        }


        if (
            HELPERS &&
            typeof HELPERS.isValidUsername ===
            "function"
        ) {

            if (
                !HELPERS.isValidUsername(
                    value
                )
            ) {

                return {
                    valid: false,
                    message:
                        "Use only lowercase letters, numbers, and underscores."
                };
            }

        } else {

            if (
                !/^[a-z0-9_]+$/.test(
                    value
                )
            ) {

                return {
                    valid: false,
                    message:
                        "Use only lowercase letters, numbers, and underscores."
                };
            }
        }


        return {
            valid: true,
            value: value,
            message: ""
        };
    }


    /* =======================================================
       RECOGNITION WORD VALIDATION
       ======================================================= */

    function validateRecognitionWord(word) {

        const value =
            typeof word === "string"
                ? word.trim()
                : "";


        if (!value) {

            return {
                valid: false,
                message:
                    "Enter your recognition word."
            };
        }


        if (
            HELPERS &&
            typeof HELPERS.isValidRecognitionWord ===
            "function"
        ) {

            if (
                !HELPERS.isValidRecognitionWord(
                    value
                )
            ) {

                return {
                    valid: false,
                    message:
                        "Enter a valid recognition word."
                };
            }
        }


        return {
            valid: true,
            value: value,
            message: ""
        };
    }


    /* =======================================================
       PASSWORD VALIDATION
       ======================================================= */

    function validatePassword(password) {

        if (
            typeof password !==
            "string"
        ) {

            return {
                valid: false,
                message: "Enter a password."
            };
        }


        if (password.length < 8) {

            return {
                valid: false,
                message:
                    "Password must be at least 8 characters."
            };
        }


        return {
            valid: true,
            message: ""
        };
    }


    /* =======================================================
       CREATE ACCOUNT
       ======================================================= */

    async function createAccount(data) {

        if (!data) {

            return {
                success: false,
                message: "Missing account information."
            };
        }


        const usernameResult =
            validateUsername(
                data.username
            );


        if (!usernameResult.valid) {

            return {
                success: false,
                field: "username",
                message:
                    usernameResult.message
            };
        }


        const recognitionResult =
            validateRecognitionWord(
                data.recognitionWord
            );


        if (!recognitionResult.valid) {

            return {
                success: false,
                field: "recognitionWord",
                message:
                    recognitionResult.message
            };
        }


        const passwordResult =
            validatePassword(
                data.password
            );


        if (!passwordResult.valid) {

            return {
                success: false,
                field: "password",
                message:
                    passwordResult.message
            };
        }


        if (
            data.password !==
            data.confirmPassword
        ) {

            return {
                success: false,
                field: "confirmPassword",
                message:
                    "Passwords do not match."
            };
        }


        if (!data.email) {

            return {
                success: false,
                field: "email",
                message:
                    "Enter your email address."
            };
        }


        if (
            !data.termsAccepted
        ) {

            return {
                success: false,
                field: "terms",
                message:
                    "You must accept the Terms of Service."
            };
        }


        if (!firebaseReady()) {

            return {
                success: false,
                code: "firebase-not-ready",
                message:
                    "Firebase is not connected yet. Your account cannot be created until Firebase is configured."
            };
        }


        const auth =
            getAuth();


        if (!auth) {

            return {
                success: false,
                message:
                    "Authentication service is unavailable."
            };
        }


        try {

            /*
             * Create Firebase account.
             */

            const credential =
                await auth.createUserWithEmailAndPassword(
                    data.email.trim(),
                    data.password
                );


            const user =
                credential.user;


            if (!user) {

                return {
                    success: false,
                    message:
                        "Account creation failed."
                };
            }


            currentUser =
                user;


            /*
             * Save the username locally for the current
             * browser session.
             *
             * Later auth.js will connect this to the
             * Firestore username system.
             */

            const username =
                usernameResult.value;


            saveLocal(
                storageKey(
                    "username",
                    "vyro_username"
                ),
                username
            );


            saveLocal(
                storageKey(
                    "email",
                    "vyro_email"
                ),
                user.email || data.email
            );


            saveLocal(
                storageKey(
                    "user",
                    "vyro_user"
                ),
                {
                    uid: user.uid,
                    email: user.email || data.email,
                    username: username,
                    recognitionWord:
                        recognitionResult.value
                }
            );


            saveLocal(
                storageKey(
                    "emailVerified",
                    "vyro_email_verified"
                ),
                !!user.emailVerified
            );


            /*
             * Send Firebase verification email.
             */

            try {

                await user.sendEmailVerification();

            } catch (verificationError) {

                console.warn(
                    "VYRO: Verification email could not be sent.",
                    verificationError
                );
            }


            return {
                success: true,
                user: user,
                username: username,
                email: user.email || data.email,
                emailVerified:
                    !!user.emailVerified
            };


        } catch (error) {

            console.error(
                "VYRO account creation error:",
                error
            );


            return {
                success: false,
                code: error.code || "",
                message:
                    firebaseErrorMessage(
                        error
                    )
            };
        }
    }


    /* =======================================================
       LOGIN
       ======================================================= */

    async function login(
        email,
        password
    ) {

        if (!email || !password) {

            return {
                success: false,
                message:
                    "Enter your email and password."
            };
        }


        if (!firebaseReady()) {

            return {
                success: false,
                code: "firebase-not-ready",
                message:
                    "Firebase is not connected yet. Login cannot be completed until Firebase is configured."
            };
        }


        const auth =
            getAuth();


        if (!auth) {

            return {
                success: false,
                message:
                    "Authentication service is unavailable."
            };
        }


        try {

            const credential =
                await auth.signInWithEmailAndPassword(
                    email.trim(),
                    password
                );


            currentUser =
                credential.user;


            saveLocal(
                storageKey(
                    "email",
                    "vyro_email"
                ),
                currentUser.email || email
            );


            saveLocal(
                storageKey(
                    "authState",
                    "vyro_auth_state"
                ),
                {
                    authenticated: true,
                    uid: currentUser.uid,
                    email:
                        currentUser.email ||
                        email
                }
            );


            saveLocal(
                storageKey(
                    "emailVerified",
                    "vyro_email_verified"
                ),
                !!currentUser.emailVerified
            );


            return {
                success: true,
                user: currentUser,
                emailVerified:
                    !!currentUser.emailVerified
            };


        } catch (error) {

            console.error(
                "VYRO login error:",
                error
            );


            return {
                success: false,
                code: error.code || "",
                message:
                    firebaseErrorMessage(
                        error
                    )
            };
        }
    }


    /* =======================================================
       LOGOUT
       ======================================================= */

    async function logout() {

        if (!firebaseReady()) {

            clearLocalAuthState();

            currentUser = null;

            return {
                success: true
            };
        }


        const auth =
            getAuth();


        if (!auth) {

            clearLocalAuthState();

            currentUser = null;

            return {
                success: true
            };
        }


        try {

            await auth.signOut();


            currentUser = null;


            clearLocalAuthState();


            return {
                success: true
            };


        } catch (error) {

            console.error(
                "VYRO logout error:",
                error
            );


            return {
                success: false,
                message:
                    firebaseErrorMessage(
                        error
                    )
            };
        }
    }


    function clearLocalAuthState() {

        removeLocal(
            storageKey(
                "authState",
                "vyro_auth_state"
            )
        );


        removeLocal(
            storageKey(
                "emailVerified",
                "vyro_email_verified"
            )
        );
    }


    /* =======================================================
       EMAIL VERIFICATION
       ======================================================= */

    async function reloadUser() {

        if (!currentUser) {

            return {
                success: false,
                message:
                    "No authenticated user."
            };
        }


        try {

            await currentUser.reload();


            currentUser =
                getAuth() &&
                getAuth().currentUser
                    ? getAuth().currentUser
                    : currentUser;


            saveLocal(
                storageKey(
                    "emailVerified",
                    "vyro_email_verified"
                ),
                !!currentUser.emailVerified
            );


            return {
                success: true,
                user: currentUser,
                emailVerified:
                    !!currentUser.emailVerified
            };


        } catch (error) {

            console.error(
                "VYRO email verification check error:",
                error
            );


            return {
                success: false,
                message:
                    firebaseErrorMessage(
                        error
                    )
            };
        }
    }


    async function sendVerificationEmail() {

        if (!currentUser) {

            return {
                success: false,
                message:
                    "Please log in first."
            };
        }


        try {

            await currentUser.sendEmailVerification();


            return {
                success: true,
                message:
                    "Verification email sent."
            };


        } catch (error) {

            console.error(
                "VYRO resend verification error:",
                error
            );


            return {
                success: false,
                message:
                    firebaseErrorMessage(
                        error
                    )
            };
        }
    }


    /* =======================================================
       PASSWORD RESET
       ======================================================= */

    async function sendPasswordReset(
        email
    ) {

        if (!email) {

            return {
                success: false,
                message:
                    "Enter your email address."
            };
        }


        if (!firebaseReady()) {

            return {
                success: false,
                code: "firebase-not-ready",
                message:
                    "Firebase is not connected yet."
            };
        }


        const auth =
            getAuth();


        if (!auth) {

            return {
                success: false,
                message:
                    "Authentication service is unavailable."
            };
        }


        try {

            await auth.sendPasswordResetEmail(
                email.trim()
            );


            return {
                success: true,
                message:
                    "Password reset email sent."
            };


        } catch (error) {

            console.error(
                "VYRO password reset error:",
                error
            );


            return {
                success: false,
                message:
                    firebaseErrorMessage(
                        error
                    )
            };
        }
    }


    /* =======================================================
       GET SAVED USER DATA
       ======================================================= */

    function getSavedUser() {

        return getLocal(
            storageKey(
                "user",
                "vyro_user"
            )
        );
    }


    function getSavedUsername() {

        return getLocal(
            storageKey(
                "username",
                "vyro_username"
            )
        );
    }


    function getSavedEmail() {

        return getLocal(
            storageKey(
                "email",
                "vyro_email"
            )
        );
    }


    /* =======================================================
       FORM — CREATE ACCOUNT
       ======================================================= */

    async function handleCreateAccountSubmit(
        event
    ) {

        event.preventDefault();


        const form =
            getElement(
                "create-account-form"
            );


        const submitButton =
            getElement(
                "create-account-submit-btn"
            );


        if (!form) {
            return;
        }


        const username =
            getElement(
                "signup-username"
            );


        const email =
            getElement(
                "signup-email"
            );


        const password =
            getElement(
                "signup-password"
            );


        const confirmPassword =
            getElement(
                "signup-confirm-password"
            );


        const recognitionWord =
            getElement(
                "signup-recognition-word"
            );


        const terms =
            getElement(
                "signup-terms"
            );


        setStatus(
            "signup-username-status",
            "",
            ""
        );


        setButtonLoading(
            submitButton,
            true
        );


        const result =
            await createAccount({

                username:
                    username
                        ? username.value
                        : "",

                email:
                    email
                        ? email.value
                        : "",

                password:
                    password
                        ? password.value
                        : "",

                confirmPassword:
                    confirmPassword
                        ? confirmPassword.value
                        : "",

                recognitionWord:
                    recognitionWord
                        ? recognitionWord.value
                        : "",

                termsAccepted:
                    terms
                        ? terms.checked
                        : false
            });


        setButtonLoading(
            submitButton,
            false,
            "Create Account"
        );


        if (!result.success) {

            if (
                result.field ===
                "username"
            ) {

                setStatus(
                    "signup-username-status",
                    result.message,
                    "error"
                );

            } else {

                showToast(
                    result.message
                );
            }


            return;
        }


        /*
         * Account creation succeeded.
         */

        const verificationDisplay =
            getElement(
                "verification-email-display"
            );


        if (verificationDisplay) {

            verificationDisplay.textContent =
                result.email;
        }


        setStatus(
            "email-verification-status",
            "Your account was created. Check your email to verify your address.",
            "success"
        );


        showScreen(
            "email-verification-screen"
        );


        showToast(
            "VYRO account created."
        );
    }


    /* =======================================================
       FORM — LOGIN
       ======================================================= */

    async function handleLoginSubmit(
        event
    ) {

        event.preventDefault();


        const email =
            getElement(
                "login-email"
            );


        const password =
            getElement(
                "login-password"
            );


        const submitButton =
            getElement(
                "login-submit-btn"
            );


        setButtonLoading(
            submitButton,
            true
        );


        const result =
            await login(

                email
                    ? email.value
                    : "",

                password
                    ? password.value
                    : ""
            );


        setButtonLoading(
            submitButton,
            false,
            "Log In"
        );


        if (!result.success) {

            showToast(
                result.message
            );

            return;
        }


        /*
         * If the email isn't verified yet, go to the
         * verification screen.
         */

        if (
            !result.emailVerified
        ) {

            const display =
                getElement(
                    "verification-email-display"
                );


            if (display) {

                display.textContent =
                    result.user.email;
            }


            setStatus(
                "email-verification-status",
                "Please verify your email before continuing.",
                "warning"
            );


            showScreen(
                "email-verification-screen"
            );


            return;
        }


        /*
         * 2FA is handled by the next authentication layer.
         *
         * For now, send the authenticated user to the
         * two-factor screen if the feature is enabled.
         */

        const twoFactorEnabled =
            CONFIG.features &&
            CONFIG.features.twoFactorAuthentication;


        if (twoFactorEnabled) {

            showScreen(
                "two-factor-screen"
            );

            return;
        }


        showScreen(
            "home-screen"
        );
    }


    /* =======================================================
       USERNAME INPUT
       ======================================================= */

    function handleUsernameInput() {

        const input =
            getElement(
                "signup-username"
            );


        const status =
            getElement(
                "signup-username-status"
            );


        if (!input || !status) {
            return;
        }


        const value =
            input.value;


        if (!value.trim()) {

            status.textContent =
                "";

            status.className =
                "form-status";

            return;
        }


        const result =
            validateUsername(
                value
            );


        if (!result.valid) {

            status.textContent =
                result.message;

            status.className =
                "form-status error";

            return;
        }


        status.textContent =
            "Username format looks good.";

        status.className =
            "form-status success";
    }


    /* =======================================================
       EMAIL VERIFICATION CHECK
       ======================================================= */

    async function handleVerificationCheck() {

        const button =
            getElement(
                "email-verification-check-btn"
            );


        setButtonLoading(
            button,
            true
        );


        const result =
            await reloadUser();


        setButtonLoading(
            button,
            false,
            "I've Verified My Email"
        );


        if (!result.success) {

            showToast(
                result.message
            );

            return;
        }


        if (!result.emailVerified) {

            setStatus(
                "email-verification-status",
                "Your email is not verified yet. Check your inbox and try again.",
                "warning"
            );

            return;
        }


        setStatus(
            "email-verification-status",
            "Email verified successfully.",
            "success"
        );


        showToast(
            "Email verified."
        );


        /*
         * Continue to 2FA.
         */

        showScreen(
            "two-factor-screen"
        );
    }


    /* =======================================================
       RESEND VERIFICATION
       ======================================================= */

    async function handleVerificationResend() {

        const button =
            getElement(
                "email-verification-resend-btn"
            );


        setButtonLoading(
            button,
            true
        );


        const result =
            await sendVerificationEmail();


        setButtonLoading(
            button,
            false,
            "Resend Verification Email"
        );


        if (!result.success) {

            setStatus(
                "email-verification-status",
                result.message,
                "error"
            );

            return;
        }


        setStatus(
            "email-verification-status",
            "A new verification email has been sent.",
            "success"
        );
    }


    /* =======================================================
       FORGOT PASSWORD
       ======================================================= */

    async function handleForgotPassword() {

        const email =
            getElement(
                "login-email"
            );


        const value =
            email
                ? email.value.trim()
                : "";


        if (!value) {

            showToast(
                "Enter your email address first."
            );

            return;
        }


        const result =
            await sendPasswordReset(
                value
            );


        showToast(
            result.message
        );
    }


    /* =======================================================
       2FA FOUNDATION
       =======================================================
       
       The actual second-factor provider will be connected
       after the base authentication system is verified.
       
       We intentionally do not fake 2FA security.
       ======================================================= */

    function handleTwoFactorSubmit(
        event
    ) {

        event.preventDefault();


        const codeInput =
            getElement(
                "two-factor-code"
            );


        const status =
            getElement(
                "two-factor-status"
            );


        const code =
            codeInput
                ? codeInput.value.trim()
                : "";


        /*
         * Do not pretend that a locally entered code is
         * secure authentication.
         */

        if (!code) {

            setStatus(
                "two-factor-status",
                "Enter your authentication code.",
                "error"
            );

            return;
        }


        setStatus(
            "two-factor-status",
            "Two-factor verification will be connected to the authentication provider before production use.",
            "warning"
        );
    }


    /* =======================================================
       EVENT LISTENERS
       ======================================================= */

    function bindEvents() {

        const createForm =
            getElement(
                "create-account-form"
            );


        if (createForm) {

            createForm.addEventListener(
                "submit",
                handleCreateAccountSubmit
            );
        }


        const loginForm =
            getElement(
                "login-form"
            );


        if (loginForm) {

            loginForm.addEventListener(
                "submit",
                handleLoginSubmit
            );
        }


        const usernameInput =
            getElement(
                "signup-username"
            );


        if (usernameInput) {

            usernameInput.addEventListener(
                "input",
                handleUsernameInput
            );
        }


        const verificationCheck =
            getElement(
                "email-verification-check-btn"
            );


        if (verificationCheck) {

            verificationCheck.addEventListener(
                "click",
                handleVerificationCheck
            );
        }


        const verificationResend =
            getElement(
                "email-verification-resend-btn"
            );


        if (verificationResend) {

            verificationResend.addEventListener(
                "click",
                handleVerificationResend
            );
        }


        const forgotPassword =
            getElement(
                "forgot-password-btn"
            );


        if (forgotPassword) {

            forgotPassword.addEventListener(
                "click",
                handleForgotPassword
            );
        }


        const twoFactorForm =
            getElement(
                "two-factor-form"
            );


        if (twoFactorForm) {

            twoFactorForm.addEventListener(
                "submit",
                handleTwoFactorSubmit
            );
        }
    }


    /* =======================================================
       PUBLIC API
       ======================================================= */

    window.VYRO_AUTH = Object.freeze({

        initialize: initialize,

        createAccount: createAccount,

        login: login,

        logout: logout,

        reloadUser: reloadUser,

        sendVerificationEmail:
            sendVerificationEmail,

        sendPasswordReset:
            sendPasswordReset,

        getCurrentUser:
            getCurrentUser,

        getSavedUser:
            getSavedUser,

        getSavedUsername:
            getSavedUsername,

        getSavedEmail:
            getSavedEmail,

        isLoggedIn:
            isLoggedIn,

        validateUsername:
            validateUsername,

        validateRecognitionWord:
            validateRecognitionWord,

        validatePassword:
            validatePassword
    });


    /* =======================================================
       STARTUP
       ======================================================= */

    function start() {

        bindEvents();

        /*
         * Attempt Firebase initialization.
         *
         * If Firebase isn't configured yet, this safely
         * stops here instead of crashing VYRO.
         */

        initialize();
    }


    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            start
        );

    } else {

        start();
    }

})();
