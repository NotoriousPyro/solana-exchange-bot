import { Commitment, Keypair } from "@solana/web3.js";
import bs58 from "bs58";
import fs from 'node:fs';
import yaml from 'yaml';
import { Sender } from "./Jito";

class RpcConfig {
    httpEndpoint: string;
    wsEndpoint: string;
    keepAlive: boolean = true;
    disableRetryOnRateLimit: boolean = false;
    commitment: Commitment = "confirmed";
    useAsBlockhashSource: boolean = false;
    useAsSimulationSource: boolean = false;
    useAsGetMultipleAccountsSource: boolean = false;
}

class JupiterConfig {
    endpoint: string;
    restrictIntermediateTokens: boolean = false;
    dexes: string[] = [];
}

class JitoConfig {
    minTip: number = 1000;
    maxTip: number = 100000000;
    tipPercentage: number = 50;
    maxTxPerSecondPerRegion = 5;
    regions: string[] = [
        "ny",
        "amsterdam",
        "frankfurt",
        "tokyo",
    ];
}

export class TradeConfig {
    mints: string[];
    minAmount: number = 1000000;
    maxAmount: number = 100000000;
    minAccounts: number = 9;
    maxAccounts: number = 64;
    loopIterationDelayMs: number = 50;
    tipPercentage: number = 50;
    minJitoTip: number = 1000;
    maxJitoTip: number = 18000000;
    sender: Sender = Sender.GRPC;
    shortenToNearestMint: boolean = false;
}

export class CacheConfig {
    swapInfo: boolean = true;
    maxCacheAgeMs: number = 60000;
    maxSimulationCacheAgeMs: number = 60000;
    enabledCacheDexes: string[] = [];
    clearTxTooLarge: boolean = false;
}

class FeeConfig {
    mints: string[] = [];
    fee: number;
    minExtraAmount?: number = 5000;
}

const keypairFromString = (key: string) => Keypair.fromSecretKey(bs58.decode(key));
export type FeeMintMap = Map<string, { fee: number, minExtraAmount?: number }>;
/**
 * Settings class which implements the collection of all available settings.
 * 
 * Private members are indicated by a double underscore prefix and suffix and should not be saved when serialising this class.
 */
class Settings {
    private __signer_key__: Keypair = undefined;
    /** Transaction signer key */
    get SIGNER_KEY() {
        if (this.__signer_key__ === undefined) {
            this.__signer_key__ = keypairFromString(process.env.SIGNER_KEY);
        }
        return this.__signer_key__;
    }

    private __be_key__: Keypair = undefined;
    /** Jito Block Engine signer key */
    get BE_KEY() {
        if (this.__be_key__ === undefined) {
            this.__be_key__ = keypairFromString(process.env.BE_KEY);
        }
        return this.__be_key__;
    }
    

    rpcs: RpcConfig[] = [];
    cache: CacheConfig;
    jupiter: JupiterConfig;
    jito: JitoConfig;
    fees: FeeConfig[] = [];
    __feeMintMap__: FeeMintMap = new Map();
    get feeMintMap(): FeeMintMap {
        // Performance optimisation
        if (this.__feeMintMap__.size > 0) {
            return this.__feeMintMap__;
        }
        // Optimisation not needed here since the loop will not start without at least 1 item
        for (const fee of this.fees) {
            for (const mint of fee.mints) {
                this.__feeMintMap__.set(mint, {fee: fee.fee, minExtraAmount: fee.minExtraAmount});
            }
        }
        return this.__feeMintMap__;
    }

    forceEnableSimulation: boolean = false;
    forceDisableSimulation: boolean = false;
    pairs: string[] = [];
    tradeConfigs: TradeConfig[] = [];
    computeUnitLimitBase: number = 1400000;
    computeUnitLimitStep: number = 100000;
    slippageA: number = 0;
    slippageB: number = 0;
    onlyDirectRoutesA: boolean = false;
    onlyDirectRoutesB: boolean = false;
    addressLookupTableAddresses: string[] = [];
    priceRandomiserDelayMs: number = 50;
    TARGET_ACCOUNTS: number = 92; // roughly 92 usually fit in a jupiter swap OK
    defaultHeapSize?: number;
    defaultHeapSizeSplitArb?: number;
    heapSizeStep?: number;
}

// Bugged, if the config.yaml doesn't have the property it will silently fail to define a property for the class and copy
// items not in the class.
class Config extends Settings {
    private __configFile__: string;

    constructor(configFile: string) {
        super();
        this.__configFile__ = configFile;
        this.reload();
    }
    public reload() {
        const config = yaml.parse(fs.readFileSync(this.__configFile__, "utf-8"));
        Object.assign(this, config);
    }
    private stripDisallowed(key: string, value: unknown) {
        if (key.startsWith("_") || key.endsWith("_")) {
            return undefined;
        }
        if (typeof value === "function") {
            return undefined;
        }
        return value;
    }
    public async save() {
        await fs.promises.writeFile(this.__configFile__, yaml.stringify(this, this.stripDisallowed));
    }
}

export const config = new Config("config.yaml");
export default config;
