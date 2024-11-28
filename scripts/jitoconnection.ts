import { Connection } from "@solana/web3.js";
import { Agent } from 'https';

export const jitoConnection = new Connection(
    "https://amsterdam.mainnet.block-engine.jito.wtf/api/v1/transactions",
    {
        commitment: "processed",
        httpAgent: new Agent({
            keepAlive: true,
            keepAliveMsecs: 60000,
        }),
    },
);
