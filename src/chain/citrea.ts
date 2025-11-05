import { defineChain } from "viem";

export const citrea = defineChain({
    id: 5115,
    name: "Citrea",
    nativeCurrency: {
        decimals: 18,
        name: "Citrea",
        symbol: "CIT",
    },
    rpcUrls: { default: { http: [import.meta.env.VITE_CITREA_RPC!] } },
    blockExplorers: { default: { name: 'Blockscout', url: 'https://explorer.testnet.citrea.xyz' } },

    testnet: false,
});