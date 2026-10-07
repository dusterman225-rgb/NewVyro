
// =========================================================
// VYRO — SCREEN NAVIGATION
// =========================================================

const welcomeScreen = document.getElementById(
    "welcome-screen"
);

const createAccountScreen = document.getElementById(
    "create-account-screen"
);

const loginScreen = document.getElementById(
    "login-screen"
);

const emailVerificationScreen = document.getElementById(
    "email-verification-screen"
);

const twoFactorScreen = document.getElementById(
    "two-factor-screen"
);

const twoFactorCodeScreen = document.getElementById(
    "two-factor-code-screen"
);

const homeScreen = document.getElementById(
    "home-screen"
);

const sendScreen = document.getElementById(
    "send-screen"
);

const confirmPaymentScreen = document.getElementById(
    "confirm-payment-screen"
);

const receiveScreen = document.getElementById(
    "receive-screen"
);

// =========================================================
// VYRO — ADDITIONAL SCREEN REFERENCES
// =========================================================

const transactionHistoryScreen =
    document.getElementById(
        "transaction-history-screen"
    );

const transactionDetailsScreen =
    document.getElementById(
        "transaction-details-screen"
    );

const changeEmailScreen =
    document.getElementById(
        "change-email-screen"
    );

const changePasswordScreen =
    document.getElementById(
        "change-password-screen"
    );

const changeVerificationWordScreen =
    document.getElementById(
        "change-verification-word-screen"
    );

const deleteAccountScreen =
    document.getElementById(
        "delete-account-screen"
    );

const connectWalletScreen =
    document.getElementById(
        "connect-wallet-screen"
    );

const walletConnectedScreen =
    document.getElementById(
        "wallet-connected-screen"
    );

const paymentSuccessScreen =
    document.getElementById(
        "payment-success-screen"
    );

const paymentFailedScreen =
    document.getElementById(
        "payment-failed-screen"
    );


// =========================================================
// VYRO — ACCOUNT SCREENS
// =========================================================

const profileScreen =
    document.getElementById(
        "profile-screen"
    );

const settingsScreen =
    document.getElementById(
        "settings-screen"
    );

const securityScreen =
    document.getElementById(
        "security-screen"
    );

const walletsScreen =
    document.getElementById(
        "wallets-screen"
    );


// =========================================================
// VYRO — SHOW SCREEN
// =========================================================

function showScreen(screen, options) {
    if (!screen) {
        console.error("VYRO: Screen not found.");
        return;
    }

    const dropdown = document.getElementById("profile-dropdown");
    const profileButton = document.getElementById("profile-menu-btn");

    if (dropdown) {
        dropdown.classList.remove("open");
        dropdown.setAttribute("aria-hidden", "true");
    }
    if (profileButton) {
        profileButton.setAttribute("aria-expanded", "false");
    }

    document.querySelectorAll(".screen").forEach(function (item) {
        item.classList.remove("active");
    });

    screen.classList.add("active");

    const updateHistory = !options || options.updateHistory !== false;

    if (updateHistory && screen.id) {
        const currentState = history.state && history.state.vyroScreen;
        if (currentState !== screen.id) {
            history.pushState(
                { vyroScreen: screen.id },
                "",
                window.location.href
            );
        }
    }
}

// Make navigation helpers available to the other VYRO modules.
window.showScreen = showScreen;
// =========================================================
// VYRO STAGE 5
// WALLET SELECTORS — SEND / RECEIVE
// =========================================================

function formatWalletForSelector(wallet) {
    
    if (!wallet) {
        return "Select wallet";
    }
    
    const provider =
        wallet.provider ||
        "External Wallet";
    
    const address =
        wallet.address ||
        "";
    
    if (!address) {
        return provider;
    }
    
    return (
        provider +
        " • " +
        address.slice(0, 6) +
        "..." +
        address.slice(-4)
    );
}


// =========================================================
// POPULATE WALLET SELECTORS
// =========================================================

function populateWalletSelectors() {
    
    if (
        typeof VYROWallet ===
        "undefined"
    ) {
        return;
    }
    
    const wallets =
        VYROWallet.getWallets();
    
    const activeWallet =
        VYROWallet.getActiveWallet();
    
    
    const sendWallet =
        document.getElementById(
            "send-wallet"
        );
    
    const receiveWallet =
        document.getElementById(
            "receive-wallet"
        );
    
    
    function populateSelect(select) {
        
        if (!select) {
            return;
        }
        
        const previousValue =
            select.value;
        
        select.innerHTML = "";
        
        
        const placeholder =
            document.createElement(
                "option"
            );
        
        placeholder.value = "";
        
        placeholder.textContent =
            "Select wallet";
        
        select.appendChild(
            placeholder
        );
        
        
        wallets.forEach(
            function(wallet) {
                
                const option =
                    document.createElement(
                        "option"
                    );
                
                option.value =
                    wallet.address;
                
                option.textContent =
                    formatWalletForSelector(
                        wallet
                    );
                
                select.appendChild(
                    option
                );
            }
        );
        
        
        if (
            previousValue &&
            wallets.some(
                function(wallet) {
                    return (
                        wallet.address ===
                        previousValue
                    );
                }
            )
        ) {
            
            select.value =
                previousValue;
            
        } else if (
            activeWallet
        ) {
            
            select.value =
                activeWallet.address;
        }
    }
    
    
    populateSelect(
        sendWallet
    );
    
    populateSelect(
        receiveWallet
    );
}


// =========================================================
// UPDATE RECEIVE WALLET ADDRESS
// =========================================================

window.populateWalletSelectors = populateWalletSelectors;

function updateReceiveWalletDisplay() {
    
    const receiveWallet =
        document.getElementById(
            "receive-wallet"
        );
    
    const receiveAddress =
        document.getElementById(
            "receive-wallet-address"
        );
    
    
    if (
        !receiveWallet ||
        !receiveAddress
    ) {
        return;
    }
    
    
    const address =
        receiveWallet.value;
    
    
    if (!address) {
        
        receiveAddress.textContent =
            "Select a wallet";
        
        return;
    }
    
    
    receiveAddress.textContent =
        address.slice(0, 8) +
        "..." +
        address.slice(-6);
}


