// =========================================================
// VYRO — APP CONFIGURATION
// =========================================================
// Everything network-specific lives here so that adding a new chain
// or asset later is a config change, not a code hunt.

window.VYRO_CONFIG = Object.freeze({
    appName: "VYRO",

    // Active payment rail (V1: USDC on Solana mainnet).
    network: "solana",
    asset: "USDC",

    solana: Object.freeze({
        // CAIP-2 chain id for Solana mainnet (used by WalletConnect).
        chainId: "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",

        // The public Solana RPC is rate-limited and not meant for production.
        // Replace with a dedicated endpoint (Helius, QuickNode, Triton, ...).
        // An API key in a browser-side URL is visible to users; restrict it by
        // allowed domain/origin in the provider dashboard.
        rpcUrl: "https://solana-mainnet.g.alchemy.com/v2/alch_X9mveVmXQneC5MXDJXAEi",

        // Circle's native USDC on Solana mainnet.
        usdcMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
        usdcDecimals: 6,

        explorerTxUrl: "https://solscan.io/tx/"
    }),

    // Safety limits enforced client-side (UX guard-rails, not security controls).
    limits: Object.freeze({
        maxAmountPerPayment: "10000"   // USDC
    }),

    // Optional: add your WalletConnect Cloud project ID here.
    // Injected wallets (Trust Wallet / Phantom / Solflare / Backpack) do not require it.
    walletConnectProjectId: "",
    walletConnectMetadata: {
        name: "VYRO",
        description: "Non-custodial crypto transfers by username.",
        url: window.location.origin,
        icons: []
    }
});
          
