/* =========================================================
   VYRO — CONFIGURATION
   New Build / Foundation
   ========================================================= */

(function () {
    "use strict";

    /*
     * =======================================================
     * APP CONFIGURATION
     * =======================================================
     */

    const VYRO_CONFIG = {

        /* ---------------------------------------------------
           Application
           --------------------------------------------------- */

        app: {
            name: "VYRO",
            title: "VYRO — Crypto. Simple.",
            version: "1.0.0",
            environment: "development"
        },


        /* ---------------------------------------------------
           Product
           --------------------------------------------------- */

        product: {
            custody: "non-custodial",
            kyc: false,
            walletRequiredForTransfers: true,
            inAppCryptoPurchase: false
        },


        /* ---------------------------------------------------
           Default Blockchain Configuration
           --------------------------------------------------- */

        network: {
            default: "solana",

            supported: {
                solana: {
                    id: "solana",
                    name: "Solana",
                    symbol: "SOL",
                    type: "blockchain",
                    enabled: true
                },

                /*
                 * Future networks can be added here without
                 * changing the rest of the application.
                 *
                 * litecoin: {
                 *     id: "litecoin",
                 *     name: "Litecoin",
                 *     symbol: "LTC",
                 *     type: "blockchain",
                 *     enabled: false
                 * }
                 */
            }
        },


        /* ---------------------------------------------------
           Default Asset Configuration
           --------------------------------------------------- */

        asset: {
            default: "usdc",

            supported: {
                usdc: {
                    id: "usdc",
                    name: "USD Coin",
                    symbol: "USDC",
                    network: "solana",
                    decimals: 6,
                    enabled: true
                }

                /*
                 * Future assets can be added here.
                 */
            }
        },


        /* ---------------------------------------------------
           Solana Configuration
           --------------------------------------------------- */

        solana: {
            mainnet: {
                enabled: true,

                /*
                 * Solana mainnet-beta cluster.
                 *
                 * RPC endpoints should be configured separately
                 * if/when VYRO uses a dedicated RPC provider.
                 */
                cluster: "mainnet-beta"
            }
        },


        /* ---------------------------------------------------
           Firebase Configuration
           ---------------------------------------------------
           
           IMPORTANT:
           Do NOT put private keys or server credentials here.

           Firebase browser configuration is normally safe to
           expose, but the actual project configuration belongs
           in firebase-config.js.

           These values intentionally remain empty until the
           correct Firebase project information is supplied.
           --------------------------------------------------- */

        firebase: {
            enabled: true,

            configured: false,

            apiKey: "",
            authDomain: "",
            projectId: "",
            storageBucket: "",
            messagingSenderId: "",
            appId: ""
        },


        /* ---------------------------------------------------
           WalletConnect Configuration
           ---------------------------------------------------
           
           The Project ID must be supplied separately.

           Never invent or reuse a Project ID.

           This configuration is intentionally disabled until
           the real Project ID is provided.
           --------------------------------------------------- */

        walletConnect: {
            enabled: true,

            configured: false,

            projectId: "",

            metadata: {
                name: "VYRO",
                description: "Send and receive crypto using a username.",
                url: "",
                icons: []
            }
        },


        /* ---------------------------------------------------
           Username Rules
           --------------------------------------------------- */

        username: {
            minimumLength: 3,
            maximumLength: 20,

            /*
             * Lowercase letters, numbers and underscores.
             *
             * Example:
             * dusty
             * dusty_123
             */
            pattern: /^[a-z0-9_]+$/,

            prefix: "@"
        },


        /* ---------------------------------------------------
           Recognition Word
           --------------------------------------------------- */

        recognitionWord: {
            minimumLength: 3,
            maximumLength: 30,

            /*
             * Allows normal letters, numbers, spaces,
             * apostrophes and hyphens.
             */
            pattern: /^[a-zA-Z0-9][a-zA-Z0-9 '\-]*$/
        },


        /* ---------------------------------------------------
           Transfer Rules
           --------------------------------------------------- */

        payments: {

            minimumAmount: 0.000001,

            maximumAmount: null,

            requireWallet: true,

            requireRecipientUsername: true,

            requireRecipientConfirmation: true,

            defaultAsset: "usdc",

            defaultNetwork: "solana"
        },


        /* ---------------------------------------------------
           Local Storage Keys
           ---------------------------------------------------
           
           Centralizing these keys prevents different JS files
           from accidentally using different names.
           --------------------------------------------------- */

        storage: {

            user: "vyro_user",

            username: "vyro_username",

            email: "vyro_email",

            authState: "vyro_auth_state",

            emailVerified: "vyro_email_verified",

            twoFactor: "vyro_two_factor",

            walletList: "vyro_wallet_list",

            activeWallet: "vyro_active_wallet",

            connectedWallet: "vyro_connected_wallet",

            connectedWalletType: "vyro_connected_wallet_type",

            pendingPayment: "vyro_pending_payment",

            transactions: "vyro_transactions",

            appState: "vyro_app_state"
        },


        /* ---------------------------------------------------
           Session Configuration
           --------------------------------------------------- */

        session: {

            loginRequiredForApp: true,

            rememberLogin: true
        },


        /* ---------------------------------------------------
           UI Configuration
           --------------------------------------------------- */

        ui: {

            defaultScreen: "welcome-screen",

            authenticatedScreen: "home-screen",

            loadingDelay: 150,

            toastDuration: 3500
        },


        /* ---------------------------------------------------
           Feature Flags
           ---------------------------------------------------
           
           These allow us to turn features on/off without
           rewriting the application architecture.
           --------------------------------------------------- */

        features: {

            usernameTransfers: true,

            walletConnections: true,

            multipleWallets: true,

            send: true,

            receive: true,

            activity: true,

            transactionHistory: true,

            twoFactorAuthentication: true,

            profile: true,

            security: true,

            privacy: true,

            terms: true,

            firebaseAuthentication: true,

            walletConnect: true,

            phantomWallet: true,

            trustWallet: true
        }
    };


    /*
     * =======================================================
     * CONFIGURATION HELPERS
     * =======================================================
     */

    function getNetwork(networkId) {

        if (!networkId) {
            networkId = VYRO_CONFIG.network.default;
        }

        return VYRO_CONFIG.network.supported[networkId] || null;
    }


    function getAsset(assetId) {

        if (!assetId) {
            assetId = VYRO_CONFIG.asset.default;
        }

        return VYRO_CONFIG.asset.supported[assetId] || null;
    }


    function isNetworkSupported(networkId) {

        const network = getNetwork(networkId);

        return !!(
            network &&
            network.enabled === true
        );
    }


    function isAssetSupported(assetId) {

        const asset = getAsset(assetId);

        return !!(
            asset &&
            asset.enabled === true
        );
    }


    function normalizeUsername(username) {

        if (typeof username !== "string") {
            return "";
        }

        return username
            .trim()
            .replace(/^@+/, "")
            .toLowerCase();
    }


    function isValidUsername(username) {

        const normalized = normalizeUsername(username);

        if (
            normalized.length <
            VYRO_CONFIG.username.minimumLength
        ) {
            return false;
        }

        if (
            normalized.length >
            VYRO_CONFIG.username.maximumLength
        ) {
            return false;
        }

        return VYRO_CONFIG.username.pattern.test(normalized);
    }


    function isValidRecognitionWord(word) {

        if (typeof word !== "string") {
            return false;
        }

        const value = word.trim();

        if (
            value.length <
            VYRO_CONFIG.recognitionWord.minimumLength
        ) {
            return false;
        }

        if (
            value.length >
            VYRO_CONFIG.recognitionWord.maximumLength
        ) {
            return false;
        }

        return VYRO_CONFIG.recognitionWord.pattern.test(value);
    }


    /*
     * =======================================================
     * PUBLIC API
     * =======================================================
     *
     * Other VYRO files can use:
     *
     * VYRO_CONFIG
     * VYRO_CONFIG_HELPERS
     *
     * =======================================================
     */

    window.VYRO_CONFIG = Object.freeze(
        VYRO_CONFIG
    );


    window.VYRO_CONFIG_HELPERS = Object.freeze({

        getNetwork: getNetwork,

        getAsset: getAsset,

        isNetworkSupported: isNetworkSupported,

        isAssetSupported: isAssetSupported,

        normalizeUsername: normalizeUsername,

        isValidUsername: isValidUsername,

        isValidRecognitionWord: isValidRecognitionWord
    });


    /*
     * =======================================================
     * BASIC CONFIGURATION CHECK
     * =======================================================
     *
     * This does NOT crash the application if external
     * credentials have not been configured yet.
     *
     * It simply reports the current state in the console.
     * =======================================================
     */

    if (VYRO_CONFIG.app.environment === "development") {

        console.log(
            "VYRO configuration loaded:",
            VYRO_CONFIG.app.version
        );

        console.log(
            "Default network:",
            VYRO_CONFIG.network.default
        );

        console.log(
            "Default asset:",
            VYRO_CONFIG.asset.default
        );

        console.log(
            "Firebase configured:",
            VYRO_CONFIG.firebase.configured
        );

        console.log(
            "WalletConnect configured:",
            VYRO_CONFIG.walletConnect.configured
        );
    }

})();