// =========================================================
// RECEIVE WALLET SELECTION
// =========================================================

const receiveWalletSelector =
    document.getElementById(
        "receive-wallet"
    );

if (receiveWalletSelector) {
    
    receiveWalletSelector.addEventListener(
        "change",
        function() {
            
            updateReceiveWalletDisplay();
            
        }
    );
}



// =========================================================
// VYRO — ANDROID / BROWSER BACK BUTTON
// =========================================================

window.addEventListener(
    "popstate",
    function(event) {
        
        const screenId =
            event.state &&
            event.state.vyroScreen;
        
        if (screenId) {
            
            const previousScreen =
                document.getElementById(
                    screenId
                );
            
            if (previousScreen) {
                
                showScreen(
                    previousScreen,
                    {
                        updateHistory: false
                    }
                );
                
                return;
            }
        }
        
        /*
         * If there is no VYRO history state,
         * return to the Welcome screen.
         */
        
        showScreen(
            welcomeScreen,
            {
                updateHistory: false
            }
        );
    }
);

// =========================================================
// VYRO — INITIAL BROWSER HISTORY STATE
// =========================================================

history.replaceState(
    {
        vyroScreen:
            document.querySelector(
                ".screen.active"
            )?.id || "welcome-screen"
    },
    "",
    window.location.href
);


// =========================================================
// WELCOME → CREATE ACCOUNT
// =========================================================

const getStartedButton = document.getElementById(
    "get-started-btn"
);

const createAccountBackButton = document.getElementById(
    "create-account-back"
);


if (getStartedButton) {

getStartedButton.addEventListener(
    "click",
    function () {

        showScreen(createAccountScreen);

    }
);
}



if (createAccountBackButton) {

createAccountBackButton.addEventListener(
    "click",
    function () {

        showScreen(welcomeScreen);

    }
);
}



// =========================================================
// WELCOME → LOGIN
// =========================================================

const loginButton = document.getElementById(
    "login-btn"
);

const loginBackButton = document.getElementById(
    "login-back"
);


if (loginButton) {

loginButton.addEventListener(
    "click",
    function () {

        showScreen(loginScreen);

    }
);
}



if (loginBackButton) {

loginBackButton.addEventListener(
    "click",
    function () {

        showScreen(welcomeScreen);

    }
);
}



// =========================================================
// EMAIL VERIFICATION
// =========================================================

const verifyEmailButton = document.getElementById(
    "verify-email-btn"
);

const resendEmailButton = document.getElementById(
    "resend-email-btn"
);

const emailVerificationBackButton =
    document.getElementById(
        "email-verification-back"
    );


// Email verification handlers are owned by js/auth.js.

// =========================================================
// EMAIL VERIFICATION → CREATE ACCOUNT
// =========================================================

if (emailVerificationBackButton) {

emailVerificationBackButton.addEventListener(
    "click",
    function () {

        showScreen(createAccountScreen);

    }
);
}



// =========================================================
// HOME — PROFILE MENU
// =========================================================

// The old Home VYRO logo button was replaced
// by the profile avatar.


// =========================================================
// HOME → SEND
// =========================================================

const sendButton = document.getElementById(
    "send-btn"
);


if (sendButton) {

sendButton.addEventListener(
    "click",
    function() {
        
        populateWalletSelectors();
        
        showScreen(
            sendScreen
        );
        
    }
);
}


// =========================================================
// 2FA NAVIGATION
// =========================================================

const twoFactorBackButton = document.getElementById("two-factor-back");

if (twoFactorBackButton) {
    twoFactorBackButton.addEventListener("click", function () {
        showScreen(emailVerificationScreen);
    });
}

// =========================================================
// 2FA — SKIP FOR NOW
// =========================================================

const skipTwoFactorButton =
    document.getElementById(
        "skip-two-factor-btn"
    );

if (skipTwoFactorButton) {

    skipTwoFactorButton.addEventListener(
        "click",
        async function () {

            console.log(
                "VYRO: SKIP FOR NOW clicked."
            );

            const user =
                firebaseAuth.currentUser;

            if (!user) {

                alert(
                    "Your account could not be found. Please log in again."
                );

                return;
            }

            try {

                console.log(
                    "VYRO: Saving 2FA preference..."
                );

                await firebaseDB
                    .collection("users")
                    .doc(user.uid)
                    .set(
                        {
                            twoFactorEnabled: false,
                            securitySetupComplete: true
                        },
                        {
                            merge: true
                        }
                    );

                console.log(
                    "VYRO: 2FA preference saved."
                );

                console.log(
                    "VYRO: Opening Home screen."
                );

                showScreen(
                    homeScreen
                );

            } catch (error) {

                console.error(
                    "VYRO 2FA SKIP ERROR:",
                    error
                );

                alert(
                    "Unable to save your security preference."
                );

            }

        }
    );

}

// =========================================================
// SEND NAVIGATION
// =========================================================

const sendBackButton = document.getElementById(
    "send-back-btn"
);

const sendHomeLogoButton = document.getElementById(
    "send-home-logo-btn"
);


if (sendBackButton) {

sendBackButton.addEventListener(
    "click",
    function () {

        showScreen(homeScreen);

    }
);
}



if (sendHomeLogoButton) {

sendHomeLogoButton.addEventListener(
    "click",
    function () {

        showScreen(homeScreen);

    }
);
}


// =========================================================
// 2FA — ENABLE
// =========================================================

const enableTwoFactorButton = document.getElementById(
    "enable-two-factor-btn"
);

if (enableTwoFactorButton) {

    enableTwoFactorButton.addEventListener(
        "click",
        async function () {

            const user = firebaseAuth.currentUser;

            if (!user) {

                alert(
                    "Your account could not be found. Please log in again."
                );

                return;
            }


            // =====================================================
            // TEMPORARY 2FA SETUP
            // =====================================================
            //
            // The secure email-code system will be connected
            // to this button after the server-side system is built.
            //
            // We do NOT enable 2FA yet because there is no
            // secure email verification code being generated.
            // =====================================================

            alert(
                "Two-factor authentication is not available yet. Until it is, your account is protected by your password and verified email."
            );

        }
    );

}


