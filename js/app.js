// =========================================================
// VYRO — APPLICATION CONTROLLER
// Core navigation, screen management, and module coordination
// =========================================================

(function () {

    "use strict";

    // ---------------------------------------------------------
    // Dependencies
    // ---------------------------------------------------------

    const CONFIG = window.VYRO_CONFIG || {};
    const AUTH = window.VYRO_AUTH || {};
    const WALLETS = window.VYRO_WALLETS || {};
    const PAYMENTS = window.VYRO_PAYMENTS || {};

    // ---------------------------------------------------------
    // Application State
    // ---------------------------------------------------------

    const state = {
        initialized: false,
        currentScreen: "welcome-screen",
        previousScreen: null,
        navigationHistory: [],
        busy: false
    };

    // ---------------------------------------------------------
    // DOM Helpers
    // ---------------------------------------------------------

    function $(id) {
        return document.getElementById(id);
    }

    function getScreens() {
        return Array.from(
            document.querySelectorAll(".screen")
        );
    }

    // ---------------------------------------------------------
    // Loading
    // ---------------------------------------------------------

    function showLoading(message) {

        const overlay = $("loading-overlay");
        const messageElement = $("loading-message");

        if (messageElement) {
            messageElement.textContent =
                message || "Loading...";
        }

        if (overlay) {
            overlay.classList.add("active");
            overlay.setAttribute("aria-hidden", "false");
        }
    }

    function hideLoading() {

        const overlay = $("loading-overlay");

        if (overlay) {
            overlay.classList.remove("active");
            overlay.setAttribute("aria-hidden", "true");
        }
    }

    // ---------------------------------------------------------
    // Toast
    // ---------------------------------------------------------

    function showToast(message, type) {

        const toast = $("toast");
        const toastMessage = $("toast-message");

        if (!toast || !toastMessage) {
            return;
        }

        toastMessage.textContent = message || "";

        toast.classList.remove(
            "success",
            "error",
            "warning"
        );

        if (type) {
            toast.classList.add(type);
        }

        toast.classList.add("active");

        clearTimeout(state.toastTimer);

        state.toastTimer = setTimeout(function () {
            toast.classList.remove("active");
        }, 3000);
    }

    // ---------------------------------------------------------
    // Screen Navigation
    // ---------------------------------------------------------

    function showScreen(screenId, options) {

        options = options || {};

        const target = $(screenId);

        if (!target) {
            console.error(
                "VYRO: Screen not found:",
                screenId
            );
            return false;
        }

        const current = $(state.currentScreen);

        if (
            current &&
            state.currentScreen !== screenId &&
            options.addToHistory !== false
        ) {
            state.navigationHistory.push(
                state.currentScreen
            );

            state.previousScreen =
                state.currentScreen;
        }

        getScreens().forEach(function (screen) {

            const active =
                screen.id === screenId;

            screen.classList.toggle(
                "active",
                active
            );

            screen.setAttribute(
                "aria-hidden",
                active ? "false" : "true"
            );
        });

        state.currentScreen = screenId;

        updateHeader();

        window.scrollTo({
            top: 0,
            behavior: "instant"
        });

        updateScreenData(screenId);

        return true;
    }

    function goBack() {

        if (
            state.navigationHistory.length === 0
        ) {
            return goHome();
        }

        const previous =
            state.navigationHistory.pop();

        if (!previous) {
            return goHome();
        }

        showScreen(previous, {
            addToHistory: false
        });
    }

    function goHome() {

        state.navigationHistory = [];
        state.previousScreen = null;

        const authenticated =
            isAuthenticated();

        if (authenticated) {
            showScreen(
                "home-screen",
                {
                    addToHistory: false
                }
            );
        } else {
            showScreen(
                "welcome-screen",
                {
                    addToHistory: false
                }
            );
        }
    }

    // ---------------------------------------------------------
    // Header
    // ---------------------------------------------------------

    function updateHeader() {

        const header = $("global-header");
        const backButton = $("global-back-btn");

        if (!header) {
            return;
        }

        if (
            state.currentScreen ===
            "welcome-screen"
        ) {
            header.classList.add("hidden");

            if (backButton) {
                backButton.classList.add("hidden");
            }

            return;
        }

        header.classList.remove("hidden");

        if (backButton) {

            const noBackScreens = [
                "home-screen",
                "welcome-screen"
            ];

            backButton.classList.toggle(
                "hidden",
                noBackScreens.includes(
                    state.currentScreen
                )
            );
        }
    }

    // ---------------------------------------------------------
    // Authentication State
    // ---------------------------------------------------------

    function isAuthenticated() {

        if (
            typeof AUTH.isAuthenticated ===
            "function"
        ) {
            return AUTH.isAuthenticated();
        }

        if (
            typeof AUTH.getSavedUser ===
            "function"
        ) {
            return !!AUTH.getSavedUser();
        }

        return false;
    }

    function refreshAuthenticatedUI() {

        updateUsername();

        updateWalletUI();

        updateHomeActivity();
    }

    // ---------------------------------------------------------
    // Username / Profile
    // ---------------------------------------------------------

    function getUsername() {

        if (
            typeof AUTH.getSavedUsername ===
            "function"
        ) {
            return AUTH.getSavedUsername();
        }

        return (
            localStorage.getItem(
                CONFIG.storage?.username ||
                "vyro_username"
            ) || ""
        );
    }

    function updateUsername() {

        const username =
            getUsername();

        const homeUsername =
            $("home-username");

        const receiveUsername =
            $("receive-username");

        const profileUsername =
            $("profile-username");

        if (homeUsername) {
            homeUsername.textContent =
                username
                    ? "@" + username.replace(/^@/, "")
                    : "@username";
        }

        if (receiveUsername) {
            receiveUsername.textContent =
                username
                    ? "@" + username.replace(/^@/, "")
                    : "@username";
        }

        if (profileUsername) {
            profileUsername.textContent =
                username
                    ? "@" + username.replace(/^@/, "")
                    : "—";
        }

        const email =
            typeof AUTH.getSavedEmail ===
            "function"
                ? AUTH.getSavedEmail()
                : localStorage.getItem(
                    CONFIG.storage?.email ||
                    "vyro_email"
                );

        const profileEmail =
            $("profile-email");

        if (profileEmail) {
            profileEmail.textContent =
                email || "—";
        }

        const accountStatus =
            $("profile-account-status");

        if (accountStatus) {
            accountStatus.textContent =
                isAuthenticated()
                    ? "Active"
                    : "Not signed in";
        }
    }

    // ---------------------------------------------------------
    // Wallet UI
    // ---------------------------------------------------------

    function updateWalletUI() {

        let wallet = null;

        if (
            typeof WALLETS.getActiveWallet ===
            "function"
        ) {
            wallet =
                WALLETS.getActiveWallet();
        }

        if (!wallet) {
            updateDisconnectedWalletUI();
            return;
        }

        const address =
            wallet.address || "";

        const type =
            wallet.type ||
            wallet.provider ||
            "External Wallet";

        const network =
            wallet.network ||
            "solana";

        const homeWalletName =
            $("home-wallet-name");

        const homeWalletAddress =
            $("home-wallet-address");

        const homeWalletStatus =
            $("home-wallet-status");

        if (homeWalletName) {
            homeWalletName.textContent =
                type;
        }

        if (homeWalletAddress) {
            homeWalletAddress.textContent =
                shortenAddress(address);
        }

        if (homeWalletStatus) {
            homeWalletStatus.textContent =
                "Connected";
        }

        const connectedWalletType =
            $("connected-wallet-type");

        const connectedWalletAddress =
            $("connected-wallet-address");

        const connectedWalletNetwork =
            $("connected-wallet-network");

        if (connectedWalletType) {
            connectedWalletType.textContent =
                type;
        }

        if (connectedWalletAddress) {
            connectedWalletAddress.textContent =
                address || "—";
        }

        if (connectedWalletNetwork) {
            connectedWalletNetwork.textContent =
                formatNetwork(network);
        }
    }

    function updateDisconnectedWalletUI() {

        const homeWalletName =
            $("home-wallet-name");

        const homeWalletAddress =
            $("home-wallet-address");

        const homeWalletStatus =
            $("home-wallet-status");

        if (homeWalletName) {
            homeWalletName.textContent =
                "No wallet connected";
        }

        if (homeWalletAddress) {
            homeWalletAddress.textContent =
                "Connect a wallet to begin";
        }

        if (homeWalletStatus) {
            homeWalletStatus.textContent =
                "Not connected";
        }

        const connectedWalletType =
            $("connected-wallet-type");

        const connectedWalletAddress =
            $("connected-wallet-address");

        const connectedWalletNetwork =
            $("connected-wallet-network");

        if (connectedWalletType) {
            connectedWalletType.textContent =
                "—";
        }

        if (connectedWalletAddress) {
            connectedWalletAddress.textContent =
                "—";
        }

        if (connectedWalletNetwork) {
            connectedWalletNetwork.textContent =
                "—";
        }
    }

    function shortenAddress(address) {

        if (!address) {
            return "—";
        }

        if (address.length <= 14) {
            return address;
        }

        return (
            address.slice(0, 6) +
            "..." +
            address.slice(-6)
        );
    }

    function formatNetwork(network) {

        if (!network) {
            return "—";
        }

        const value =
            String(network).toLowerCase();

        if (value === "solana") {
            return "Solana";
        }

        return network;
    }

    // ---------------------------------------------------------
    // Activity
    // ---------------------------------------------------------

    function getTransactions() {

        if (
            typeof PAYMENTS.getTransactions ===
            "function"
        ) {
            return PAYMENTS.getTransactions();
        }

        try {

            const key =
                CONFIG.storage?.transactions ||
                "vyro_transactions";

            const raw =
                localStorage.getItem(key);

            return raw
                ? JSON.parse(raw)
                : [];

        } catch (error) {

            console.error(
                "VYRO: Unable to load transactions",
                error
            );

            return [];
        }
    }

    function updateHomeActivity() {

        const list =
            $("home-activity-list");

        const empty =
            $("home-empty-activity");

        if (!list) {
            return;
        }

        const transactions =
            getTransactions();

        list.innerHTML = "";

        if (
            !transactions ||
            transactions.length === 0
        ) {

            if (empty) {
                empty.style.display = "";
            }

            return;
        }

        if (empty) {
            empty.style.display = "none";
        }

        transactions
            .slice(0, 5)
            .forEach(function (transaction) {

                list.appendChild(
                    createActivityItem(
                        transaction
                    )
                );
            });
    }

    function updateActivityScreen() {

        const list =
            $("activity-list");

        const empty =
            $("activity-empty-state");

        if (!list) {
            return;
        }

        const transactions =
            getTransactions();

        list.innerHTML = "";

        if (
            !transactions ||
            transactions.length === 0
        ) {

            if (empty) {
                empty.style.display = "";
            }

            return;
        }

        if (empty) {
            empty.style.display = "none";
        }

        transactions.forEach(
            function (transaction) {

                list.appendChild(
                    createActivityItem(
                        transaction
                    )
                );
            }
        );
    }

    function createActivityItem(
        transaction
    ) {

        const item =
            document.createElement("button");

        item.type = "button";

        item.className =
            "activity-item";

        item.dataset.transactionId =
            transaction.id || "";

        const recipient =
            transaction.recipientUsername
                ? "@" +
                  transaction.recipientUsername
                      .replace(/^@/, "")
                : "Transaction";

        const amount =
            transaction.amount !== undefined
                ? transaction.amount
                : "—";

        const asset =
            transaction.assetName ||
            transaction.asset ||
            "USDC";

        const status =
            transaction.status ||
            "pending";

        item.innerHTML = `
            <div class="activity-item-main">
                <strong>${escapeHtml(recipient)}</strong>
                <span>${escapeHtml(
                    formatStatus(status)
                )}</span>
            </div>

            <div class="activity-item-side">
                <strong>${escapeHtml(
                    String(amount)
                )} ${escapeHtml(asset)}</strong>
                <span>${escapeHtml(
                    formatDate(
                        transaction.createdAt ||
                        transaction.updatedAt
                    )
                )}</span>
            </div>
        `;

        item.addEventListener(
            "click",
            function () {

                openTransaction(
                    transaction.id
                );
            }
        );

        return item;
    }

    function formatStatus(status) {

        return String(status || "")
            .replace(/_/g, " ")
            .replace(/\b\w/g, function (letter) {
                return letter.toUpperCase();
            });
    }

    function formatDate(value) {

        if (!value) {
            return "—";
        }

        const date =
            new Date(value);

        if (
            Number.isNaN(
                date.getTime()
            )
        ) {
            return "—";
        }

        return date.toLocaleDateString(
            undefined,
            {
                month: "short",
                day: "numeric",
                year: "numeric"
            }
        );
    }

    function openTransaction(
        transactionId
    ) {

        if (!transactionId) {
            return;
        }

        const transactions =
            getTransactions();

        const transaction =
            transactions.find(
                function (item) {
                    return item.id ===
                        transactionId;
                }
            );

        if (!transaction) {

            showToast(
                "Transaction not found.",
                "error"
            );

            return;
        }

        populateTransactionDetail(
            transaction
        );

        showScreen(
            "transaction-detail-screen"
        );
    }

    function populateTransactionDetail(
        transaction
    ) {

        setText(
            "transaction-status",
            formatStatus(
                transaction.status
            )
        );

        setText(
            "transaction-type",
            formatStatus(
                transaction.type || "send"
            )
        );

        setText(
            "transaction-recipient",
            transaction.recipientUsername
                ? "@" +
                  transaction.recipientUsername
                      .replace(/^@/, "")
                : "—"
        );

        setText(
            "transaction-amount",
            transaction.amount !== undefined
                ? String(transaction.amount)
                : "—"
        );

        setText(
            "transaction-network",
            transaction.networkName ||
                formatNetwork(
                    transaction.network
                )
        );

        setText(
            "transaction-date",
            formatDate(
                transaction.createdAt ||
                transaction.updatedAt
            )
        );

        setText(
            "transaction-id",
            transaction.id || "—"
        );

        const icon =
            $("transaction-status-icon");

        if (icon) {

            icon.classList.remove(
                "success",
                "error",
                "pending"
            );

            const status =
                String(
                    transaction.status || ""
                ).toLowerCase();

            if (
                status === "confirmed" ||
                status === "completed" ||
                status === "success"
            ) {
                icon.classList.add(
                    "success"
                );
            } else if (
                status === "failed" ||
                status === "cancelled"
            ) {
                icon.classList.add(
                    "error"
                );
            } else {
                icon.classList.add(
                    "pending"
                );
            }
        }
    }

    // ---------------------------------------------------------
    // Screen-Specific Updates
    // ---------------------------------------------------------

    function updateScreenData(
        screenId
    ) {

        switch (screenId) {

            case "home-screen":
                refreshAuthenticatedUI();
                break;

            case "receive-screen":
                updateUsername();
                break;

            case "wallets-screen":

                if (
                    typeof WALLETS.updateWalletUI ===
                    "function"
                ) {
                    WALLETS.updateWalletUI();
                }

                break;

            case "activity-screen":
                updateActivityScreen();
                break;

            case "profile-screen":
                updateUsername();
                break;

            case "security-screen":
                updateSecurityUI();
                break;

            default:
                break;
        }
    }

    function updateSecurityUI() {

        const status =
            $("two-factor-setting-status");

        const indicator =
            $("two-factor-status-indicator");

        let enabled = false;

        if (
            typeof AUTH.isTwoFactorEnabled ===
            "function"
        ) {
            enabled =
                AUTH.isTwoFactorEnabled();
        } else {

            const key =
                CONFIG.storage?.twoFactor ||
                "vyro_two_factor";

            enabled =
                localStorage.getItem(
                    key
                ) === "true";
        }

        if (status) {
            status.textContent =
                enabled
                    ? "Enabled"
                    : "Not configured";
        }

        if (indicator) {

            indicator.classList.toggle(
                "active",
                enabled
            );
        }
    }

    // ---------------------------------------------------------
    // Welcome
    // ---------------------------------------------------------

    function openCreateAccount() {

        showScreen(
            "create-account-screen"
        );
    }

    function openLogin() {

        showScreen(
            "login-screen"
        );
    }

    // ---------------------------------------------------------
    // Signup
    // ---------------------------------------------------------

    async function handleSignupSubmit(
        event
    ) {

        event.preventDefault();

        if (
            typeof AUTH.createAccount !==
            "function"
        ) {

            showError(
                "Authentication system is unavailable."
            );

            return;
        }

        const form =
            event.currentTarget;

        const username =
            value("signup-username");

        const email =
            value("signup-email");

        const password =
            value("signup-password");

        const confirmPassword =
            value(
                "signup-confirm-password"
            );

        const recognitionWord =
            value(
                "signup-recognition-word"
            );

        const terms =
            $("signup-terms")
                ? $("signup-terms").checked
                : false;

        showLoading(
            "Creating your VYRO account..."
        );

        try {

            const result =
                await AUTH.createAccount({
                    username,
                    email,
                    password,
                    confirmPassword,
                    recognitionWord,
                    terms
                });

            hideLoading();

            if (
                result &&
                result.success
            ) {

                showToast(
                    "Account created.",
                    "success"
                );

                showScreen(
                    "email-verification-screen"
                );

                updateVerificationEmail(
                    email
                );

                return;
            }

            showError(
                result &&
                result.message
                    ? result.message
                    : "Unable to create your account."
            );

        } catch (error) {

            hideLoading();

            console.error(
                "VYRO signup error:",
                error
            );

            showError(
                getErrorMessage(
                    error,
                    "Unable to create your account."
                )
            );
        }
    }

    function updateVerificationEmail(
        email
    ) {

        const display =
            $("verification-email-display");

        if (display) {
            display.textContent =
                email || "your email";
        }
    }

    // ---------------------------------------------------------
    // Login
    // ---------------------------------------------------------

    async function handleLoginSubmit(
        event
    ) {

        event.preventDefault();

        if (
            typeof AUTH.login !==
            "function"
        ) {

            showError(
                "Authentication system is unavailable."
            );

            return;
        }

        const email =
            value("login-email");

        const password =
            value("login-password");

        showLoading(
            "Signing you in..."
        );

        try {

            const result =
                await AUTH.login(
                    email,
                    password
                );

            hideLoading();

            if (
                result &&
                result.success
            ) {

                /*
                 * Authentication.js controls whether
                 * the user must complete email
                 * verification or the 2FA foundation.
                 */

                if (
                    result.requiresVerification
                ) {

                    showScreen(
                        "email-verification-screen"
                    );

                    updateVerificationEmail(
                        email
                    );

                    return;
                }

                if (
                    result.requiresTwoFactor
                ) {

                    showScreen(
                        "two-factor-screen"
                    );

                    return;
                }

                showScreen(
                    "home-screen"
                );

                refreshAuthenticatedUI();

                showToast(
                    "Welcome back.",
                    "success"
                );

                return;
            }

            showError(
                result &&
                result.message
                    ? result.message
                    : "Login failed."
            );

        } catch (error) {

            hideLoading();

            console.error(
                "VYRO login error:",
                error
            );

            showError(
                getErrorMessage(
                    error,
                    "Unable to sign in."
                )
            );
        }
    }

    // ---------------------------------------------------------
    // Email Verification
    // ---------------------------------------------------------

    async function handleCheckVerification() {

        if (
            typeof AUTH.reloadUser !==
            "function"
        ) {
            return;
        }

        showLoading(
            "Checking verification..."
        );

        try {

            const result =
                await AUTH.reloadUser();

            hideLoading();

            if (
                result &&
                result.emailVerified
            ) {

                localStorage.setItem(
                    CONFIG.storage?.emailVerified ||
                    "vyro_email_verified",
                    "true"
                );

                showToast(
                    "Email verified.",
                    "success"
                );

                showScreen(
                    "two-factor-screen"
                );

                return;
            }

            const status =
                $("email-verification-status");

            if (status) {

                status.textContent =
                    "Your email is not verified yet. Check your inbox and try again.";
            }

        } catch (error) {

            hideLoading();

            showError(
                getErrorMessage(
                    error,
                    "Unable to check verification status."
                )
            );
        }
    }

    async function handleResendVerification() {

        if (
            typeof AUTH.sendVerificationEmail !==
            "function"
        ) {
            return;
        }

        showLoading(
            "Sending verification email..."
        );

        try {

            const result =
                await AUTH.sendVerificationEmail();

            hideLoading();

            if (
                result &&
                result.success
            ) {

                showToast(
                    "Verification email sent.",
                    "success"
                );

            } else {

                showError(
                    result &&
                    result.message
                        ? result.message
                        : "Unable to send verification email."
                );
            }

        } catch (error) {

            hideLoading();

            showError(
                getErrorMessage(
                    error,
                    "Unable to send verification email."
                )
            );
        }
    }

    // ---------------------------------------------------------
    // Two-Factor
    // ---------------------------------------------------------

    function handleTwoFactorSubmit(
        event
    ) {

        event.preventDefault();

        /*
         * IMPORTANT:
         * The current authentication foundation
         * intentionally does not pretend that a
         * locally checked code is real 2FA.
         *
         * The real second-factor provider will be
         * connected later.
         */

        const status =
            $("two-factor-status");

        if (status) {

            status.textContent =
                "Two-factor authentication is not connected to a real provider yet.";
        }

        showToast(
            "2FA provider connection is the next security step.",
            "warning"
        );
    }

    function handleTwoFactorComplete() {

        showToast(
            "VYRO cannot mark 2FA complete until a real second-factor provider is connected.",
            "warning"
        );
    }

    // ---------------------------------------------------------
    // Home Navigation
    // ---------------------------------------------------------

    function openHome() {

        if (!isAuthenticated()) {

            showScreen(
                "welcome-screen",
                {
                    addToHistory: false
                }
            );

            return;
        }

        showScreen(
            "home-screen",
            {
                addToHistory: false
            }
        );

        refreshAuthenticatedUI();
    }

    function openSend() {

        if (!requireAuthentication()) {
            return;
        }

        if (
            typeof PAYMENTS.resetSendForm ===
            "function"
        ) {
            PAYMENTS.resetSendForm();
        }

        showScreen(
            "send-screen"
        );
    }

    function openReceive() {

        if (!requireAuthentication()) {
            return;
        }

        showScreen(
            "receive-screen"
        );
    }

    function openWallets() {

        if (!requireAuthentication()) {
            return;
        }

        showScreen(
            "wallets-screen"
        );

        updateWalletUI();
    }

    function openActivity() {

        if (!requireAuthentication()) {
            return;
        }

        showScreen(
            "activity-screen"
        );

        updateActivityScreen();
    }

    // ---------------------------------------------------------
    // Wallet Navigation
    // ---------------------------------------------------------

    function openConnectWallet() {

        if (!requireAuthentication()) {
            return;
        }

        showScreen(
            "connect-wallet-screen"
        );
    }

    // ---------------------------------------------------------
    // Settings
    // ---------------------------------------------------------

    function openSettings() {

        if (!requireAuthentication()) {
            return;
        }

        showScreen(
            "settings-screen"
        );
    }

    function openProfile() {

        if (!requireAuthentication()) {
            return;
        }

        showScreen(
            "profile-screen"
        );
    }

    function openSecurity() {

        if (!requireAuthentication()) {
            return;
        }

        showScreen(
            "security-screen"
        );
    }

    function openPrivacy() {

        showScreen(
            "privacy-screen"
        );
    }

    function openTerms() {

        showScreen(
            "terms-screen"
        );
    }

    // ---------------------------------------------------------
    // Logout
    // ---------------------------------------------------------

    async function handleLogout() {

        const confirmed =
            window.confirm(
                "Are you sure you want to log out?"
            );

        if (!confirmed) {
            return;
        }

        showLoading(
            "Signing out..."
        );

        try {

            if (
                typeof AUTH.logout ===
                "function"
            ) {
                await AUTH.logout();
            }

            if (
                typeof WALLETS.disconnectWallet ===
                "function"
            ) {

                /*
                 * This disconnects the current
                 * wallet session if possible.
                 *
                 * Saved wallet records are not
                 * automatically destroyed.
                 */
                await WALLETS.disconnectWallet();
            }

            hideLoading();

            state.navigationHistory = [];

            showScreen(
                "welcome-screen",
                {
                    addToHistory: false
                }
            );

            showToast(
                "You have been logged out.",
                "success"
            );

        } catch (error) {

            hideLoading();

            console.error(
                "VYRO logout error:",
                error
            );

            showError(
                "Unable to complete logout."
            );
        }
    }

    // ---------------------------------------------------------
    // Forgot Password
    // ---------------------------------------------------------

    async function handleForgotPassword() {

        if (
            typeof AUTH.sendPasswordReset !==
            "function"
        ) {
            return;
        }

        const email =
            value("login-email");

        if (!email) {

            showToast(
                "Enter your email address first.",
                "warning"
            );

            return;
        }

        showLoading(
            "Sending password reset..."
        );

        try {

            const result =
                await AUTH.sendPasswordReset(
                    email
                );

            hideLoading();

            if (
                result &&
                result.success
            ) {

                showToast(
                    "Password reset email sent.",
                    "success"
                );

            } else {

                showError(
                    result &&
                    result.message
                        ? result.message
                        : "Unable to send password reset email."
                );
            }

        } catch (error) {

            hideLoading();

            showError(
                getErrorMessage(
                    error,
                    "Unable to send password reset email."
                )
            );
        }
    }

    // ---------------------------------------------------------
    // Copy Username
    // ---------------------------------------------------------

    async function copyUsername() {

        const username =
            getUsername();

        if (!username) {

            showToast(
                "No username is available.",
                "warning"
            );

            return;
        }

        const formatted =
            username.startsWith("@")
                ? username
                : "@" + username;

        try {

            if (
                navigator.clipboard &&
                navigator.clipboard.writeText
            ) {

                await navigator.clipboard.writeText(
                    formatted
                );

            } else {

                const textarea =
                    document.createElement(
                        "textarea"
                    );

                textarea.value =
                    formatted;

                document.body.appendChild(
                    textarea
                );

                textarea.select();

                document.execCommand(
                    "copy"
                );

                textarea.remove();
            }

            const status =
                $("receive-copy-status");

            if (status) {
                status.textContent =
                    "Username copied.";
            }

            showToast(
                "Username copied.",
                "success"
            );

        } catch (error) {

            showToast(
                "Unable to copy username.",
                "error"
            );
        }
    }

    // ---------------------------------------------------------
    // Generic Helpers
    // ---------------------------------------------------------

    function value(id) {

        const element =
            $(id);

        if (!element) {
            return "";
        }

        return String(
            element.value || ""
        ).trim();
    }

    function setText(
        id,
        text
    ) {

        const element =
            $(id);

        if (element) {
            element.textContent =
                text === undefined ||
                text === null
                    ? ""
                    : String(text);
        }
    }

    function escapeHtml(value) {

        return String(
            value === undefined ||
            value === null
                ? ""
                : value
        )
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function getErrorMessage(
        error,
        fallback
    ) {

        if (
            error &&
            error.message
        ) {
            return error.message;
        }

        return fallback;
    }

    function requireAuthentication() {

        if (isAuthenticated()) {
            return true;
        }

        showToast(
            "Please sign in to continue.",
            "warning"
        );

        showScreen(
            "login-screen"
        );

        return false;
    }

    function showError(message) {

        const errorMessage =
            $("error-message");

        if (errorMessage) {
            errorMessage.textContent =
                message ||
                "Something went wrong.";
        }

        showScreen(
            "error-screen"
        );
    }

    // ---------------------------------------------------------
    // Confirmation Modal
    // ---------------------------------------------------------

    function closeConfirmationModal() {

        const modal =
            $("confirmation-modal");

        if (!modal) {
            return;
        }

        modal.classList.remove(
            "active"
        );

        modal.setAttribute(
            "aria-hidden",
            "true"
        );
    }

    function openConfirmationModal(
        title,
        message,
        confirmCallback
    ) {

        const modal =
            $("confirmation-modal");

        if (!modal) {
            return;
        }

        setText(
            "confirmation-modal-title",
            title
        );

        setText(
            "confirmation-modal-message",
            message
        );

        const confirmButton =
            $("confirmation-modal-confirm-btn");

        if (confirmButton) {

            confirmButton.onclick =
                function () {

                    closeConfirmationModal();

                    if (
                        typeof confirmCallback ===
                        "function"
                    ) {
                        confirmCallback();
                    }
                };
        }

        modal.classList.add(
            "active"
        );

        modal.setAttribute(
            "aria-hidden",
            "false"
        );
    }

    // ---------------------------------------------------------
    // Event Binding
    // ---------------------------------------------------------

    function bindClick(
        id,
        handler
    ) {

        const element =
            $(id);

        if (!element) {
            return;
        }

        element.addEventListener(
            "click",
            handler
        );
    }

    function bindEvents() {

        // Header
        bindClick(
            "global-back-btn",
            goBack
        );

        bindClick(
            "global-home-btn",
            openHome
        );

        // Welcome
        bindClick(
            "welcome-get-started-btn",
            openCreateAccount
        );

        bindClick(
            "welcome-login-btn",
            openLogin
        );

        // Create account
        bindClick(
            "create-account-login-btn",
            openLogin
        );

        const signupForm =
            $("create-account-form");

        if (signupForm) {
            signupForm.addEventListener(
                "submit",
                handleSignupSubmit
            );
        }

        // Login
        bindClick(
            "login-create-account-btn",
            openCreateAccount
        );

        bindClick(
            "forgot-password-btn",
            handleForgotPassword
        );

        const loginForm =
            $("login-form");

        if (loginForm) {
            loginForm.addEventListener(
                "submit",
                handleLoginSubmit
            );
        }

        // Email verification
        bindClick(
            "email-verification-check-btn",
            handleCheckVerification
        );

        bindClick(
            "email-verification-resend-btn",
            handleResendVerification
        );

        // 2FA
        const twoFactorForm =
            $("two-factor-form");

        if (twoFactorForm) {

            twoFactorForm.addEventListener(
                "submit",
                handleTwoFactorSubmit
            );
        }

        bindClick(
            "two-factor-complete-btn",
            handleTwoFactorComplete
        );

        // Home
        bindClick(
            "home-send-btn",
            openSend
        );

        bindClick(
            "home-receive-btn",
            openReceive
        );

        bindClick(
            "home-wallets-btn",
            openWallets
        );

        bindClick(
            "home-view-all-btn",
            openActivity
        );

        // Receive
        bindClick(
            "copy-username-btn",
            copyUsername
        );

        // Wallets
        bindClick(
            "connect-wallet-btn",
            openConnectWallet
        );

        // Settings
        bindClick(
            "settings-profile-btn",
            openProfile
        );

        bindClick(
            "settings-security-btn",
            openSecurity
        );

        bindClick(
            "settings-wallets-btn",
            openWallets
        );

        bindClick(
            "settings-privacy-btn",
            openPrivacy
        );

        bindClick(
            "settings-terms-btn",
            openTerms
        );

        bindClick(
            "logout-btn",
            handleLogout
        );

        // Error
        bindClick(
            "error-retry-btn",
            function () {

                if (
                    state.previousScreen
                ) {

                    showScreen(
                        state.previousScreen,
                        {
                            addToHistory: false
                        }
                    );

                } else {

                    goHome();
                }
            }
        );

        bindClick(
            "error-home-btn",
            goHome
        );

        // Confirmation modal
        bindClick(
            "confirmation-modal-close-btn",
            closeConfirmationModal
        );

        bindClick(
            "confirmation-modal-cancel-btn",
            closeConfirmationModal
        );

        // Escape key
        document.addEventListener(
            "keydown",
            function (event) {

                if (
                    event.key ===
                    "Escape"
                ) {

                    closeConfirmationModal();
                }
            }
        );
    }

    // ---------------------------------------------------------
    // Browser Back Button
    // ---------------------------------------------------------

    function bindBrowserNavigation() {

        window.addEventListener(
            "popstate",
            function () {

                if (
                    state.navigationHistory.length
                ) {
                    goBack();
                } else {
                    goHome();
                }
            }
        );
    }

    // ---------------------------------------------------------
    // Module Initialization
    // ---------------------------------------------------------

    async function initializeModules() {

        try {

            if (
                typeof AUTH.initialize ===
                "function"
            ) {

                await AUTH.initialize();
            }

        } catch (error) {

            console.error(
                "VYRO: Authentication initialization failed.",
                error
            );
        }

        try {

            if (
                typeof WALLETS.initialize ===
                "function"
            ) {

                await WALLETS.initialize();
            }

        } catch (error) {

            console.error(
                "VYRO: Wallet initialization failed.",
                error
            );
        }

        try {

            if (
                typeof PAYMENTS.initialize ===
                "function"
            ) {

                await PAYMENTS.initialize();
            }

        } catch (error) {

            console.error(
                "VYRO: Payment initialization failed.",
                error
            );
        }
    }

    // ---------------------------------------------------------
    // Application Startup
    // ---------------------------------------------------------

    async function initializeApp() {

        if (state.initialized) {
            return;
        }

        console.log(
            "VYRO: Starting application..."
        );

        bindEvents();

        bindBrowserNavigation();

        showLoading(
            "Loading VYRO..."
        );

        await initializeModules();

        hideLoading();

        state.initialized = true;

        if (isAuthenticated()) {

            showScreen(
                "home-screen",
                {
                    addToHistory: false
                }
            );

            refreshAuthenticatedUI();

        } else {

            showScreen(
                "welcome-screen",
                {
                    addToHistory: false
                }
            );
        }

        console.log(
            "VYRO: Application ready."
        );
    }

    // ---------------------------------------------------------
    // Public API
    // ---------------------------------------------------------

    window.VYRO_APP = {

        initialize:
            initializeApp,

        showScreen:
            showScreen,

        goBack:
            goBack,

        goHome:
            goHome,

        openSend:
            openSend,

        openReceive:
            openReceive,

        openWallets:
            openWallets,

        openActivity:
            openActivity,

        openSettings:
            openSettings,

        openProfile:
            openProfile,

        openSecurity:
            openSecurity,

        openPrivacy:
            openPrivacy,

        openTerms:
            openTerms,

        updateHome:
            refreshAuthenticatedUI,

        updateWalletUI:
            updateWalletUI,

        updateActivity:
            updateActivityScreen,

        showToast:
            showToast,

        showError:
            showError,

        openConfirmationModal:
            openConfirmationModal,

        closeConfirmationModal:
            closeConfirmationModal,

        getCurrentScreen:
            function () {
                return state.currentScreen;
            },

        isInitialized:
            function () {
                return state.initialized;
            }
    };

    // ---------------------------------------------------------
    // Start
    // ---------------------------------------------------------

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            initializeApp
        );

    } else {

        initializeApp();
    }

})();
