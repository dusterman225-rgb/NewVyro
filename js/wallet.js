/* =========================================================
   VYRO — WALLET SYSTEM
   New Build / Solana Wallet Foundation
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


    const STORAGE =
        CONFIG.storage || {};


    const WALLET_LIST_KEY =
        STORAGE.walletList ||
        "vyro_wallet_list";


    const ACTIVE_WALLET_KEY =
        STORAGE.activeWallet ||
        "vyro_active_wallet";


    const CONNECTED_WALLET_KEY =
        STORAGE.connectedWallet ||
        "vyro_connected_wallet";


    const CONNECTED_WALLET_TYPE_KEY =
        STORAGE.connectedWalletType ||
        "vyro_connected_wallet_type";


    /* =======================================================
       STATE
       ======================================================= */

    let initialized = false;

    let connecting = false;

    let connected = false;

    let publicAddress = null;

    let walletType = null;

    let walletProvider = null;

    let walletNetwork = "solana";

    let walletConnectClient = null;

    let walletConnectSession = null;


    /* =======================================================
       STORAGE HELPERS
       ======================================================= */

    function readStorage(key) {

        try {

            const value =
                localStorage.getItem(key);

            if (!value) {
                return null;
            }

            return JSON.parse(value);

        } catch (error) {

            console.error(
                "VYRO Wallet: Storage read failed.",
                error
            );

            return null;
        }
    }


    function writeStorage(
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
                "VYRO Wallet: Storage write failed.",
                error
            );

            return false;
        }
    }


    function removeStorage(key) {

        try {

            localStorage.removeItem(
                key
            );

        } catch (error) {

            console.error(
                "VYRO Wallet: Storage removal failed.",
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
            getElement(screenId);


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
            getElement("toast");


        const messageElement =
            getElement("toast-message");


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


    function setWalletStatus(
        message,
        type
    ) {

        const status =
            getElement(
                "wallets-status"
            );


        if (!status) {
            return;
        }


        status.textContent =
            message || "";


        status.className =
            "form-status";


        if (type) {

            status.classList.add(
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
                "Connecting...";

        } else {

            button.disabled = false;

            button.textContent =
                button.dataset.originalText ||
                normalText ||
                button.textContent;
        }
    }


    /* =======================================================
       ADDRESS VALIDATION
       ======================================================= */

    function isValidSolanaAddress(
        address
    ) {

        if (
            typeof address !==
            "string"
        ) {

            return false;
        }


        const value =
            address.trim();


        /*
         * Solana public keys are normally represented as
         * base58 strings between 32 and 44 characters.
         *
         * This is a format check, not a cryptographic
         * verification of ownership.
         */

        if (
            value.length < 32 ||
            value.length > 44
        ) {

            return false;
        }


        return /^[1-9A-HJ-NP-Za-km-z]+$/.test(
            value
        );
    }


    /* =======================================================
       WALLET RECORDS
       ======================================================= */

    function getWalletList() {

        const list =
            readStorage(
                WALLET_LIST_KEY
            );


        if (!Array.isArray(list)) {

            return [];
        }


        return list;
    }


    function saveWalletList(list) {

        return writeStorage(
            WALLET_LIST_KEY,
            list
        );
    }


    function createWalletId(
        address
    ) {

        return (
            "solana_" +
            address
        );
    }


    function saveWalletToList(
        wallet
    ) {

        if (
            !wallet ||
            !wallet.address
        ) {

            return false;
        }


        const list =
            getWalletList();


        const existingIndex =
            list.findIndex(
                function (item) {

                    return (
                        item.address ===
                        wallet.address
                    );
                }
            );


        const now =
            new Date().toISOString();


        const record = {

            id:
                wallet.id ||
                createWalletId(
                    wallet.address
                ),

            address:
                wallet.address,

            type:
                wallet.type ||
                "External Wallet",

            network:
                wallet.network ||
                "solana",

            provider:
                wallet.provider ||
                wallet.type ||
                "External Wallet",

            connectedAt:
                wallet.connectedAt ||
                now,

            lastUsedAt:
                now
        };


        if (
            existingIndex >= 0
        ) {

            list[existingIndex] =
                Object.assign(
                    {},
                    list[existingIndex],
                    record
                );

        } else {

            list.push(
                record
            );
        }


        saveWalletList(
            list
        );


        setActiveWallet(
            record
        );


        return true;
    }


    function removeWalletFromList(
        address
    ) {

        if (!address) {
            return false;
        }


        const list =
            getWalletList();


        const filtered =
            list.filter(
                function (wallet) {

                    return (
                        wallet.address !==
                        address
                    );
                }
            );


        saveWalletList(
            filtered
        );


        const active =
            getActiveWallet();


        if (
            active &&
            active.address ===
            address
        ) {

            if (filtered.length > 0) {

                setActiveWallet(
                    filtered[0]
                );

            } else {

                removeStorage(
                    ACTIVE_WALLET_KEY
                );
            }
        }


        return true;
    }


    function setActiveWallet(
        wallet
    ) {

        if (
            !wallet ||
            !wallet.address
        ) {

            return false;
        }


        return writeStorage(
            ACTIVE_WALLET_KEY,
            wallet
        );
    }


    function getActiveWallet() {

        return readStorage(
            ACTIVE_WALLET_KEY
        );
    }


    /* =======================================================
       CURRENT CONNECTION STATE
       ======================================================= */

    function setConnectionState(
        wallet
    ) {

        if (
            !wallet ||
            !wallet.address
        ) {

            connected = false;

            publicAddress = null;

            walletType = null;

            walletProvider = null;

            return;
        }


        connected = true;

        publicAddress =
            wallet.address;

        walletType =
            wallet.type ||
            "External Wallet";

        walletProvider =
            wallet.provider ||
            walletType;

        walletNetwork =
            wallet.network ||
            "solana";


        writeStorage(
            CONNECTED_WALLET_KEY,
            publicAddress
        );


        writeStorage(
            CONNECTED_WALLET_TYPE_KEY,
            walletType
        );


        saveWalletToList(
            wallet
        );
    }


    function clearConnectionState() {

        connected = false;

        connecting = false;

        publicAddress = null;

        walletType = null;

        walletProvider = null;

        walletConnectSession =
            null;


        removeStorage(
            CONNECTED_WALLET_KEY
        );


        removeStorage(
            CONNECTED_WALLET_TYPE_KEY
        );
    }


    /* =======================================================
       TRUST WALLET / STANDARD SOLANA PROVIDER
       ======================================================= */

    function getTrustWalletProvider() {

        if (
            typeof window ===
            "undefined"
        ) {

            return null;
        }


        /*
         * Trust Wallet may expose a Solana provider through
         * window.trustwallet.solana.
         */

        if (
            window.trustwallet &&
            window.trustwallet.solana
        ) {

            return window
                .trustwallet
                .solana;
        }


        return null;
    }


    async function connectTrustWallet() {

        const provider =
            getTrustWalletProvider();


        if (!provider) {

            return {
                success: false,
                code: "provider-not-found",
                message:
                    "Trust Wallet was not detected."
            };
        }


        try {

            let response;


            /*
             * Standard wallet connection.
             */

            if (
                typeof provider.connect ===
                "function"
            ) {

                response =
                    await provider.connect();
            }


            let address = null;


            /*
             * Different wallet providers can return the
             * public key in slightly different forms.
             */

            if (
                response &&
                response.publicKey
            ) {

                address =
                    response.publicKey
                        .toString();

            } else if (
                provider.publicKey
            ) {

                address =
                    provider.publicKey
                        .toString();
            }


            if (
                !isValidSolanaAddress(
                    address
                )
            ) {

                return {
                    success: false,
                    code: "invalid-address",
                    message:
                        "The wallet did not provide a valid Solana address."
                };
            }


            const wallet = {

                address:
                    address,

                type:
                    "Trust Wallet",

                provider:
                    "Trust Wallet",

                network:
                    "solana"
            };


            walletProvider =
                provider;


            setConnectionState(
                wallet
            );


            return {
                success: true,
                wallet: wallet
            };


        } catch (error) {

            console.error(
                "VYRO Trust Wallet connection error:",
                error
            );


            return {
                success: false,
                code:
                    error.code ||
                    "wallet-error",
                message:
                    error.message ||
                    "Trust Wallet connection was cancelled or failed."
            };
        }
    }


    /* =======================================================
       PHANTOM / STANDARD SOLANA PROVIDER
       ======================================================= */

    function getPhantomProvider() {

        if (
            typeof window ===
            "undefined"
        ) {

            return null;
        }


        /*
         * Phantom normally exposes:
         *
         * window.phantom.solana
         *
         * and in some environments:
         *
         * window.solana
         */

        if (
            window.phantom &&
            window.phantom.solana
        ) {

            return window
                .phantom
                .solana;
        }


        if (
            window.solana
        ) {

            return window.solana;
        }


        return null;
    }


    async function connectPhantom() {

        const provider =
            getPhantomProvider();


        if (!provider) {

            return {
                success: false,
                code: "provider-not-found",
                message:
                    "Phantom was not detected."
            };
        }


        try {

            const response =
                await provider.connect();


            let address = null;


            if (
                response &&
                response.publicKey
            ) {

                address =
                    response.publicKey
                        .toString();

            } else if (
                provider.publicKey
            ) {

                address =
                    provider.publicKey
                        .toString();
            }


            if (
                !isValidSolanaAddress(
                    address
                )
            ) {

                return {
                    success: false,
                    code: "invalid-address",
                    message:
                        "Phantom did not provide a valid Solana address."
                };
            }


            const wallet = {

                address:
                    address,

                type:
                    "Phantom",

                provider:
                    "Phantom",

                network:
                    "solana"
            };


            walletProvider =
                provider;


            setConnectionState(
                wallet
            );


            return {
                success: true,
                wallet: wallet
            };


        } catch (error) {

            console.error(
                "VYRO Phantom connection error:",
                error
            );


            return {
                success: false,
                code:
                    error.code ||
                    "wallet-error",
                message:
                    error.message ||
                    "Phantom connection was cancelled or failed."
            };
        }
    }


    /* =======================================================
       WALLETCONNECT
       ======================================================= */

    const SOLANA_CHAIN =
        "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp";


    async function connectWalletConnect() {

        const walletConnectConfig =
            CONFIG.walletConnect || {};


        if (
            !walletConnectConfig.configured ||
            !walletConnectConfig.projectId
        ) {

            return {
                success: false,
                code:
                    "walletconnect-not-configured",
                message:
                    "WalletConnect is not configured yet."
            };
        }


        /*
         * The actual WalletConnect SignClient must be loaded
         * before this function can run.
         *
         * We intentionally check for it instead of assuming
         * a library exists.
         */

        if (
            typeof window ===
            "undefined"
        ) {

            return {
                success: false,
                code: "browser-required",
                message:
                    "Wallet connection requires a browser environment."
            };
        }


        let SignClientConstructor =
            null;


        if (
            window.SignClient
        ) {

            SignClientConstructor =
                window.SignClient;

        } else if (
            window.WalletConnectSignClient
        ) {

            SignClientConstructor =
                window.WalletConnectSignClient;
        }


        if (
            !SignClientConstructor
        ) {

            return {
                success: false,
                code:
                    "walletconnect-sdk-missing",
                message:
                    "WalletConnect is not loaded yet."
            };
        }


        try {

            if (
                !walletConnectClient
            ) {

                walletConnectClient =
                    await SignClientConstructor.init({

                        projectId:
                            walletConnectConfig.projectId,

                        metadata:
                            walletConnectConfig.metadata ||
                            {
                                name: "VYRO",
                                description:
                                    "Send and receive crypto using a username.",
                                url: "",
                                icons: []
                            }
                    });
            }


            /*
             * A WalletConnect session requires a wallet that
             * supports the requested Solana namespace.
             */

            const namespaces = {

                solana: {

                    chains: [
                        SOLANA_CHAIN
                    ],

                    methods: [
                        "solana_signTransaction",
                        "solana_signMessage"
                    ],

                    events: []
                }
            };


            const pairResult =
                await walletConnectClient.connect({

                    requiredNamespaces:
                        namespaces
                });


            /*
             * Depending on the SignClient version, URI may
             * need to be presented to a wallet separately.
             *
             * If no session exists yet, VYRO reports that the
             * wallet pairing step still needs to be completed.
             */

            if (
                !pairResult ||
                !pairResult.session
            ) {

                return {
                    success: false,
                    code:
                        "walletconnect-pairing-required",
                    uri:
                        pairResult
                            ? pairResult.uri ||
                              null
                            : null,
                    message:
                        "WalletConnect pairing has started. Complete the connection in your wallet."
                };
            }


            walletConnectSession =
                pairResult.session;


            const accounts =
                walletConnectSession
                    .namespaces &&
                walletConnectSession
                    .namespaces.solana &&
                walletConnectSession
                    .namespaces.solana
                    .accounts;


            let address = null;


            if (
                Array.isArray(accounts) &&
                accounts.length > 0
            ) {

                const account =
                    accounts[0];


                /*
                 * WalletConnect CAIP account format:
                 *
                 * solana:<chain>:<address>
                 */

                const parts =
                    account.split(":");


                address =
                    parts[
                        parts.length - 1
                    ];
            }


            if (
                !isValidSolanaAddress(
                    address
                )
            ) {

                return {
                    success: false,
                    code:
                        "invalid-address",
                    message:
                        "WalletConnect did not provide a valid Solana address."
                };
            }


            const wallet = {

                address:
                    address,

                type:
                    "WalletConnect",

                provider:
                    "WalletConnect",

                network:
                    "solana"
            };


            setConnectionState(
                wallet
            );


            return {
                success: true,
                wallet: wallet,
                session:
                    walletConnectSession
            };


        } catch (error) {

            console.error(
                "VYRO WalletConnect error:",
                error
            );


            return {
                success: false,
                code:
                    error.code ||
                    "walletconnect-error",
                message:
                    error.message ||
                    "WalletConnect connection failed."
            };
        }
    }


    /* =======================================================
       GENERIC WALLET CONNECTION
       ======================================================= */

    async function connectWallet(
        providerType
    ) {

        if (connecting) {

            return {
                success: false,
                code: "already-connecting",
                message:
                    "A wallet connection is already in progress."
            };
        }


        connecting = true;


        try {

            let result;


            switch (
                String(
                    providerType ||
                    ""
                ).toLowerCase()
            ) {

                case "phantom":

                    result =
                        await connectPhantom();

                    break;


                case "trust":

                case "trustwallet":

                case "trust wallet":

                    result =
                        await connectTrustWallet();

                    break;


                case "walletconnect":

                    result =
                        await connectWalletConnect();

                    break;


                default:

                    result = {

                        success: false,

                        code:
                            "unsupported-provider",

                        message:
                            "That wallet provider is not supported yet."
                    };
            }


            if (
                result &&
                result.success
            ) {

                updateWalletUI();

            }


            return result;


        } finally {

            connecting = false;
        }
    }


    /* =======================================================
       DISCONNECT
       ======================================================= */

    async function disconnectWallet() {

        try {

            if (
                walletProvider &&
                typeof walletProvider.disconnect ===
                "function"
            ) {

                await walletProvider.disconnect();
            }


            if (
                walletConnectClient &&
                walletConnectSession
            ) {

                try {

                    await walletConnectClient.disconnect({
                        topic:
                            walletConnectSession.topic,
                        reason: {
                            code: 6000,
                            message:
                                "Disconnected by user"
                        }
                    });

                } catch (walletConnectError) {

                    console.warn(
                        "VYRO: WalletConnect disconnect warning.",
                        walletConnectError
                    );
                }
            }

        } catch (error) {

            console.warn(
                "VYRO: Wallet disconnect warning.",
                error
            );
        }


        clearConnectionState();

        updateWalletUI();


        showToast(
            "Wallet disconnected."
        );


        return {
            success: true
        };
    }


    /* =======================================================
       RESTORE SAVED CONNECTION
       ======================================================= */

    async function restoreConnection() {

        const savedAddress =
            readStorage(
                CONNECTED_WALLET_KEY
            );


        const savedType =
            readStorage(
                CONNECTED_WALLET_TYPE_KEY
            );


        /*
         * The saved address is NOT treated as proof that the
         * wallet is currently connected.
         *
         * We first check whether the wallet provider is
         * actually available.
         */

        if (
            !savedAddress ||
            !savedType
        ) {

            return false;
        }


        let provider = null;


        if (
            savedType ===
            "Phantom"
        ) {

            provider =
                getPhantomProvider();

        } else if (
            savedType ===
            "Trust Wallet"
        ) {

            provider =
                getTrustWalletProvider();
        }


        /*
         * Without a live provider we don't claim a live
         * connection.
         */

        if (!provider) {

            connected = false;

            publicAddress = null;

            walletType = null;

            walletProvider = null;

            return false;
        }


        /*
         * Check the provider's current public key.
         */

        let providerAddress =
            null;


        try {

            if (
                provider.publicKey
            ) {

                providerAddress =
                    provider.publicKey
                        .toString();
            }

        } catch (error) {

            console.warn(
                "VYRO: Could not read saved wallet connection.",
                error
            );
        }


        if (
            !isValidSolanaAddress(
                providerAddress
            )
        ) {

            return false;
        }


        /*
         * Only restore if the provider address matches the
         * address VYRO previously saved.
         */

        if (
            providerAddress !==
            savedAddress
        ) {

            return false;
        }


        const wallet = {

            address:
                providerAddress,

            type:
                savedType,

            provider:
                savedType,

            network:
                "solana"
        };


        walletProvider =
            provider;


        setConnectionState(
            wallet
        );


        updateWalletUI();


        return true;
    }


    /* =======================================================
       WALLET DISPLAY
       ======================================================= */

    function shortenAddress(
        address
    ) {

        if (
            !address ||
            address.length < 12
        ) {

            return address || "";
        }


        return (
            address.slice(0, 6) +
            "..." +
            address.slice(-6)
        );
    }


    function updateConnectedWalletScreen() {

        const typeElement =
            getElement(
                "connected-wallet-type"
            );


        const addressElement =
            getElement(
                "connected-wallet-address"
            );


        const networkElement =
            getElement(
                "connected-wallet-network"
            );


        if (typeElement) {

            typeElement.textContent =
                walletType ||
                "Wallet";
        }


        if (addressElement) {

            addressElement.textContent =
                shortenAddress(
                    publicAddress
                );
        }


        if (networkElement) {

            const network =
                HELPERS &&
                typeof HELPERS.getNetwork ===
                "function"
                    ? HELPERS.getNetwork(
                        walletNetwork
                    )
                    : null;


            networkElement.textContent =
                network
                    ? network.name
                    : "Solana";
        }
    }


    function updateHomeWallet() {

        const nameElement =
            getElement(
                "home-wallet-name"
            );


        const addressElement =
            getElement(
                "home-wallet-address"
            );


        const statusElement =
            getElement(
                "home-wallet-status"
            );


        if (!connected) {

            if (nameElement) {

                nameElement.textContent =
                    "No wallet connected";
            }


            if (addressElement) {

                addressElement.textContent =
                    "Connect a wallet to get started";
            }


            if (statusElement) {

                statusElement.textContent =
                    "Not connected";
            }


            return;
        }


        if (nameElement) {

            nameElement.textContent =
                walletType ||
                "External Wallet";
        }


        if (addressElement) {

            addressElement.textContent =
                shortenAddress(
                    publicAddress
                );
        }


        if (statusElement) {

            statusElement.textContent =
                "Connected";
        }
    }


    function renderWalletList() {

        const listElement =
            getElement(
                "wallet-list"
            );


        const emptyElement =
            getElement(
                "wallet-list-empty"
            );


        if (!listElement) {
            return;
        }


        const wallets =
            getWalletList();


        /*
         * Remove previously rendered wallet entries while
         * preserving the empty-state element.
         */

        const existingItems =
            listElement.querySelectorAll(
                "[data-vyro-wallet-item]"
            );


        existingItems.forEach(
            function (item) {

                item.remove();

            }
        );


        if (
            wallets.length === 0
        ) {

            if (emptyElement) {

                emptyElement.hidden =
                    false;
            }


            return;
        }


        if (emptyElement) {

            emptyElement.hidden =
                true;
        }


        wallets.forEach(
            function (wallet) {

                const item =
                    document.createElement(
                        "div"
                    );


                item.dataset.vyroWalletItem =
                    "true";


                item.className =
                    "wallet-item";


                const info =
                    document.createElement(
                        "div"
                    );


                info.className =
                    "wallet-item-info";


                const name =
                    document.createElement(
                        "div"
                    );


                name.className =
                    "wallet-item-name";


                name.textContent =
                    wallet.type ||
                    wallet.provider ||
                    "External Wallet";


                const address =
                    document.createElement(
                        "div"
                    );


                address.className =
                    "wallet-item-address";


                address.textContent =
                    shortenAddress(
                        wallet.address
                    );


                info.appendChild(
                    name
                );


                info.appendChild(
                    address
                );


                const action =
                    document.createElement(
                        "button"
                    );


                action.type =
                    "button";


                action.className =
                    "secondary-btn wallet-select-btn";


                action.textContent =
                    (
                        publicAddress ===
                        wallet.address
                    )
                        ? "Active"
                        : "Use";


                action.addEventListener(
                    "click",
                    function () {

                        setActiveWallet(
                            wallet
                        );


                        showToast(
                            "Wallet selected."
                        );


                        renderWalletList();
                    }
                );


                item.appendChild(
                    info
                );


                item.appendChild(
                    action
                );


                listElement.appendChild(
                    item
                );
            }
        );
    }


    function updateWalletUI() {

        updateConnectedWalletScreen();

        updateHomeWallet();

        renderWalletList();
    }


    /* =======================================================
       CONNECT BUTTON HANDLERS
       ======================================================= */

    async function handlePhantomConnect() {

        const button =
            getElement(
                "phantom-wallet-btn"
            );


        setButtonLoading(
            button,
            true
        );


        const result =
            await connectWallet(
                "phantom"
            );


        setButtonLoading(
            button,
            false,
            "Connect Phantom"
        );


        if (!result.success) {

            setWalletStatus(
                result.message,
                "error"
            );


            showToast(
                result.message
            );


            return;
        }


        setWalletStatus(
            "Phantom connected.",
            "success"
        );


        showToast(
            "Wallet connected."
        );


        showScreen(
            "wallet-connected-screen"
        );
    }


    async function handleTrustConnect() {

        const button =
            getElement(
                "trust-wallet-btn"
            );


        setButtonLoading(
            button,
            true
        );


        const result =
            await connectWallet(
                "trust"
            );


        setButtonLoading(
            button,
            false,
            "Connect Trust Wallet"
        );


        if (!result.success) {

            setWalletStatus(
                result.message,
                "error"
            );


            showToast(
                result.message
            );


            return;
        }


        setWalletStatus(
            "Trust Wallet connected.",
            "success"
        );


        showToast(
            "Wallet connected."
        );


        showScreen(
            "wallet-connected-screen"
        );
    }


    async function handleWalletConnect() {

        const button =
            getElement(
                "walletconnect-btn"
            );


        setButtonLoading(
            button,
            true
        );


        const result =
            await connectWallet(
                "walletconnect"
            );


        setButtonLoading(
            button,
            false,
            "Connect with WalletConnect"
        );


        if (!result.success) {

            setWalletStatus(
                result.message,
                "warning"
            );


            showToast(
                result.message
            );


            return;
        }


        setWalletStatus(
            "WalletConnect wallet connected.",
            "success"
        );


        showToast(
            "Wallet connected."
        );


        showScreen(
            "wallet-connected-screen"
        );
    }


    /* =======================================================
       DISCONNECT BUTTON
       ======================================================= */

    async function handleDisconnect() {

        await disconnectWallet();
    }


    /* =======================================================
       EVENT BINDING
       ======================================================= */

    function bindEvents() {

        const phantomButton =
            getElement(
                "phantom-wallet-btn"
            );


        if (phantomButton) {

            phantomButton.addEventListener(
                "click",
                handlePhantomConnect
            );
        }


        const trustButton =
            getElement(
                "trust-wallet-btn"
            );


        if (trustButton) {

            trustButton.addEventListener(
                "click",
                handleTrustConnect
            );
        }


        const walletConnectButton =
            getElement(
                "walletconnect-btn"
            );


        if (walletConnectButton) {

            walletConnectButton.addEventListener(
                "click",
                handleWalletConnect
            );
        }


        const disconnectButton =
            getElement(
                "disconnect-wallet-btn"
            );


        if (disconnectButton) {

            disconnectButton.addEventListener(
                "click",
                handleDisconnect
            );
        }


        const connectWalletButton =
            getElement(
                "connect-wallet-btn"
            );


        if (connectWalletButton) {

            connectWalletButton.addEventListener(
                "click",
                function () {

                    showScreen(
                        "connect-wallet-screen"
                    );
                }
            );
        }


        const continueButton =
            getElement(
                "wallet-connected-continue-btn"
            );


        if (continueButton) {

            continueButton.addEventListener(
                "click",
                function () {

                    updateWalletUI();

                    showScreen(
                        "home-screen"
                    );
                }
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

        restoreConnection();

        updateWalletUI();


        initialized = true;


        console.log(
            "VYRO Wallet System initialized."
        );
    }


    /* =======================================================
       PUBLIC API
       ======================================================= */

    window.VYRO_WALLETS =
        Object.freeze({

            initialize:
                initialize,

            connect:
                connectWallet,

            disconnect:
                disconnectWallet,

            restore:
                restoreConnection,

            getWalletList:
                getWalletList,

            getActiveWallet:
                getActiveWallet,

            setActiveWallet:
                setActiveWallet,

            removeWallet:
                removeWalletFromList,

            getPublicAddress:
                function () {
                    return publicAddress;
                },

            getWalletType:
                function () {
                    return walletType;
                },

            getWalletNetwork:
                function () {
                    return walletNetwork;
                },

            isConnected:
                function () {
                    return connected;
                },

            isConnecting:
                function () {
                    return connecting;
                },

            isValidSolanaAddress:
                isValidSolanaAddress,

            shortenAddress:
                shortenAddress
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