// =========================================================
// SEND → CONFIRM PAYMENT
// =========================================================

const continueSendButton = document.getElementById("continue-send-btn");

if (continueSendButton) {
    continueSendButton.addEventListener("click", async function () {
        if (continueSendButton.disabled) return;

        if (typeof VYROWallet === "undefined" || !VYROWallet.isConnected()) {
            alert("Please connect a wallet before sending.");
            return;
        }

        const selectedWallet = document.getElementById("send-wallet");
        if (!selectedWallet || !selectedWallet.value) {
            alert("Please select a wallet to send from.");
            return;
        }
        if (!VYROWallet.setActiveWallet(selectedWallet.value)) {
            alert("Unable to select that wallet.");
            return;
        }
        const sendingWallet = VYROWallet.getActiveWallet();
        if (!sendingWallet || !sendingWallet.address) {
            alert("Unable to determine the sending wallet.");
            return;
        }
        if (sendingWallet.network && sendingWallet.network !== "solana") {
            alert("This wallet network is not supported for VYRO V1.");
            return;
        }

        const network = document.getElementById("send-network").value;
        const recipientName = VYROTransfer.normalizeUsername(document.getElementById("send-recipient").value);
        const amountText = document.getElementById("send-amount").value.trim();

        if (!VYROTransfer.isValidUsername(recipientName)) {
            alert("Please enter a valid VYRO username (3–20 letters, numbers or underscores).");
            return;
        }
        const parsed = VYROTransfer.parseAmount(amountText, window.VYRO_CONFIG.solana.usdcDecimals);
        if (!parsed.ok) {
            alert(parsed.error);
            return;
        }

        VYROPayments.setPendingPayment({
            recipient: "@" + recipientName,
            amount: amountText,
            asset: "USDC",
            network: network === "solana" ? "Solana" : network,
            fromWallet: sendingWallet.address,
            walletType: sendingWallet.type || "solana",
            walletProvider: sendingWallet.provider || sendingWallet.type || "External Wallet",
            type: "Send"
        });

        // Look up the recipient and check balances BEFORE showing the confirm screen.
        const originalLabel = continueSendButton.textContent;
        continueSendButton.disabled = true;
        continueSendButton.textContent = "CHECKING…";
        try {
            const q = await VYROPayments.quote();
            renderConfirmScreen(q, sendingWallet);
            showScreen(confirmPaymentScreen);
        } catch (error) {
            console.error("VYRO: quote failed:", error);
            alert(error.userFacing ? error.message : "Unable to prepare this payment. Please try again.");
        } finally {
            continueSendButton.disabled = false;
            continueSendButton.textContent = originalLabel;
        }
    });
}

function renderConfirmScreen(q, wallet) {
    const set = function (id, text) { const el = document.getElementById(id); if (el) el.textContent = text; };
    set("confirm-recipient", q.recipient);
    set("confirm-recipient-address", q.recipientAddress);
    set("confirm-amount", VYROTransfer.formatUnits(BigInt(q.units), window.VYRO_CONFIG.solana.usdcDecimals) + " USDC");
    set("confirm-network", q.network);
    set("confirm-wallet", (wallet.provider || wallet.type || "External Wallet") + " • " + wallet.address.slice(0, 6) + "..." + wallet.address.slice(-4));

    let note = "Network fee: about 0.000005 SOL, paid from your wallet.";
    if (q.createsRecipientAccount) {
        note += " This is your first payment to " + q.recipient + ", so about " + (q.rentLamports / 1e9).toFixed(5) +
            " SOL is also needed once to open their USDC account.";
    }
    set("confirm-fee-note", note);
}

// =========================================================
// CONFIRM PAYMENT → BACK TO SEND
// =========================================================

const confirmBackButton =
    document.getElementById(
        "confirm-back-btn"
    );


if (confirmBackButton) {

    confirmBackButton.addEventListener(
        "click",
        function () {

            showScreen(
                sendScreen
            );

        }
    );

}


// =========================================================
// CONFIRM PAYMENT → HOME
// =========================================================

const confirmHomeLogoButton =
    document.getElementById(
        "confirm-home-logo-btn"
    );


if (confirmHomeLogoButton) {

    confirmHomeLogoButton.addEventListener(
        "click",
        function () {

            showScreen(
                homeScreen
            );

        }
    );

}

// =========================================================
// CONFIRM PAYMENT → USER'S WALLET SIGNS
// VYRO builds the unsigned transfer; the user approves it in their own wallet.
// =========================================================

const confirmPaymentButton = document.getElementById("confirm-payment-btn");

if (confirmPaymentButton) {
    confirmPaymentButton.addEventListener("click", async function () {
        if (confirmPaymentButton.disabled) return;
        if (typeof VYROPayments === "undefined") {
            alert("Payment system is unavailable.");
            return;
        }

        const originalLabel = confirmPaymentButton.textContent;
        confirmPaymentButton.disabled = true;
        try {
            const result = await VYROPayments.submit(function (stage) {
                confirmPaymentButton.textContent = stage.toUpperCase();
            });
            showPaymentResult(result);
        } catch (error) {
            console.error("VYRO: payment failed:", error);
            if (error.userFacing) {
                alert(error.message);                 // stay on the confirm screen so the user can retry
            } else {
                showPaymentFailed("Your payment could not be completed. If your wallet shows a pending transaction, check its status in the wallet before retrying.");
            }
        } finally {
            confirmPaymentButton.disabled = false;
            confirmPaymentButton.textContent = originalLabel;
        }
    });
}

function showPaymentResult(result) {
    if (result.status === "Failed") {
        showPaymentFailed("The transaction failed on Solana. No USDC was moved.", result);
        return;
    }
    const summary = document.getElementById("payment-success-summary");
    if (summary) {
        summary.textContent = result.amount + " USDC to " + result.recipient +
            (result.status === "Confirmed" ? " · Confirmed on Solana" : " · Submitted, waiting for confirmation");
    }
    const link = document.getElementById("payment-success-link");
    if (link) { link.href = VYROPayments.explorerUrl(result.id); link.style.display = "inline-block"; }
    loadTransactionHistory();
    showScreen(paymentSuccessScreen);
}

