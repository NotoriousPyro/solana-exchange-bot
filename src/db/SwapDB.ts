import { RootDatabaseOptionsWithPath, open } from 'lmdb';
import { swapDBPath } from '../const';
import { Meta } from './Base';
import { RoutePlanStep } from '../program';
import { AccountMeta, Instruction } from '@jup-ag/api';

const _dbOptions: RootDatabaseOptionsWithPath = {
    path: swapDBPath,
    cache: { // https://github.com/kriszyp/weak-lru-cache#weaklrucacheoptions-constructor
        cacheSize: 16777216, // 16MB - maximum
        clearKeptInterval: 100,
        txnStartThreshold: 3
    },
	compression: false,
    encoding: 'msgpack',
    sharedStructuresKey: Symbol.for('MetaSwapInstructionsResponse'),
    eventTurnBatching: false,  // PERF: false. DEFAULT: true.

    // LMDB options
    noSync: false, // PERF: true. DEFAULT: false. NOTES: true = don't sync to disk, faster, could corrupt on crash.
    noMemInit: true, // PERF: true. DEFAULT: false. NOTES: true = don't zero-out disk space, faster but could be risky if the data is sensitive.
    remapChunks: false, // PERF: false. DEFAULT: true. NOTES: false = more ram usage, faster.
    useWritemap: false, // PERF: true. DEFAULT: false. NOTES: true = reduce malloc and file writes, risk of corrupting data, slower on Windows, faster on Linux.
}
const _db = open<Meta<CachedSwapData>>(_dbOptions);

export type CachedSwapData = {
    routePlan: RoutePlanStep[],
    remainingAccounts: AccountMeta[],
    setupInstructions: Instruction[],
    addressLookupTableAddresses: string[],
}

type InstructionGetParams = {
    inputMint: string,
    outputMint: string,
    routeAmmkeys: string[]
}

const SwapDB = {
    getMany: async (
        args: InstructionGetParams[]
    ): Promise<Meta<CachedSwapData>[]> => _db.getMany(
        args.map(arg => [arg.inputMint, arg.outputMint, arg.routeAmmkeys])
    ),
    
    get: (
        {
            inputMint,
            outputMint,
            routeAmmkeys
        }: InstructionGetParams
    ): Meta<CachedSwapData> | undefined => _db.get([
        inputMint,
        outputMint,
        routeAmmkeys
    ]),

    put: async (
        {
            inputMint,
            outputMint,
            routeAmmkeys
        }: InstructionGetParams,
        swapInfo: Meta<CachedSwapData>
    ): Promise<boolean> => _db.put([
        inputMint,
        outputMint,
        routeAmmkeys
    ], swapInfo),

    remove: async (
        {
            inputMint,
            outputMint,
            routeAmmkeys
        }: InstructionGetParams
    ): Promise<boolean> => _db.remove([
        inputMint,
        outputMint,
        routeAmmkeys
    ]),
}

export default SwapDB;
