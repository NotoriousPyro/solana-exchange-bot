import { AccountInfo, AddressLookupTableAccount, BlockhashWithExpiryBlockHeight, Connection, PublicKey } from "@solana/web3.js";
import config from "./lib/Config";
import https from "node:https";
import http from "node:http";
import AccountInfoDB, { AccountInfoType } from "./db/AccountInfoDB";
import { LRUCache } from 'lru-cache'

const connections = config.rpcs.map(
    rpc => new Connection(
        rpc.httpEndpoint,
        {
            httpAgent: rpc.httpEndpoint.startsWith("https")
                ? new https.Agent({
                    keepAlive: rpc.keepAlive,
                    keepAliveMsecs: 60000,
                }) : new http.Agent({
                    keepAlive: rpc.keepAlive,
                    keepAliveMsecs: 60000,
                }),
            ...rpc,
        },
    )
)
const simRpcConnections = connections.filter((__, index) => config.rpcs[index].useAsSimulationSource);
const blockhashConnections = connections.filter((__, index) => config.rpcs[index].useAsBlockhashSource);
const getMultipleAccountsInfoConnections = connections.filter((__, index) => config.rpcs[index].useAsGetMultipleAccountsSource);
const connectionGetter = (
    connections: Connection[],
    i: number = 0
) => () => {
    if (connections.length === 0) {
        throw new Error("No connections available");
    }
    if (i >= connections.length) {
        i = 0;
    }
    return connections[i++ % connections.length];
}

export const getSimulationConnection = connectionGetter(simRpcConnections);
export const getBlockhashConnection = connectionGetter(blockhashConnections);
export const getMultipleAccountsInfoConnection = connectionGetter(getMultipleAccountsInfoConnections)
export const connection = connections[0];


export const blockhashCache = new LRUCache<string, BlockhashWithExpiryBlockHeight>({
    max: 1000,
    // 30 seconds
    ttl: 1000 * 5,
    // Define the fetch method for this cache
    fetchMethod: async () => (await getBlockhashConnection().getLatestBlockhash({ commitment: "finalized" })),
})


export type AccountInfoExtended = {
    publicKey: PublicKey,
    accountInfo: AccountInfo<Buffer> | undefined,
    fromCache: boolean
};


/**
 * Return an async generator of `AccountInfoExtended` for the given `publicKeys`
 * @param accountInfoType A recognized account info type by the `AccountInfoDB`
 * @param publicKeys list of public keys as strings
 * @param useCache should the lmdb cache be used
 * @param chunkSize maximum number of public keys to fetch at once
 * @param commitment solana commitment level
 * @returns {AsyncGenerator<AccountInfoExtended>}
 */
export async function* generateAccountInfos(
    accountInfoType: AccountInfoType,
    publicKeys: string[],
    useCache: boolean = false,
    chunkSize: number = 100,
): AsyncGenerator<AccountInfoExtended> {
    const publicKeyInstances = publicKeys.map(publicKey => new PublicKey(publicKey));
    for (let start = 0; start < publicKeys.length; start += chunkSize) {
        /** get the end of the chunk */
        const end = start + chunkSize; 
        /** get a chunk of public keys as strings */
        const publicKeyStringsChunked = publicKeys.slice(start, end);
        /** get a chunk of public keys as `PublicKey` instances */ 
        const publicKeyInstancesChunked = publicKeyInstances.slice(start, end);
        /** get the cached account infos for the chunked public keys */
        const cachedAccountInfos = await AccountInfoDB.getMany(accountInfoType, publicKeyStringsChunked);
        /** if cache is not used, we will treat every account as unknown and fetch them all
         * otherwise we will only fetch the unknown accounts (the ones that are not in the cache) */
        const unknownAccounts = useCache  
            ? publicKeyInstancesChunked.filter((__, index) => !cachedAccountInfos[index])
            : publicKeyInstancesChunked
            ;
        /** get the account infos for the unknown accounts */
        const newAccountInfos = unknownAccounts.length > 0 // without this, we will call the api every time, even if there's nothing in `unknownAccounts`
            ? await getMultipleAccountsInfoConnection().getMultipleAccountsInfo(unknownAccounts)
            : []
            ;
        inner:
        for (let j = 0; j < cachedAccountInfos.length; j++) {
            /** get the public key & the cached account info */
            const publicKey = publicKeyInstancesChunked[j];
            const cachedAccountInfo = cachedAccountInfos[j];
            /** if the cache is used and the account info is cached, then yield the cached info */
            if (useCache && cachedAccountInfo) {
                yield {
                    publicKey,
                    accountInfo: cachedAccountInfo,
                    fromCache: true,
                };
                continue inner;
            }
            /** get the new account info */
            const newAccountInfo = newAccountInfos.shift();
            if (newAccountInfo) {
                /** put the new account info in the cache, then yield the new info */
                void AccountInfoDB.put(accountInfoType, publicKey.toString(), newAccountInfo);
                yield {
                    publicKey,
                    accountInfo: newAccountInfo,
                    fromCache: false,
                };
                continue inner;
            }
            /** if the account info is not in the cache and not fetched from the api, then yield undefined */
            yield {
                publicKey,
                accountInfo: undefined,
                fromCache: false,
            };
        }
    }
}

/**
 * Return a list of `AccountInfoExtended` for the given `publicKeys`
 * @param args same arguments as `generateAccountInfos`
 * @returns {Promise<AccountInfoExtended[]>}
 */
export const getAccountInfos = async (
    ...args: Parameters<typeof generateAccountInfos>
): Promise<AccountInfoExtended[]> => {
    const accountInfos: AccountInfoExtended[] = [];
    for await (const accountInfo of generateAccountInfos(...args)) {
        accountInfos.push(accountInfo);
    }
    return accountInfos;
}

/**
 * Return a list of `AddressLookupTableAccount` for the given `addressLookupTableAddresses`
 * @param addressLookupTableAddresses 
 * @param useCache should the lmdb cache be used
 * @returns {Promise<AddressLookupTableAccount[]>}
 */
export const getAddressLookupTableAccounts = async (
    addressLookupTableAddresses: string[],
    useCache: boolean = true,
): Promise<AddressLookupTableAccount[]> => (
    await getAccountInfos(
        AccountInfoType.AddressLookupTableAccount,
        addressLookupTableAddresses,
        useCache
    )
)
    .filter(accountInfoExtended => accountInfoExtended.accountInfo)
    .map(accountInfoExtended => new AddressLookupTableAccount({
        key: accountInfoExtended.publicKey,
        state: AddressLookupTableAccount.deserialize(new Uint8Array(accountInfoExtended.accountInfo.data)),
    }));