function showPaymentFailed(message, result) {
    const el = document.getElementById("payment-failed-message");
    if (el) el.textContent = message;
    const link = document.getElementById("payment-failed-link");
    if (link) {
        if (result && result.id) { link.href = VYROPayments.explorerUrl(result.id); link.style.display = "inline-block"; }
        else link.style.display = "none";
    }
    showScreen(paymentFailedScreen);
}

// =========================================================
// VYRO — RECIPIENT LOOKUP (as you type)
// Reads the username directory, which holds no private data.
// =========================================================

const sendRecipientInput = document.getElementById("send-recipient");
const recipientResult = document.getElementById("recipient-result");
const recipientDisplay = document.getElementById("recipient-display");

if (sendRecipientInput && recipientResult && recipientDisplay) {
    let recipientLookupTimer = null;

    sendRecipientInput.addEventListener("input", function () {
        const username = VYROTransfer.normalizeUsername(this.value);
        recipientResult.classList.remove("visible");
        clearTimeout(recipientLookupTimer);
        if (!VYROTransfer.isValidUsername(username)) return;

        recipientLookupTimer = setTimeout(async function () {
            try {
                const snap = await firebaseDB.collection("usernames").doc(username).get();
                // Ignore stale answers if the user kept typing.
                if (VYROTransfer.normalizeUsername(sendRecipientInput.value) !== username) return;
                const data = snap.exists ? snap.data() : null;
                if (data && data.walletAddress) {
                    recipientDisplay.textContent = "@" + username;
                    recipientResult.classList.add("visible");
                }
            } catch (error) {
                console.error("VYRO RECIPIENT LOOKUP ERROR:", error);
            }
        }, 300);
    });
}

// =========================================================
// HOME → RECEIVE
// =========================================================

const receiveButton = document.getElementById(
    "receive-btn"
);


if (receiveButton) {
    receiveButton.addEventListener(
        "click",
        function () {
            populateWalletSelectors();
            updateReceiveWalletDisplay();
            showScreen(receiveScreen);
        }
    );
}


// =========================================================
// RECEIVE NAVIGATION
// =========================================================

const receiveBackButton =
    document.getElementById(
        "receive-back-btn"
    );

const receiveHomeLogoButton =
    document.getElementById(
        "receive-home-logo-btn"
    );


if (receiveBackButton) {
    receiveBackButton.addEventListener(
        "click",
        function () {
            showScreen(homeScreen);
        }
    );
}


if (receiveHomeLogoButton) {
    receiveHomeLogoButton.addEventListener(
        "click",
        function () {
            showScreen(homeScreen);
        }
    );
}


// =========================================================
// =========================================================
// RECEIVE — COPY WALLET ADDRESS
// =========================================================

const copyReceiveButton =
    document.getElementById(
        "copy-receive-btn"
    );

if (copyReceiveButton) {
    copyReceiveButton.addEventListener(
        "click",
        async function () {
            const receiveWallet =
                document.getElementById("receive-wallet");

            const address =
                receiveWallet &&
                receiveWallet.value
                    ? receiveWallet.value
                    : "";

            if (!address) {
                alert("Please select a connected wallet first.");
                return;
            }

            try {
                if (
                    navigator.clipboard &&
                    navigator.clipboard.writeText
                ) {
                    await navigator.clipboard.writeText(address);
                } else {
                    const helper = document.createElement("textarea");
                    helper.value = address;
                    helper.style.position = "fixed";
                    helper.style.opacity = "0";
                    document.body.appendChild(helper);
                    helper.select();
                    document.execCommand("copy");
                    helper.remove();
                }

                const originalText =
                    copyReceiveButton.textContent;

                copyReceiveButton.textContent = "COPIED ✓";

                setTimeout(function () {
                    copyReceiveButton.textContent = originalText;
                }, 1500);
            } catch (error) {
                console.error(
                    "VYRO COPY WALLET ADDRESS ERROR:",
                    error
                );

                alert("Unable to copy the wallet address.");
            }
        }
    );
}

// =========================================================
// 2FA CODE SCREEN — NAVIGATION
// =========================================================

const twoFactorCodeBackButton =
    document.getElementById(
        "two-factor-code-back"
    );


if (twoFactorCodeBackButton) {

    twoFactorCodeBackButton.addEventListener(
        "click",
        function () {

            showScreen(
                twoFactorScreen
            );

        }
    );

}


// =========================================================
// 2FA CODE — VERIFY PLACEHOLDER
// =========================================================

const verifyTwoFactorCodeButton =
    document.getElementById(
        "verify-two-factor-code-btn"
    );


if (verifyTwoFactorCodeButton) {

    verifyTwoFactorCodeButton.addEventListener(
        "click",
        function () {

            const code =
                document.getElementById(
                    "two-factor-code"
                ).value.trim();


            if (!code) {

                alert(
                    "Please enter the security code."
                );

                return;

            }


            if (code.length !== 6) {

                alert(
                    "Please enter the 6-digit security code."
                );

                return;

            }


            alert(
                "Real email verification will be connected here."
            );

        }
    );

}


// =========================================================
// 2FA CODE — RESEND PLACEHOLDER
// =========================================================

const resendTwoFactorCodeButton =
    document.getElementById(
        "resend-two-factor-code-btn"
    );


if (resendTwoFactorCodeButton) {

    resendTwoFactorCodeButton.addEventListener(
        "click",
        function () {

            alert(
                "Real email code delivery will be connected here."
            );

        }
    );

}

// =========================================================
// VYRO — CUSTOM POPUP SYSTEM
// =========================================================

