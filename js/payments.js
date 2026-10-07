// =========================================================
// VYRO — PAYMENT ENGINE (non-custodial)
// =========================================================
// Flow:  quote()  → resolves @username → address, checks balances, builds a preview
//        submit() → rebuilds a fresh unsigned tx, hands it to the USER's wallet to sign,
//                   broadcasts/confirms it, and records it in the sender's own history.
//
// VYRO never holds funds, never holds keys and never signs. If the user declines in
// their wallet, nothing happens.
// =========================================================
(function () {
    "use strict";

    const CFG = window.VYRO_CONFIG;
    const SOL = CFG.solana;

    let pending = null;      // in-memory only: a half-finished payment should not outlive the tab
    let connection = null;
    let inFlight = false;

    function getConnection() {
        if (!window.solanaWeb3) throw new Error("Solana library failed to load. Check your connection and reload.");
        if (!connection) connection = new solanaWeb3.Connection(SOL.rpcUrl, "confirmed");
        return connection;
    }

    // ---------- pending payment ----------
    function setPendingPayment(p) { pending = p ? Object.assign({}, p) : null; }
    function getPendingPayment() { return pending ? Object.assign({}, pending) : null; }
    function clearPendingPayment() { pending = null; }

    // ---------- validation ----------
    function validatePayment(p) {
        if (!p) return { valid: false, error: "No payment is waiting for confirmation." };
        if (!VYROTransfer.isValidUsername(VYROTransfer.normalizeUsername(p.recipient))) return { valid: false, error: "Recipient username is invalid." };
        const amt = VYROTransfer.parseAmount(p.amount, SOL.usdcDecimals);
        if (!amt.ok) return { valid: false, error: amt.error };
        if (amt.units > VYROTransfer.parseAmount(CFG.limits.maxAmountPerPayment, SOL.usdcDecimals).units)
            return { valid: false, error: "Amount is above the " + CFG.limits.maxAmountPerPayment + " USDC per-payment limit." };
        if (p.network && String(p.network).toLowerCase() !== "solana") return { valid: false, error: "This payment network is not supported yet." };
        if (p.asset && p.asset !== "USDC") return { valid: false, error: "This payment asset is not supported yet." };
        return { valid: true, units: amt.units, error: null };
    }

    function validateWallet(address) {
        if (!window.VYROWallet) return { valid: false, error: "VYRO wallet system is unavailable." };
        if (!VYROWallet.isConnected()) return { valid: false, error: "Please connect a wallet before sending." };
        const wallet = address
            ? VYROWallet.getWallets().find(function (w) { return w.address === address; })
            : VYROWallet.getActiveWallet();
        if (!wallet || !wallet.address) return { valid: false, error: "The selected wallet is not available." };
        if (wallet.network && wallet.network !== "solana") return { valid: false, error: "The selected wallet is not on Solana." };
        return { valid: true, wallet: wallet, error: null };
    }

    // ---------- recipient resolution ----------
    async function resolveRecipient(rawUsername) {
        const name = VYROTransfer.normalizeUsername(rawUsername);
        if (!VYROTransfer.isValidUsername(name)) throw userError("Enter a valid VYRO username.");
        let snap;
        try { snap = await firebaseDB.collection("usernames").doc(name).get(); }
        catch (e) { console.error("VYRO resolve error:", e); throw userError("Could not look up @" + name + ". Check your connection and try again."); }
        if (!snap.exists) throw userError("@" + name + " was not found on VYRO.");
        const data = snap.data() || {};
        if (!data.walletAddress || !VYROTransfer.isValidSolanaAddress(data.walletAddress))
            throw userError("@" + name + " has not set up a receiving wallet yet.");
        const me = firebaseAuth.currentUser;
        if (me && data.uid === me.uid) throw userError("You can't send a payment to yourself.");
        return { username: name, uid: data.uid, address: data.walletAddress };
    }

    function userError(message) { const e = new Error(message); e.userFacing = true; return e; }

    // ---------- quote (shown on the confirm screen) ----------
    async function quote() {
        const p = getPendingPayment();
        const pv = validatePayment(p);
        if (!pv.valid) throw userError(pv.error);
        const wv = validateWallet(p.fromWallet);
        if (!wv.valid) throw userError(wv.error);

        const to = await resolveRecipient(p.recipient);
        const built = await buildWithFriendlyErrors(wv.wallet.address, to.address, pv.units);

        pending = Object.assign({}, p, {
            recipientAddress: to.address,
            recipientUid: to.uid,
            units: pv.units.toString(),
            createsRecipientAccount: built.createsRecipientAccount,
            rentLamports: built.rentLamports,
            feeLamports: built.feeLamports
        });
        return getPendingPayment();
    }

    async function buildWithFriendlyErrors(sender, recipient, units) {
        try {
            return await VYROTransfer.buildUsdcTransfer({ connection: getConnection(), config: SOL, sender: sender, recipient: recipient, units: units });
        } catch (e) {
            if (e.code === "INSUFFICIENT_USDC" || e.code === "INSUFFICIENT_SOL") throw userError(e.message);
            console.error("VYRO build error:", e);
            throw userError("Could not reach the Solana network. Please try again in a moment.");
        }
    }

    // ---------- submit ----------
    // onStage(text) lets the UI show progress: "Preparing…", "Waiting for your wallet…", …
    async function submit(onStage) {
        if (inFlight) throw userError("A payment is already in progress.");
        inFlight = true;
        const stage = typeof onStage === "function" ? onStage : function () {};
        try {
            const p = getPendingPayment();
            const pv = validatePayment(p);
            if (!pv.valid) throw userError(pv.error);
            const wv = validateWallet(p.fromWallet);
            if (!wv.valid) throw userError(wv.error);
            const sender = wv.wallet.address;

            stage("Checking recipient…");
            // Re-resolve right before signing: if the recipient changed their address
            // since the confirm screen was shown, stop rather than pay a different address.
            const to = await resolveRecipient(p.recipient);
            if (p.recipientAddress && to.address !== p.recipientAddress)
                throw userError("@" + to.username + " changed their receiving wallet. Please review the payment again.");

            stage("Preparing…");
            const built = await buildWithFriendlyErrors(sender, to.address, pv.units);

            stage("Approve in your wallet…");
            let result;
            try { result = await VYROWallet.requestSignature(built.transaction, sender); }
            catch (e) {
                if (VYROWallet.isUserRejection(e)) throw userError("You declined the request in your wallet. No payment was made.");
                throw userError(e.message || "Your wallet could not sign this payment.");
            }

            let signature = result.signature;
            if (!signature) {
                stage("Submitting…");
                try {
                    signature = await getConnection().sendRawTransaction(result.signedRaw, { skipPreflight: false, preflightCommitment: "confirmed" });
                } catch (e) {
                    console.error("VYRO send error:", e);
                    throw userError("The network rejected this payment: " + (e.message || "unknown error") + ". No funds were moved.");
                }
            }

            const record = {
                recipient: "@" + to.username,
                recipientAddress: to.address,
                amount: VYROTransfer.formatUnits(pv.units, SOL.usdcDecimals),
                asset: "USDC",
                network: "Solana",
                fromWallet: sender,
                status: "Submitted",
                type: "Send",
                id: signature
            };
            saveRecord(record);

            stage("Confirming on Solana…");
            const final = await waitForConfirmation(signature, built.lastValidBlockHeight);
            if (final !== "Submitted") updateRecordStatus(signature, final);

            clearPendingPayment();
            return Object.assign({}, record, { status: final });
        } finally {
            inFlight = false;
        }
    }

    // Polls the chain instead of trusting the wallet: the blockchain is the source of truth.
    async function waitForConfirmation(signature, lastValidBlockHeight) {
        const conn = getConnection();
        const deadline = Date.now() + 75000;
        while (Date.now() < deadline) {
            try {
                const res = await conn.getSignatureStatuses([signature], { searchTransactionHistory: false });
                const st = res && res.value && res.value[0];
                if (st) {
                    if (st.err) return "Failed";
                    if (st.confirmationStatus === "confirmed" || st.confirmationStatus === "finalized") return "Confirmed";
                }
                if (lastValidBlockHeight && (await conn.getBlockHeight("confirmed")) > lastValidBlockHeight && !st) return "Failed";
            } catch (e) { /* transient RPC error: keep polling */ }
            await new Promise(function (r) { setTimeout(r, 2000); });
        }
        return "Submitted"; // still pending; the history screen links to the explorer
    }

    // ---------- history (sender-side, stored under the user's own private path) ----------
    function txCollection() {
        const me = firebaseAuth.currentUser;
        if (!me) throw new Error("Not signed in.");
        return firebaseDB.collection("users").doc(me.uid).collection("transactions");
    }
    function saveRecord(record) {
        try {
            txCollection().doc(record.id).set(Object.assign({}, record, { createdAt: firebase.firestore.FieldValue.serverTimestamp() }))
                .catch(function (e) { console.warn("VYRO: could not save history", e); });
        } catch (e) { console.warn("VYRO: could not save history", e); }
    }
    function updateRecordStatus(signature, status) {
        try { txCollection().doc(signature).update({ status: status }).catch(function (e) { console.warn("VYRO: status update failed", e); }); }
        catch (e) { /* history is best-effort; the chain is the source of truth */ }
    }
    async function loadHistory() {
        const snap = await txCollection().orderBy("createdAt", "desc").limit(50).get();
        return snap.docs.map(function (d) { return d.data(); });
    }

    function explorerUrl(signature) { return SOL.explorerTxUrl + encodeURIComponent(signature); }

    window.VYROPayments = {
        setPendingPayment, getPendingPayment, clearPendingPayment,
        validatePayment, validateWallet, resolveRecipient,
        quote, submit, loadHistory, explorerUrl
    };
})();
       
