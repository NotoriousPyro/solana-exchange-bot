import { RootDatabaseOptionsWithPath, open } from 'lmdb';
import { swapInfoMetaDBPath } from '../const';
import { QuoteResponse } from '@jup-ag/api';

const _dbOptions: RootDatabaseOptionsWithPath = {
    path: swapInfoMetaDBPath,
    cache: { // https://github.com/kriszyp/weak-lru-cache#weaklrucacheoptions-constructor
        cacheSize: 16777216, // 16MB - maximum
        clearKeptInterval: 100,
        txnStartThreshold: 3
    },
	compression: false,
    encoding: 'msgpack',
    sharedStructuresKey: Symbol.for('SwapInfoMeta'),
    eventTurnBatching: false,  // PERF: false. DEFAULT: true.

    // LMDB options
    noSync: false, // PERF: true. DEFAULT: false. NOTES: true = don't sync to disk, faster, could corrupt on crash.
    noMemInit: true, // PERF: true. DEFAULT: false. NOTES: true = don't zero-out disk space, faster but could be risky if the data is sensitive.
    remapChunks: false, // PERF: false. DEFAULT: true. NOTES: false = more ram usage, faster.
    useWritemap: false, // PERF: true. DEFAULT: false. NOTES: true = reduce malloc and file writes, risk of corrupting data, slower on Windows, faster on Linux.
}
const _db = open<SwapInfoMeta, SwapInfoMetaKey>(_dbOptions);

export type SwapInfoMetaKey = string[][];

export type SwapInfoMeta = {
    computeUnits?: number,
    memoryAllocationFailed?: boolean,
    heapSize?: number,
    tooManyAccountLocks?: boolean,
    transactionTooLarge?: boolean,
    expiry?: number,
    computationalBudgetExceeded?: boolean,
    lastSimulationFailedAnyReason?: boolean,
}

const keyByQuotes = (
    quotes: QuoteResponse[]
): SwapInfoMetaKey => quotes.map(
    quote => [
        quote.inputMint,
        quote.outputMint,
        ...quote.routePlan.map(route => route.swapInfo.ammKey)
    ]
);

const SwapInfoMetaDB = {
    keyByQuotes,

    get: (
        key: SwapInfoMetaKey
    ): SwapInfoMeta | undefined => _db.get(key),

    put: async (
        key: SwapInfoMetaKey,
        swapInfoMeta: SwapInfoMeta
    ): Promise<boolean> => _db.put(key, swapInfoMeta),

    remove: async (
        key: SwapInfoMetaKey
    ): Promise<boolean> => _db.remove(key),

    values: async function* (): AsyncGenerator<{ key: SwapInfoMetaKey, value: SwapInfoMeta }>{
        const keys = _db.getKeys().asArray;
        let index = 0;
        for await (const value of await _db.getMany(keys)) {
            const key = keys[index];
            yield { key, value };
            index++;
        }
    },
}

export default SwapInfoMetaDB;