window.alert = function (message) {

    const existingModal =
        document.querySelector(
            ".vyro-modal-overlay"
        );

    if (existingModal) {

        existingModal.remove();

    }


    const overlay =
        document.createElement(
            "div"
        );

    overlay.className =
        "vyro-modal-overlay";


    const modal =
        document.createElement(
            "div"
        );

    modal.className =
        "vyro-modal";


    const logo =
        document.createElement(
            "div"
        );

    logo.className =
        "vyro-modal-logo";

    logo.textContent =
        "VYRO";


    const messageElement =
        document.createElement(
            "div"
        );

    messageElement.className =
        "vyro-modal-message";

    messageElement.textContent =
        message;


    const button =
        document.createElement(
            "button"
        );

    button.className =
        "vyro-modal-button";

    button.type =
        "button";

    button.textContent =
        "OK";


    button.addEventListener(
        "click",
        function () {

            overlay.remove();

        }
    );


    modal.appendChild(
        logo
    );

    modal.appendChild(
        messageElement
    );

    modal.appendChild(
        button
    );

    overlay.appendChild(
        modal
    );

    document.body.appendChild(
        overlay
    );

};

// =========================================================
// VYRO — PROFILE AVATAR
// =========================================================

const profileMenuButton =
    document.getElementById(
        "profile-menu-btn"
    );

const profileAvatarInitial =
    document.getElementById(
        "profile-avatar-initial"
    );

const profileMenuUsername =
    document.getElementById(
        "profile-menu-username"
    );


// =========================================================
// LOAD USERNAME
// =========================================================

const profileUsername =
    localStorage.getItem(
        "vyro_username"
    );


if (
    profileUsername &&
    profileAvatarInitial
) {

    const cleanUsername =
        profileUsername
            .replace(/^@/, "")
            .trim();

    if (cleanUsername) {

        profileAvatarInitial.textContent =
            cleanUsername
                .charAt(0)
                .toUpperCase();

    }
}


if (
    profileUsername &&
    profileMenuUsername
) {

    profileMenuUsername.textContent =
        "@" +
        profileUsername.replace(
            /^@/,
            ""
        );

}


// =========================================================
// PROFILE MENU — OPEN / CLOSE
// =========================================================
const profileDropdown =
    document.getElementById("profile-dropdown");

function closeProfileMenu() {
    if (!profileDropdown) return;

    profileDropdown.classList.remove("open");
    profileDropdown.setAttribute("aria-hidden", "true");

    if (profileMenuButton) {
        profileMenuButton.setAttribute("aria-expanded", "false");
    }
}

function positionProfileMenu() {
    if (!profileDropdown || !profileMenuButton) return;
    if (!profileDropdown.classList.contains("open")) return;

    const rect = profileMenuButton.getBoundingClientRect();
    const menuWidth = profileDropdown.offsetWidth || 210;
    const gap = 10;

    let left = rect.right - menuWidth;
    let top = rect.bottom + gap;

    left = Math.max(10, Math.min(left, window.innerWidth - menuWidth - 10));

    if (top + profileDropdown.offsetHeight > window.innerHeight - 10) {
        top = Math.max(10, rect.top - profileDropdown.offsetHeight - gap);
    }

    profileDropdown.style.position = "fixed";
    profileDropdown.style.left = left + "px";
    profileDropdown.style.right = "auto";
    profileDropdown.style.top = top + "px";
    profileDropdown.style.zIndex = "2147483647";
}

function openProfileMenu() {
    if (!profileMenuButton || !profileDropdown) return;

    if (profileDropdown.parentElement !== document.body) {
        document.body.appendChild(profileDropdown);
    }

    profileDropdown.classList.add("open");
    profileDropdown.setAttribute("aria-hidden", "false");
    profileMenuButton.setAttribute("aria-expanded", "true");

    positionProfileMenu();
}

if (profileMenuButton && profileDropdown) {
    profileMenuButton.addEventListener("click", function (event) {
        event.preventDefault();
        event.stopPropagation();

        if (profileDropdown.classList.contains("open")) {
            closeProfileMenu();
        } else {
            openProfileMenu();
        }
    });

    profileDropdown.addEventListener("click", function (event) {
        event.stopPropagation();
    });

    document.addEventListener("click", closeProfileMenu);

    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
            closeProfileMenu();
        }
    });

    window.addEventListener("resize", positionProfileMenu);
    window.addEventListener("scroll", positionProfileMenu, true);
}
// =========================================================
// VYRO — PROFILE MENU ACTIONS
// =========================================================


// =========================================================
// PROFILE
// =========================================================

const profileMenuProfile =
    document.getElementById(
        "profile-menu-profile"
    );

const profileBackButton =
    document.getElementById(
        "profile-back-btn"
    );


if (profileMenuProfile) {

    profileMenuProfile.addEventListener(
        "click",
        function () {

            closeProfileMenu();

            showScreen(
                profileScreen
            );

            loadProfileInformation();

        }
    );

}


if (profileBackButton) {

    profileBackButton.addEventListener(
        "click",
        function () {

            showScreen(
                homeScreen
            );

        }
    );

}


// =========================================================
// PROFILE INFORMATION
// =========================================================

function loadProfileInformation() {

    const usernameDisplay =
        document.getElementById(
            "profile-username-display"
        );

    const emailDisplay =
        document.getElementById(
            "profile-email-display"
        );


    const username =
        localStorage.getItem(
            "vyro_username"
        );


    if (
        username &&
        usernameDisplay
    ) {

        usernameDisplay.textContent =
            "@" +
            username.replace(
                /^@/,
                ""
            );

    }


    const user =
        firebaseAuth.currentUser;


    if (
        user &&
        emailDisplay
    ) {

        emailDisplay.textContent =
            user.email || "—";

    }

}


// =========================================================
// SETTINGS
// =========================================================

const profileMenuSettings =
    document.getElementById(
        "profile-menu-settings"
    );

const settingsBackButton =
    document.getElementById(
        "settings-back-btn"
    );


if (profileMenuSettings) {

    profileMenuSettings.addEventListener(
        "click",
        function () {

            closeProfileMenu();

            showScreen(
                settingsScreen
            );

        }
    );

}


if (settingsBackButton) {

    settingsBackButton.addEventListener(
        "click",
        function () {

            showScreen(
                homeScreen
            );

        }
    );

}


// =========================================================
// SECURITY
// =========================================================

const profileMenuSecurity =
    document.getElementById(
        "profile-menu-security"
    );

const securityBackButton =
    document.getElementById(
        "security-back-btn"
    );


