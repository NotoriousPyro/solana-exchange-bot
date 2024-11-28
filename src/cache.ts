import SwapInfoMetaDB from "./db/SwapInfoMetaDB";
import { CacheConfig } from "./lib/Config";
import { officialFetcher } from "./swaphelper";

export const Cache = {
    /**
     * Program ids to name cache.
     * 
     * @type {Map<string, string>}
     * 
     * @remarks key "string" is the string representation of the program id
     * @remarks value "string" is the string representation of the program name
     */
    programIdsToName: new Map<string, string>(),
    /**
     * Program names to id cache.
     * 
     * @type {Map<string, string>}
     * 
     * @remarks key "string" is the string representation of the program name
     * @remarks value "string" is the string representation of the program id
     */
    programNamesToId: new Map<string, string>(),
};

const precacheProgramIdsToLabel = async () => {
    const programIds = await officialFetcher.programIdToLabelGet()
    for (const [key, value] of Object.entries(programIds)) {
        Cache.programIdsToName.set(key, value);
    }
    Cache.programIdsToName.set("JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4", "Jupiter")
    Cache.programIdsToName.set("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL", "Associated Token Account Program");
    Cache.programIdsToName.set("CrX7kMhLC3cSsXJdT7JDgqrRVWGnUpX3gfEfxxU2NVLi", "Lido for Solana")
    for (const [key, value] of Cache.programIdsToName.entries()) {
        Cache.programNamesToId.set(value, key);
    }
    return Promise.resolve();
}

const clearTxTooLarge = async () => {
    for await (const val of SwapInfoMetaDB.values()) {
        if (val?.value?.transactionTooLarge) {
            await SwapInfoMetaDB.remove(val.key);
        }
    }
}

export const initialiseCache = async (
    config: CacheConfig
) => {
    if (config.clearTxTooLarge) {
        await clearTxTooLarge();
    }
    await precacheProgramIdsToLabel();
}
