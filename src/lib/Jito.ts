import {
    Keypair,
    PublicKey,
    SystemProgram,
    VersionedTransaction,
} from "@solana/web3.js";
import { Bundle } from "jito-ts/dist/sdk/block-engine/types";
import { SearcherClient, searcherClient } from "jito-ts/dist/sdk/block-engine/searcher";
import { RateLimiter } from "limiter";
import { TooManyAccountLocksError } from "../exceptions";


export enum Sender {
    HTTP = "HTTP",
    GRPC = "GRPC",
}


const _regions: string[] = [
    "ny",
    "amsterdam",
    "frankfurt",
    "tokyo",
];

const tipAccounts = [
    "96gYZGLnJYVFmbjzopPSU6QiEV5fGqZNyN9nmNhvrZU5",
    "HFqU5x63VTqvQss8hp11i4wVV8bD44PvwucfZ2bU7gRe",
    "Cw8CFyM9FkoMi7K7Crf6HNQqf4uEMzpKw6QNghXLvLkY",
    "ADaUMid9yfUytqMBgopwjb2DTLSokTSzL1zt6iGPaS49",
    "DfXygSm4jCyNCybVYYK6DwvWqjKee8pbDmJGcLWNDXjh",
    "ADuUkR4vqLUMWXxW9gh6D6L8pMSawimctcNZ5pGwDcEt",
    "DttWaMuVvTiduZRnguLF7jNxTgiMBZ1hyAumKUiL2KRL",
    "3AVi9Tg9Uo68tJfuvoKvqKNWKkC5wPdSSdeBnizKZ6jT"
].map(account => new PublicKey(account));


let tipAcc: number = 0;
export const getTipTransactionInstruction = (
    payer: Keypair,
    tipLamports: number,
) => {
    const tipAccount = getTipAccount();
    const tipIx = SystemProgram.transfer({
        fromPubkey: payer.publicKey,
        toPubkey: tipAccount,
        lamports: tipLamports,
    });
    return tipIx;
}


export const getTipAccount = () => {
    if (tipAcc >= tipAccounts.length) {
        tipAcc = 0;
    }
    return tipAccounts[tipAcc++ % tipAccounts.length];
}

export class SendBundleError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "SendBundleError";
    }
}

export class ServiceUnavailableError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "ServiceUnavailableError";
    }
}

export class RateLimiterLimited extends Error {
    constructor(message: string) {
        super(message);
        this.name = "RateLimiterLimited";
    }
}

type JitoClient = {
    searcherClient: SearcherClient,
    limiter: RateLimiter,
}

export class BundleDispatcher {
    private jitoClients: JitoClient[];
    private jitoClient: Generator<JitoClient>;
    private beKey: Keypair;
    private regions: string[];

    constructor(blockEngineKey: Keypair, enabledRegions: string[], limitTxPerSecond: number) {
        this.beKey = blockEngineKey;
        this.regions = _regions.filter(
            region => enabledRegions.includes(region)
        ).map(region => `${region}.mainnet.block-engine.jito.wtf`);
        this.jitoClients = this.regions.map(region => ({
            searcherClient: searcherClient(region, this.beKey, {
                "grpc.max_concurrent_streams": 100,
            }),
            limiter: new RateLimiter({
                tokensPerInterval: limitTxPerSecond,
                interval: "second",
                fireImmediately: true,
            }),
        }));
        if (this.jitoClients.length === 0) {
            throw new Error("No enabled regions");
        }
        this.jitoClient = this.jitoClientGenerator();
    }

    private *jitoClientGenerator(): Generator<JitoClient> {
        let jitoClient = 0;
        while (true) {
            if (jitoClient >= this.jitoClients.length) {
                jitoClient = 0;
            }
            yield this.jitoClients[jitoClient++ % this.jitoClients.length];
        }
    }

    public async sendBundleGRPC(
        signedTxs: VersionedTransaction[],
    ): Promise<void> {
        try {
            const client = this.jitoClient.next();
            if (client.value) {
                const jitoClient = client.value as JitoClient;
                if (jitoClient.searcherClient instanceof SearcherClient) {
                    if (jitoClient.limiter.tryRemoveTokens(1)) {
                        const bundle = new Bundle(signedTxs, 5);
                        await jitoClient.searcherClient.sendBundle(bundle);
                    }
                    else {
                        return Promise.reject(new RateLimiterLimited("Rate limiter limited"));
                    }
                }
            }
            return Promise.resolve();
        }
        catch (e) {
            if (e.message.includes("too many account locks")) {
                return Promise.reject(new TooManyAccountLocksError());
            }
            return Promise.reject(new SendBundleError(e.message));
        }
    }

    // public async sendBundleHttp (
    //     txs: VersionedTransaction[],
    // ) {
    //     const regionUrl = this.getRegion();
    //     const txEncoded = txs.map(tx => bs58.encode(tx.serialize()));
    //     const resp = await fetch(`https://${regionUrl}/api/v1/bundles`, {
    //         method: "POST",
    //         headers: {
    //             "Content-Type": "application/json",
    //         },
    //         body: await bfj.stringify({
    //             jsonrpc: "2.0",
    //             id: crypto.randomUUID(),
    //             method: "sendBundle",
    //             params: [txEncoded],
    //         }, {
    //             bufferLength: 2048,
    //         }),
    //         agent: httpsAgent,
    //         retries: 3,
    //         retryDelay: function (attempt, __error, __response) {
    //             return Math.pow(2, attempt) * 20;
    //         },
    //         retryOn: function (attempt, __error, response) {
    //             if (response?.status === 200) return false;
    //             if (response?.status === 400) return false;
    //             if (response?.status === 429) {
    //                 return false;
    //             }
    //             if (attempt <= 1) return true;
    //             return false;
    //         }
    //     })
    //     if (!resp) {
    //         return Promise.reject(new ServiceUnavailableError("Jito is currently unavailable (no response)"));
    //     }
    //     if (!resp.ok) {
    //         if (resp?.status === 503) {
    //             return Promise.reject(new ServiceUnavailableError("Jito is currently unavailable (503)"));
    //         }
    //         try {
    //             const text = await resp.text();
    //             const json = JSON.parse(text);
    //             if (json.error?.message === "transaction has too many account locks") {
    //                 return Promise.reject(new TooManyAccountLocksError());
    //             }
    //             return Promise.reject(new ServiceUnavailableError(`Jito is currently unavailable (${resp?.status} ${text})`));
    //         }
    //         catch (e) {
    //             return Promise.reject(e)
    //         }
    //     }
    //     const json = await resp.json();
    //     return json.result;
    // }
}