if (profileMenuSecurity) {

    profileMenuSecurity.addEventListener(
        "click",
        function () {

            closeProfileMenu();

            showScreen(
                securityScreen
            );

        }
    );

}


if (securityBackButton) {

    securityBackButton.addEventListener(
        "click",
        function () {

            showScreen(
                homeScreen
            );

        }
    );

}


// =========================================================
// PROFILE MENU — WALLETS
// =========================================================

const profileMenuWallets =
    document.getElementById(
        "profile-menu-wallets"
    );

if (profileMenuWallets) {
    
    profileMenuWallets.addEventListener(
        "click",
        function() {
            
            closeProfileMenu();
            
            if (
                typeof VYROWallet !==
                "undefined"
            ) {
                
                const activeWallet =
                    VYROWallet.getActiveWallet();
                
                if (
                    typeof updateWalletScreen ===
                    "function"
                ) {
                    updateWalletScreen(
                        activeWallet
                    );
                }
            }
            
            showScreen(
                walletsScreen
            );
        }
    );
}


// =========================================================
// WALLETS — BACK BUTTON
// =========================================================

const walletsBackButton =
    document.getElementById(
        "wallets-back-btn"
    );


if (walletsBackButton) {

    walletsBackButton.addEventListener(
        "click",
        function () {

            showScreen(
                homeScreen
            );

        }
    );

}


// =========================================================
// SECURITY — MANAGE 2FA
// =========================================================

const securityTwoFactorButton =
    document.getElementById(
        "security-2fa-btn"
    );


if (securityTwoFactorButton) {

    securityTwoFactorButton.addEventListener(
        "click",
        function () {

            showScreen(
                twoFactorScreen
            );

        }
    );

}


// =========================================================
// SECURITY — VERIFICATION WORD
// =========================================================

const changeVerificationWordButton =
    document.getElementById(
        "change-verification-word-btn"
    );

if (changeVerificationWordButton) {

    changeVerificationWordButton.addEventListener(
        "click",
        function () {

            showScreen(
                changeVerificationWordScreen
            );

        }
    );

}


const changeVerificationWordBackButton =
    document.getElementById(
        "change-verification-word-back-btn"
    );

if (changeVerificationWordBackButton) {

    changeVerificationWordBackButton.addEventListener(
        "click",
        function () {

            showScreen(
                securityScreen
            );

        }
    );

}

// =========================================================
// WALLETS — CONNECT WALLET
// =========================================================

const connectWalletButton =
    document.getElementById(
        "connect-wallet-btn"
    );

if (connectWalletButton) {

    connectWalletButton.addEventListener(
        "click",
        function () {

            showScreen(
                connectWalletScreen
            );

        }
    );

}


const connectWalletBackButton =
    document.getElementById(
        "connect-wallet-back-btn"
    );

if (connectWalletBackButton) {

    connectWalletBackButton.addEventListener(
        "click",
        function () {

            showScreen(
                walletsScreen
            );

        }
    );

}



// =========================================================
// VYRO WALLET SYSTEM — INITIALIZE
// =========================================================

// wallet.js initializes itself and exposes VYROWallet.


// =========================================================
// WALLET CONNECTED — BACK
// =========================================================

const walletConnectedBackButton =
    document.getElementById(
        "wallet-connected-back-btn"
    );

if (walletConnectedBackButton) {

    walletConnectedBackButton.addEventListener(
        "click",
        function () {

            showScreen(
                walletsScreen
            );

        }
    );

}





// =========================================================
// SETTINGS — CHANGE EMAIL
// =========================================================

const changeEmailButton =
    document.getElementById(
        "change-email-btn"
    );

if (changeEmailButton) {

    changeEmailButton.addEventListener(
        "click",
        function () {

            showScreen(
                changeEmailScreen
            );

        }
    );

}


const changeEmailBackButton =
    document.getElementById(
        "change-email-back-btn"
    );

if (changeEmailBackButton) {

    changeEmailBackButton.addEventListener(
        "click",
        function () {

            showScreen(
                settingsScreen
            );

        }
    );

}




// =========================================================
// SETTINGS — CHANGE PASSWORD
// =========================================================

const changePasswordButton =
    document.getElementById(
        "change-password-btn"
    );

if (changePasswordButton) {

    changePasswordButton.addEventListener(
        "click",
        function () {

            showScreen(
                changePasswordScreen
            );

        }
    );

}


const changePasswordBackButton =
    document.getElementById(
        "change-password-back-btn"
    );

if (changePasswordBackButton) {

    changePasswordBackButton.addEventListener(
        "click",
        function () {

            showScreen(
                settingsScreen
            );

        }
    );

}


// =========================================================
// SETTINGS — DELETE ACCOUNT
// =========================================================

const deleteAccountButton =
    document.getElementById(
        "delete-account-btn"
    );

if (deleteAccountButton) {

    deleteAccountButton.addEventListener(
        "click",
        function () {

            showScreen(
                deleteAccountScreen
            );

        }
    );

}


const deleteAccountBackButton =
    document.getElementById(
        "delete-account-back-btn"
    );

if (deleteAccountBackButton) {

    deleteAccountBackButton.addEventListener(
        "click",
        function () {

            showScreen(
                settingsScreen
            );

        }
    );

}


// LOG OUT is handled in auth.js (Firebase sign-out + wallet/payment cleanup).

// =========================================================
// CHANGE EMAIL — SAVE
// =========================================================

const saveEmailButton =
    document.getElementById(
        "save-email-btn"
    );


