import { RootDatabaseOptionsWithPath, open } from 'lmdb';
import { accountInfoDBPath } from '../const';
import { values } from './Base';
import { AccountInfo, PublicKey } from '@solana/web3.js';


const _dbOptions: RootDatabaseOptionsWithPath = {
    path: accountInfoDBPath,
    cache: { // https://github.com/kriszyp/weak-lru-cache#weaklrucacheoptions-constructor
        cacheSize: 16777216, // 16MB - maximum
        clearKeptInterval: 100,
        txnStartThreshold: 3
    },
    compression: false,
    encoding: 'msgpack',
    sharedStructuresKey: Symbol.for('SerialisableAccountInfo'),
    eventTurnBatching: false,  // PERF: false. DEFAULT: true.

    // LMDB options
    noSync: false, // PERF: true. DEFAULT: false. NOTES: true = don't sync to disk, faster, could corrupt on crash.
    noMemInit: true, // PERF: true. DEFAULT: false. NOTES: true = don't zero-out disk space, faster but could be risky if the data is sensitive.
    remapChunks: false, // PERF: false. DEFAULT: true. NOTES: false = more ram usage, faster.
    useWritemap: false, // PERF: true. DEFAULT: false. NOTES: true = reduce malloc and file writes, risk of corrupting data, slower on Windows, faster on Linux.
}
const _db = open<SerialisableAccountInfo>(_dbOptions);

type SerialisableAccountInfo = {
    /** `true` if this account's data contains a loaded program */
    executable: boolean;
    /** Identifier of the program that owns the account */
    owner: string;
    /** Number of lamports assigned to the account */
    lamports: number;
    /** Optional data assigned to the account */
    data: Buffer;
    /** Optional rent epoch info for account */
    rentEpoch?: number;
};

export enum AccountInfoType {
    AddressLookupTableAccount = 'AddressLookupTableAccount',
    AssociatedTokenAccount = 'AssociatedTokenAccount',
    TokenMint = 'TokenMint',
}

const AccountInfoDB = {
    getMany: async (
        key: AccountInfoType,
        addresses: string[]
    ): Promise<AccountInfo<Buffer>[]> => (
        await _db.getMany(addresses.map(address => [key, address]))
    ).map(
        (accountInfo: SerialisableAccountInfo) => {
            if (accountInfo) {
                return {
                    ...accountInfo,
                    owner: new PublicKey(accountInfo.owner),
                    data: Buffer.from(accountInfo.data)
                }
            }
            return undefined;
        }
    ),

    put: async (
        key: AccountInfoType,
        address: string,
        accountInfo: AccountInfo<Buffer>
    ): Promise<boolean> => _db.put([key, address], {
        ...accountInfo,
        owner: accountInfo.owner.toString(),
        data: accountInfo.data
    }),

    remove: async (
        key: AccountInfoType,
        address: string
    ): Promise<boolean> => _db.remove([key, address]),

    values: async function* (
        key: AccountInfoType
    ): AsyncGenerator<{ address: PublicKey, accountInfo: AccountInfo<Buffer> | undefined }>{
        for await (const item of values<SerialisableAccountInfo>(_db, key)) {
            const {key: address, value: accountInfo} = item;
            yield {
                address: new PublicKey(address),
                accountInfo: accountInfo ? {
                    ...accountInfo,
                    owner: new PublicKey(accountInfo.owner),
                    data: Buffer.from(accountInfo.data)
                } : undefined
            }
        }
    },
}

export default AccountInfoDB;
