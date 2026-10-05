/* =========================================================
   VYRO — PAYMENT ENGINE
   New Build / Payment Foundation
   ========================================================= */

(function () {
    "use strict";


    /* =======================================================
       CONFIGURATION
       ======================================================= */

    const CONFIG =
        window.VYRO_CONFIG || {};

    const HELPERS =
        window.VYRO_CONFIG_HELPERS || {};

    const AUTH =
        window.VYRO_AUTH || null;

    const WALLETS =
        window.VYRO_WALLETS || null;


    const STORAGE =
        CONFIG.storage || {};


    const PENDING_PAYMENT_KEY =
        STORAGE.pendingPayment ||
        "vyro_pending_payment";


    const TRANSACTIONS_KEY =
        STORAGE.transactions ||
        "vyro_transactions";


    /* =======================================================
       STATE
       ======================================================= */

    let initialized = false;


    /* =======================================================
       STORAGE
       ======================================================= */

    function saveStorage(
        key,
        value
    ) {

        try {

            localStorage.setItem(
                key,
                JSON.stringify(value)
            );

            return true;

        } catch (error) {

            console.error(
                "VYRO Payments: Could not save data.",
                error
            );

            return false;
        }
    }


    function readStorage(key) {

        try {

            const value =
                localStorage.getItem(key);


            if (!value) {
                return null;
            }


            return JSON.parse(
                value
            );

        } catch (error) {

            console.error(
                "VYRO Payments: Could not read data.",
                error
            );

            return null;
        }
    }


    function removeStorage(key) {

        try {

            localStorage.removeItem(
                key
            );

        } catch (error) {

            console.error(
                "VYRO Payments: Could not remove data.",
                error
            );
        }
    }


    /* =======================================================
       UI HELPERS
       ======================================================= */

    function getElement(id) {

        return document.getElementById(
            id
        );
    }


    function showScreen(screenId) {

        const screens =
            document.querySelectorAll(
                ".screen"
            );


        screens.forEach(
            function (screen) {

                screen.classList.remove(
                    "active"
                );
            }
        );


        const target =
            getElement(
                screenId
            );


        if (target) {

            target.classList.add(
                "active"
            );


            window.scrollTo(
                0,
                0
            );
        }
    }


    function showToast(message) {

        const toast =
            getElement(
                "toast"
            );


        const messageElement =
            getElement(
                "toast-message"
            );


        if (
            !toast ||
            !messageElement
        ) {

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


    function setStatus(
        elementId,
        message,
        type
    ) {

        const element =
            getElement(
                elementId
            );


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


    /* =======================================================
       USERNAME
       ======================================================= */

    function normalizeUsername(
        username
    ) {

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
            .replace(
                /^@+/,
                ""
            )
            .toLowerCase();
    }


    function validateRecipientUsername(
        username
    ) {

        const value =
            normalizeUsername(
                username
            );


        if (!value) {

            return {
                valid: false,
                message:
                    "Enter a recipient username."
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
                        "Enter a valid VYRO username."
                };
            }

        } else {

            if (
                !/^[a-z0-9_]{3,20}$/.test(
                    value
                )
            ) {

                return {
                    valid: false,
                    message:
                        "Enter a valid VYRO username."
                };
            }
        }


        return {
            valid: true,
            value: value
        };
    }


    /* =======================================================
       AMOUNT
       ======================================================= */

    function parseAmount(
        amount
    ) {

        if (
            typeof amount ===
            "number"
        ) {

            return amount;
        }


        if (
            typeof amount !==
            "string"
        ) {

            return NaN;
        }


        const cleaned =
            amount
                .trim()
                .replace(
                    /,/g,
                    ""
                );


        if (!cleaned) {
            return NaN;
        }


        return Number(
            cleaned
        );
    }


    function validateAmount(
        amount
    ) {

        const numericAmount =
            parseAmount(
                amount
            );


        if (
            !Number.isFinite(
                numericAmount
            )
        ) {

            return {
                valid: false,
                message:
                    "Enter a valid amount."
            };
        }


        if (
            numericAmount <= 0
        ) {

            return {
                valid: false,
                message:
                    "Amount must be greater than zero."
            };
        }


        const minimum =
            CONFIG.payments &&
            CONFIG.payments.minimumAmount
                ? CONFIG.payments.minimumAmount
                : 0.000001;


        if (
            numericAmount <
            minimum
        ) {

            return {
                valid: false,
                message:
                    "Amount is below the minimum allowed."
            };
        }


        const maximum =
            CONFIG.payments
                ? CONFIG.payments.maximumAmount
                : null;


        if (
            maximum !== null &&
            maximum !== undefined &&
            numericAmount >
            maximum
        ) {

            return {
                valid: false,
                message:
                    "Amount exceeds the maximum allowed."
            };
        }


        return {
            valid: true,
            value: numericAmount
        };
    }


    /* =======================================================
       ASSET
       ======================================================= */

    function validateAsset(
        assetId
    ) {

        const value =
            String(
                assetId || ""
            )
            .trim()
            .toLowerCase();


        const defaultAsset =
            CONFIG.asset &&
            CONFIG.asset.default
                ? CONFIG.asset.default
                : "usdc";


        const selected =
            value ||
            defaultAsset;


        let asset = null;


        if (
            HELPERS &&
            typeof HELPERS.getAsset ===
            "function"
        ) {

            asset =
                HELPERS.getAsset(
                    selected
                );
        }


        if (!asset) {

            return {
                valid: false,
                message:
                    "That asset is not supported."
            };
        }


        if (
            asset.enabled !== true
        ) {

            return {
                valid: false,
                message:
                    "That asset is currently unavailable."
            };
        }


        return {
            valid: true,
            value: selected,
            asset: asset
        };
    }


    /* =======================================================
       NETWORK
       ======================================================= */

    function validateNetwork(
        networkId
    ) {

        const value =
            String(
                networkId || ""
            )
            .trim()
            .toLowerCase();


        const defaultNetwork =
            CONFIG.network &&
            CONFIG.network.default
                ? CONFIG.network.default
                : "solana";


        const selected =
            value ||
            defaultNetwork;


        let network = null;


        if (
            HELPERS &&
            typeof HELPERS.getNetwork ===
            "function"
        ) {

            network =
                HELPERS.getNetwork(
                    selected
                );
        }


        if (!network) {

            return {
                valid: false,
                message:
                    "That network is not supported."
            };
        }


        if (
            network.enabled !== true
        ) {

            return {
                valid: false,
                message:
                    "That network is currently unavailable."
            };
        }


        return {
            valid: true,
            value: selected,
            network: network
        };
    }


    /* =======================================================
       PAYMENT OBJECT
       ======================================================= */

    function createPayment(
        data
    ) {

        if (!data) {

            return {
                success: false,
                message:
                    "Payment information is missing."
            };
        }


        const recipientResult =
            validateRecipientUsername(
                data.recipient
            );


        if (
            !recipientResult.valid
        ) {

            return {
                success: false,
                field: "recipient",
                message:
                    recipientResult.message
            };
        }


        const amountResult =
            validateAmount(
                data.amount
            );


        if (
            !amountResult.valid
        ) {

            return {
                success: false,
                field: "amount",
                message:
                    amountResult.message
            };
        }


        const assetResult =
            validateAsset(
                data.asset
            );


        if (
            !assetResult.valid
        ) {

            return {
                success: false,
                field: "asset",
                message:
                    assetResult.message
            };
        }


        const networkResult =
            validateNetwork(
                data.network
            );


        if (
            !networkResult.valid
        ) {

            return {
                success: false,
                field: "network",
                message:
                    networkResult.message
            };
        }


        /*
         * Verify that the selected asset belongs to the
         * selected network.
         */

        if (
            assetResult.asset.network &&
            assetResult.asset.network !==
            networkResult.value
        ) {

            return {
                success: false,
                field: "network",
                message:
                    "The selected asset is not available on that network."
            };
        }


        const now =
            new Date().toISOString();


        const payment = {

            id:
                "payment_" +
                Date.now() +
                "_" +
                Math.random()
                    .toString(36)
                    .slice(2, 8),

            type:
                "send",

            recipientUsername:
                recipientResult.value,

            recipientDisplay:
                "@" +
                recipientResult.value,

            recognitionWord:
                data.recognitionWord ||
                "",

            amount:
                amountResult.value,

            asset:
                assetResult.value,

            assetName:
                assetResult.asset.name,

            network:
                networkResult.value,

            networkName:
                networkResult.network.name,

            fee:
                null,

            status:
                "pending_review",

            createdAt:
                now,

            updatedAt:
                now
        };


        return {
            success: true,
            payment: payment
        };
    }


    /* =======================================================
       PENDING PAYMENT
       ======================================================= */

    function savePendingPayment(
        payment
    ) {

        if (!payment) {
            return false;
        }


        return saveStorage(
            PENDING_PAYMENT_KEY,
            payment
        );
    }


    function getPendingPayment() {

        return readStorage(
            PENDING_PAYMENT_KEY
        );
    }


    function clearPendingPayment() {

        removeStorage(
            PENDING_PAYMENT_KEY
        );
    }


    /* =======================================================
       PAYMENT VALIDATION
       ======================================================= */

    function validatePayment(
        payment
    ) {

        if (!payment) {

            return {
                valid: false,
                message:
                    "No payment is available."
            };
        }


        const recipientResult =
            validateRecipientUsername(
                payment.recipientUsername
            );


        if (
            !recipientResult.valid
        ) {

            return {
                valid: false,
                message:
                    recipientResult.message
            };
        }


        const amountResult =
            validateAmount(
                payment.amount
            );


        if (
            !amountResult.valid
        ) {

            return {
                valid: false,
                message:
                    amountResult.message
            };
        }


        const assetResult =
            validateAsset(
                payment.asset
            );


        if (
            !assetResult.valid
        ) {

            return {
                valid: false,
                message:
                    assetResult.message
            };
        }


        const networkResult =
            validateNetwork(
                payment.network
            );


        if (
            !networkResult.valid
        ) {

            return {
                valid: false,
                message:
                    networkResult.message
            };
        }


        return {
            valid: true
        };
    }


    /* =======================================================
       WALLET REQUIREMENT
       ======================================================= */

    function hasWallet() {

        if (!WALLETS) {
            return false;
        }


        if (
            typeof WALLETS.isConnected !==
            "function"
        ) {

            return false;
        }


        return WALLETS.isConnected();
    }


    function getWalletAddress() {

        if (!WALLETS) {
            return null;
        }


        if (
            typeof WALLETS.getPublicAddress !==
            "function"
        ) {

            return null;
        }


        return WALLETS.getPublicAddress();
    }


    /* =======================================================
       PREPARE SEND
       ======================================================= */

    function prepareSend(
        data
    ) {

        const result =
            createPayment(
                data
            );


        if (!result.success) {

            return result;
        }


        const payment =
            result.payment;


        /*
         * A wallet is required for a real send.
         *
         * We do not require one merely to build the review
         * object, because the user may reach the review screen
         * before connecting a wallet.
         */

        if (
            hasWallet()
        ) {

            payment.senderWallet =
                getWalletAddress();
        }


        savePendingPayment(
            payment
        );


        return {
            success: true,
            payment: payment
        };
    }


    /* =======================================================
       REVIEW DISPLAY
       ======================================================= */

    function updateReviewScreen(
        payment
    ) {

        if (!payment) {
            return;
        }


        const recipient =
            getElement(
                "review-recipient-username"
            );


        const word =
            getElement(
                "review-recipient-word"
            );


        const amount =
            getElement(
                "review-amount"
            );


        const asset =
            getElement(
                "review-asset"
            );


        const network =
            getElement(
                "review-network"
            );


        const fee =
            getElement(
                "review-fee"
            );


        if (recipient) {

            recipient.textContent =
                payment.recipientDisplay;
        }


        if (word) {

            word.textContent =
                payment.recognitionWord ||
                "—";
        }


        if (amount) {

            amount.textContent =
                formatAmount(
                    payment.amount
                );
        }


        if (asset) {

            asset.textContent =
                payment.asset;
        }


        if (network) {

            network.textContent =
                payment.networkName;
        }


        if (fee) {

            fee.textContent =
                payment.fee !== null &&
                payment.fee !== undefined
                    ? String(
                        payment.fee
                    )
                    : "Calculated when sent";
        }
    }


    function formatAmount(
        amount
    ) {

        const value =
            Number(
                amount
            );


        if (
            !Number.isFinite(
                value
            )
        ) {

            return "0";
        }


        return value.toLocaleString(
            "en-US",
            {
                maximumFractionDigits: 6
            }
        );
    }


    /* =======================================================
       SEND FORM
       ======================================================= */

    function handleSendSubmit(
        event
    ) {

        event.preventDefault();


        const recipient =
            getElement(
                "send-recipient"
            );


        const amount =
            getElement(
                "send-amount"
            );


        const asset =
            getElement(
                "send-asset"
            );


        const network =
            getElement(
                "send-network"
            );


        const recipientStatus =
            getElement(
                "send-recipient-status"
            );


        const result =
            prepareSend({

                recipient:
                    recipient
                        ? recipient.value
                        : "",

                amount:
                    amount
                        ? amount.value
                        : "",

                asset:
                    asset
                        ? asset.value
                        : "usdc",

                network:
                    network
                        ? network.value
                        : "solana"
            });


        if (!result.success) {

            if (
                result.field ===
                "recipient"
            ) {

                setStatus(
                    "send-recipient-status",
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
         * Clear recipient error.
         */

        if (recipientStatus) {

            recipientStatus.textContent =
                "";

            recipientStatus.className =
                "form-status";
        }


        updateReviewScreen(
            result.payment
        );


        showScreen(
            "send-review-screen"
        );
    }


    /* =======================================================
       REVIEW CONFIRMATION
       ======================================================= */

    function handleConfirmSend() {

        const payment =
            getPendingPayment();


        if (!payment) {

            showToast(
                "No payment is waiting for confirmation."
            );

            return;
        }


        const validation =
            validatePayment(
                payment
            );


        if (!validation.valid) {

            showToast(
                validation.message
            );

            return;
        }


        /*
         * A real blockchain transaction must never be marked
         * successful here.
         *
         * The next payment/transaction layer will:
         *
         * 1. Resolve the username.
         * 2. Obtain the recipient wallet address.
         * 3. Build the Solana USDC transaction.
         * 4. Ask the connected wallet to sign.
         * 5. Submit the signed transaction.
         * 6. Confirm the transaction on-chain.
         * 7. Record the result.
         */

        if (!hasWallet()) {

            showToast(
                "Connect a wallet before sending."
            );


            showScreen(
                "connect-wallet-screen"
            );


            return;
        }


        payment.status =
            "awaiting_wallet";

        payment.updatedAt =
            new Date().toISOString();

        payment.senderWallet =
            getWalletAddress();


        savePendingPayment(
            payment
        );


        showToast(
            "Wallet transaction signing will be connected next."
        );
    }


    /* =======================================================
       EDIT PAYMENT
       ======================================================= */

    function handleEditSend() {

        const payment =
            getPendingPayment();


        if (payment) {

            const recipient =
                getElement(
                    "send-recipient"
                );


            const amount =
                getElement(
                    "send-amount"
                );


            const asset =
                getElement(
                    "send-asset"
                );


            const network =
                getElement(
                    "send-network"
                );


            if (recipient) {

                recipient.value =
                    payment.recipientUsername;
            }


            if (amount) {

                amount.value =
                    payment.amount;
            }


            if (asset) {

                asset.value =
                    payment.asset;
            }


            if (network) {

                network.value =
                    payment.network;
            }
        }


        showScreen(
            "send-screen"
        );
    }


    /* =======================================================
       TRANSACTION STORAGE
       ======================================================= */

    function getTransactions() {

        const transactions =
            readStorage(
                TRANSACTIONS_KEY
            );


        if (
            !Array.isArray(
                transactions
            )
        ) {

            return [];
        }


        return transactions;
    }


    function saveTransaction(
        transaction
    ) {

        if (!transaction) {
            return false;
        }


        const transactions =
            getTransactions();


        transactions.unshift(
            transaction
        );


        return saveStorage(
            TRANSACTIONS_KEY,
            transactions
        );
    }


    function getTransactionById(
        transactionId
    ) {

        const transactions =
            getTransactions();


        return (
            transactions.find(
                function (transaction) {

                    return (
                        transaction.id ===
                        transactionId
                    );
                }
            ) ||
            null
        );
    }


    /* =======================================================
       TRANSACTION RECORD CREATION
       ======================================================= */

    function createLocalTransactionRecord(
        payment,
        status,
        transactionId
    ) {

        if (!payment) {
            return null;
        }


        return {

            id:
                transactionId ||
                payment.id,

            type:
                payment.type ||
                "send",

            status:
                status ||
                payment.status ||
                "pending",

            recipientUsername:
                payment.recipientUsername,

            recognitionWord:
                payment.recognitionWord ||
                "",

            amount:
                payment.amount,

            asset:
                payment.asset,

            network:
                payment.network,

            senderWallet:
                payment.senderWallet ||
                null,

            createdAt:
                payment.createdAt ||
                new Date().toISOString(),

            updatedAt:
                new Date().toISOString()
        };
    }


    /* =======================================================
       CLEAR PENDING PAYMENT
       ======================================================= */

    function cancelPendingPayment() {

        clearPendingPayment();


        showToast(
            "Payment cancelled."
        );
    }


    /* =======================================================
       EVENT BINDING
       ======================================================= */

    function bindEvents() {

        const sendForm =
            getElement(
                "send-form"
            );


        if (sendForm) {

            sendForm.addEventListener(
                "submit",
                handleSendSubmit
            );
        }


        const confirmButton =
            getElement(
                "confirm-send-btn"
            );


        if (confirmButton) {

            confirmButton.addEventListener(
                "click",
                handleConfirmSend
            );
        }


        const editButton =
            getElement(
                "edit-send-btn"
            );


        if (editButton) {

            editButton.addEventListener(
                "click",
                handleEditSend
            );
        }
    }


    /* =======================================================
       INITIALIZATION
       ======================================================= */

    function initialize() {

        if (initialized) {
            return;
        }


        bindEvents();


        initialized = true;


        console.log(
            "VYRO Payment Engine initialized."
        );
    }


    /* =======================================================
       PUBLIC API
       ======================================================= */

    window.VYRO_PAYMENTS =
        Object.freeze({

            initialize:
                initialize,

            createPayment:
                createPayment,

            prepareSend:
                prepareSend,

            validatePayment:
                validatePayment,

            validateUsername:
                validateRecipientUsername,

            validateAmount:
                validateAmount,

            validateAsset:
                validateAsset,

            validateNetwork:
                validateNetwork,

            getPendingPayment:
                getPendingPayment,

            savePendingPayment:
                savePendingPayment,

            clearPendingPayment:
                clearPendingPayment,

            cancelPendingPayment:
                cancelPendingPayment,

            getTransactions:
                getTransactions,

            saveTransaction:
                saveTransaction,

            getTransactionById:
                getTransactionById,

            createLocalTransactionRecord:
                createLocalTransactionRecord,

            hasWallet:
                hasWallet,

            getWalletAddress:
                getWalletAddress
        });


    /* =======================================================
       START
       ======================================================= */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            initialize
        );

    } else {

        initialize();
    }

})();