if (saveEmailButton) {

    saveEmailButton.addEventListener(
        "click",
        async function () {

            const newEmail =
                document.getElementById(
                    "new-email"
                ).value.trim();

            const currentPassword =
                document.getElementById(
                    "current-password-email"
                ).value;


            // =====================================================
            // VALIDATE NEW EMAIL
            // =====================================================

            if (!newEmail) {

                alert(
                    "Please enter your new email address."
                );

                return;

            }


            // =====================================================
            // VALIDATE CURRENT PASSWORD
            // =====================================================

            if (!currentPassword) {

                alert(
                    "Please enter your current password."
                );

                return;

            }


            // =====================================================
            // GET CURRENT FIREBASE USER
            // =====================================================

            const user =
                firebaseAuth.currentUser;


            if (!user) {

                alert(
                    "Your account could not be found. Please log in again."
                );

                return;

            }


            // =====================================================
            // MAKE SURE EMAIL IS ACTUALLY DIFFERENT
            // =====================================================

            if (
                user.email &&
                user.email.toLowerCase() ===
                newEmail.toLowerCase()
            ) {

                alert(
                    "The new email address must be different from your current email."
                );

                return;

            }


            try {

                // =================================================
                // RE-AUTHENTICATE USER
                // =================================================

                const credential =
                    firebase.auth.EmailAuthProvider.credential(
                        user.email,
                        currentPassword
                    );


                await user.reauthenticateWithCredential(
                    credential
                );


                // =================================================
// SEND VERIFICATION EMAIL FOR NEW ADDRESS
// =================================================

await user.verifyBeforeUpdateEmail(
    newEmail
);

                // =================================================
                // CLEAR FORM
                // =================================================

                document.getElementById(
                    "new-email"
                ).value = "";

                document.getElementById(
                    "current-password-email"
                ).value = "";


                // =================================================
                // SUCCESS MESSAGE
                // =================================================

                alert(
                    "We sent a verification link to your new address. " +
                    "Your email changes once you open that link."
                );


                // =================================================
                // RETURN TO PROFILE
                // =================================================

                showScreen(
                    profileScreen
                );


            } catch (error) {

                console.error(
                    "VYRO CHANGE EMAIL ERROR:",
                    error
                );


                // =================================================
                // SPECIFIC FIREBASE ERRORS
                // =================================================

                if (
                    error.code ===
                    "auth/wrong-password" ||
                    error.code ===
                    "auth/invalid-credential"
                ) {

                    alert(
                        "The current password is incorrect."
                    );

                    return;

                }


                if (
                    error.code ===
                    "auth/email-already-in-use"
                ) {

                    alert(
                        "That email address is already being used by another account."
                    );

                    return;

                }


                if (
                    error.code ===
                    "auth/invalid-email"
                ) {

                    alert(
                        "Please enter a valid email address."
                    );

                    return;

                }


                if (
                    error.code ===
                    "auth/requires-recent-login"
                ) {

                    alert(
                        "For security, please log out and log back in before changing your email."
                    );

                    return;

                }


alert("Unable to change your email right now. Please try again.");

            }

        }
    );

}


// =========================================================
// CHANGE PASSWORD — SAVE
// =========================================================

const savePasswordButton =
    document.getElementById(
        "save-password-btn"
    );


if (savePasswordButton) {

    savePasswordButton.addEventListener(
        "click",
        async function () {

            const currentPassword =
                document.getElementById(
                    "current-password"
                ).value;

            const newPassword =
                document.getElementById(
                    "new-password"
                ).value;

            const confirmPassword =
                document.getElementById(
                    "confirm-new-password"
                ).value;


            // =====================================================
            // VALIDATE CURRENT PASSWORD
            // =====================================================

            if (!currentPassword) {

                alert(
                    "Please enter your current password."
                );

                return;

            }


            // =====================================================
            // VALIDATE NEW PASSWORD
            // =====================================================

            if (!newPassword) {

                alert(
                    "Please enter a new password."
                );

                return;

            }


            // =====================================================
            // CONFIRM NEW PASSWORD
            // =====================================================

            if (newPassword !== confirmPassword) {

                alert(
                    "The new passwords do not match."
                );

                return;

            }


            // =====================================================
            // GET CURRENT USER
            // =====================================================

            const user =
                firebaseAuth.currentUser;


            if (!user) {

                alert(
                    "Your account could not be found. Please log in again."
                );

                return;

            }


            try {

                // =================================================
                // RE-AUTHENTICATE USER
                // =================================================

                const credential =
                    firebase.auth.EmailAuthProvider.credential(
                        user.email,
                        currentPassword
                    );


                await user.reauthenticateWithCredential(
                    credential
                );


                // =================================================
                // UPDATE PASSWORD
                // =================================================

                await user.updatePassword(
                    newPassword
                );


                // =================================================
                // CLEAR FORM
                // =================================================

                document.getElementById(
                    "current-password"
                ).value = "";

                document.getElementById(
                    "new-password"
                ).value = "";

                document.getElementById(
                    "confirm-new-password"
                ).value = "";


                // =================================================
                // SUCCESS
                // =================================================

                alert(
                    "Your password has been updated."
                );


                showScreen(
                    settingsScreen
                );


            } catch (error) {

                console.error(
                    "VYRO CHANGE PASSWORD ERROR:",
                    error
                );


                if (
                    error.code ===
                    "auth/wrong-password" ||
                    error.code ===
                    "auth/invalid-credential"
                ) {

                    alert(
                        "The current password is incorrect."
                    );

                    return;

                }


                if (
                    error.code ===
                    "auth/weak-password"
                ) {

                    alert(
                        "Your new password is too weak. Please choose a stronger password."
                    );

                    return;

                }


                if (
                    error.code ===
                    "auth/requires-recent-login"
                ) {

                    alert(
                        "For security, please log out and log back in before changing your password."
                    );

                    return;

                }


                alert(
                    "Unable to change your password right now. Please try again."
                );

            }

        }
    );

}


// =========================================================
// CHANGE VERIFICATION WORD — SAVE
// =========================================================

const saveVerificationWordButton =
    document.getElementById(
        "save-verification-word-btn"
    );

if (saveVerificationWordButton) {

    saveVerificationWordButton.addEventListener(
        "click",
        async function () {

            const newWord =
                document.getElementById(
                    "new-verification-word"
                ).value
                    .trim()
                    .toUpperCase();


            if (!newWord) {

                alert(
                    "Please enter a verification word."
                );

                return;

            }


            const user =
                firebaseAuth.currentUser;


            if (!user) {

                alert(
                    "Your account could not be found. Please log in again."
                );

                return;

            }


            try {

                await firebaseDB
                    .collection("users")
                    .doc(user.uid)
                    .set(
                        {
                            verificationWord:
                                newWord
                        },
                        {
                            merge: true
                        }
                    );


                alert(
                    "Your verification word has been updated."
                );


                document.getElementById(
                    "new-verification-word"
                ).value = "";


                showScreen(
                    securityScreen
                );


            } catch (error) {

                console.error(
                    "VYRO VERIFICATION WORD ERROR:",
                    error
                );


                alert(
                    "Unable to update your verification word."
                );

            }

        }
    );

}

// =========================================================
// TRANSACTION HISTORY
// =========================================================

const transactionHistoryBackButton =
    document.getElementById(
        "transaction-history-back-btn"
    );


if (transactionHistoryBackButton) {

    transactionHistoryBackButton.addEventListener(
        "click",
        function () {

            showScreen(
                homeScreen
            );

        }
    );

}


// =========================================================
// HOME ACTIVITY — VIEW ALL
// =========================================================

const activityHeader =
    document.querySelector(
        ".activity-header"
    );


if (activityHeader) {

    activityHeader.addEventListener(
        "click",
        function () {

            loadTransactionHistory();

            showScreen(
                transactionHistoryScreen
            );

        }
    );

}

// =========================================================
// TRANSACTION DETAILS
// =========================================================

const transactionDetailsBackButton =
    document.getElementById(
        "transaction-details-back-btn"
    );


if (transactionDetailsBackButton) {

    transactionDetailsBackButton.addEventListener(
        "click",
        function () {

            showScreen(
                transactionHistoryScreen
            );

        }
    );

}

// =========================================================
// PAYMENT SUCCESS
// =========================================================

const paymentSuccessHomeButton =
    document.getElementById(
        "payment-success-home-btn"
    );


if (paymentSuccessHomeButton) {

    paymentSuccessHomeButton.addEventListener(
        "click",
        function () {

            showScreen(
                homeScreen
            );

        }
    );

}


// =========================================================
// PAYMENT FAILED — SEND
// =========================================================

const paymentFailedBackButton =
    document.getElementById(
        "payment-failed-back-btn"
    );


if (paymentFailedBackButton) {

    paymentFailedBackButton.addEventListener(
        "click",
        function () {

            showScreen(
                sendScreen
            );

        }
    );

}


// =========================================================
// PAYMENT FAILED — HOME
// =========================================================

const paymentFailedHomeButton =
    document.getElementById(
        "payment-failed-home-btn"
    );


if (paymentFailedHomeButton) {

    paymentFailedHomeButton.addEventListener(
        "click",
        function () {

            showScreen(
                homeScreen
            );

        }
    );

}

// =========================================================
// HOME — VIEW ALL ACTIVITY
// =========================================================

const viewAllActivityButton =
    document.getElementById(
        "view-all-activity-btn"
    );

if (viewAllActivityButton) {

    viewAllActivityButton.addEventListener(
        "click",
        function () {

            console.log(
                "VYRO: Opening transaction history."
            );

            loadTransactionHistory();

            showScreen(
                transactionHistoryScreen
            );

        }
    );

}

// =========================================================
// VYRO — TRANSACTION HISTORY
// =========================================================

const transactionList =
    document.getElementById(
        "transaction-list"
    );

const transactionEmpty =
    document.getElementById(
        "transaction-empty"
    );


// =========================================================
// LOAD TRANSACTION HISTORY
// Sender-side records live under the user's own private path in Firestore.
// Rows are built with textContent only: values are never parsed as HTML.
// =========================================================

async function loadTransactionHistory() {
    if (!transactionList) return;

    transactionList.querySelectorAll(".transaction-row").forEach(function (row) { row.remove(); });

    let transactions = [];
    try {
        if (window.VYROPayments && firebaseAuth.currentUser) {
            transactions = await VYROPayments.loadHistory();
        }
    } catch (error) {
        console.error("VYRO: could not load history:", error);
    }

    if (transactionEmpty) transactionEmpty.style.display = transactions.length === 0 ? "block" : "none";

    transactions.forEach(function (transaction) {
        const row = document.createElement("button");
        row.type = "button";
        row.className = "transaction-row";

        const main = document.createElement("div");
        main.className = "transaction-row-main";
        const title = document.createElement("div");
        title.className = "transaction-row-title";
        title.textContent = transaction.recipient || "Unknown";
        const subtitle = document.createElement("div");
        subtitle.className = "transaction-row-subtitle";
        subtitle.textContent = transaction.status || "Pending";
        main.appendChild(title);
        main.appendChild(subtitle);

        const amount = document.createElement("div");
        amount.className = "transaction-row-amount";
        amount.textContent = (transaction.amount || "0") + " " + (transaction.asset || "USDC");

        row.appendChild(main);
        row.appendChild(amount);
        row.addEventListener("click", function () { openTransactionDetails(transaction); });
        transactionList.appendChild(row);
    });
}
window.loadTransactionHistory = loadTransactionHistory;

// =========================================================
// VYRO — TRANSACTION DETAILS
// =========================================================

function openTransactionDetails(transaction) {
    if (!transactionDetailsScreen) return;

    const set = function (id, text) { const el = document.getElementById(id); if (el) el.textContent = text; };
    set("transaction-detail-status", transaction.status || "Pending");
    set("transaction-detail-type", transaction.type || "Send");
    set("transaction-detail-recipient", transaction.recipient || "Unknown");
    set("transaction-detail-amount", transaction.amount || "0");
    set("transaction-detail-asset", transaction.asset || "USDC");
    set("transaction-detail-network", transaction.network || "Solana");
    set("transaction-detail-id", transaction.id || "Pending");

    const link = document.getElementById("transaction-detail-link");
    if (link) {
        if (transaction.id) { link.href = VYROPayments.explorerUrl(transaction.id); link.style.display = "inline-block"; }
        else link.style.display = "none";
    }
    showScreen(transactionDetailsScreen);
}

// =========================================================
// TRANSACTION HISTORY INITIALIZATION
// =========================================================

loadTransactionHistory();



// Wallet module compatibility hook.
window.updateWalletScreen = function () {
    if (window.VYROWallet && typeof window.VYROWallet.updateUI === "function") {
        window.VYROWallet.updateUI();
    }
};
