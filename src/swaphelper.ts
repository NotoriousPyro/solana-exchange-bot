import BigNumber from "bignumber.js";
import config from "./lib/Config";
import { Instruction, QuoteResponse, ResponseError, SwapInstructionsResponse, createJupiterApiClient } from "@jup-ag/api";
import { FetcherWithCustomAgent } from "./lib/RetryFetcher";
import https from 'https';
import http from 'http';
import { createRouteMethodInstruction, decodeSwapInstructionData, Route } from "./program";
import SwapDB, { CachedSwapData } from "./db/SwapDB";
import lodash from "lodash";
import { AddressLookupTableAccount, ComputeBudgetProgram, PublicKey, SimulatedTransactionResponse, TransactionInstruction, VersionedTransaction } from "@solana/web3.js";
import BN from "bn.js";
import { getAddressLookupTableAccounts, getAccountInfos, getSimulationConnection } from "./connection";
import { AccountInfoType } from "./db/AccountInfoDB";
import { compileTransaction } from "./lib/TransactionBuilder";
import bfj from "bfj";
import { Cache } from "./cache";
import { BlockhashNotFoundError, ComputationalBudgetExceededError, InsufficientFundsError, InvalidInstructionData, MemoryAllocationFailedError, NotProfitableError, TransactionError, SimulateTransactionError, SlippageToleranceExceededError, TooManyAccountLocksError, TransactionTooLargeError, UnknownSimulationError } from "./exceptions";
import { RandomQuoteData, ArbRoute } from "./types";

export const officialAgent = new https.Agent({
    keepAlive: true,
    keepAliveMsecs: 60000,
    maxSockets: 100,
})


export const privateAgent = new http.Agent({
    keepAlive: true,
    keepAliveMsecs: 60000,
    maxSockets: 100,
})


export const officialFetcher = createJupiterApiClient({
    basePath: "https://quote-api.jup.ag/v6/",
    fetchApi: FetcherWithCustomAgent(officialAgent),
})


export const privateFetcher = createJupiterApiClient({
    basePath: config.jupiter.endpoint,
    fetchApi: FetcherWithCustomAgent(privateAgent),
})


const calculateTipValue = (
    profitMinusFee: BigNumber,
    tipPercentage: number,
    minTip: BigNumber,
    maxTip: BigNumber,
): BigNumber => BigNumber.min(
    BigNumber.max(
        tipPercentage > 0 ? minTip.plus(
            profitMinusFee
            .dividedBy(100)
            .multipliedBy(tipPercentage)
        ) : minTip,
        minTip
    ),
    new BigNumber(maxTip)
).decimalPlaces(0);

const calculateTipAndExpectedOutAmount = (
    tipPercentage: number,
    inAmount: BigNumber,
    otherAmountThreshold: BigNumber,
    inAmountFee: BigNumber,
    minExtraAmount: number,
    profitMinusFee: BigNumber,
    minTip: BigNumber,
    maxTip: BigNumber,
): { tipValue: BigNumber, expectedOutAmount: BigNumber } => {
    for (
        let _tipPercentage = tipPercentage;
        _tipPercentage >= 0;
        _tipPercentage -= 0.1
    ) {
        const tipValue = calculateTipValue(profitMinusFee, _tipPercentage, minTip, maxTip);
        const expectedOutAmount = inAmount.plus(tipValue).plus(inAmountFee).decimalPlaces(0);
        if (otherAmountThreshold.isGreaterThanOrEqualTo(expectedOutAmount.plus(minExtraAmount))) {
            return { tipValue, expectedOutAmount };
        }
    }
    throw new NotProfitableError();
}




export const getTipValue = (
    {
        quoteA,
        quoteB
    }: {
        quoteA: QuoteResponse,
        quoteB: QuoteResponse
    },
    {
        minTip,
        maxTip,
        tipPercentage = 10
    }: {
        minTip: BigNumber,
        maxTip: BigNumber,
        tipPercentage: number,
    },
    feeMulti: number = 1,
): { tipValue: BigNumber, expectedOutAmount: BigNumber } => {
    const inAmount = new BigNumber(quoteA.inAmount);
    const outThreshold = new BigNumber(quoteB.otherAmountThreshold);
    const feeMap = config.feeMintMap.get(quoteA.inputMint);
    const inAmountFee = new BigNumber(feeMap.fee ?? 5000).multipliedBy(feeMulti);
    const rawProfit = outThreshold.minus(inAmount);
    if (rawProfit.isLessThanOrEqualTo(0)) {
        throw new NotProfitableError();
    }
    const profitMinusFee = rawProfit.minus(inAmountFee);
    const _calculateTipAndExpectedOutAmount = (
        _minTip: BigNumber,
        _maxTip: BigNumber,
    ) => calculateTipAndExpectedOutAmount(
        tipPercentage,
        inAmount,
        outThreshold,
        inAmountFee,
        feeMap.minExtraAmount ?? 0,
        profitMinusFee,
        _minTip,
        _maxTip,
    )
    if (profitMinusFee.isLessThan(config.jito.minTip ?? 1_000)) {
        throw new NotProfitableError();
    }
    if (profitMinusFee.minus(minTip).isGreaterThanOrEqualTo(feeMap.minExtraAmount ?? 0)) {
        return _calculateTipAndExpectedOutAmount(minTip, maxTip);
    }
    if (minTip.isGreaterThanOrEqualTo(config.jito.minTip ?? 1_000) && profitMinusFee.minus(config.jito.minTip ?? 1_000).isGreaterThanOrEqualTo(feeMap.minExtraAmount ?? 0)) {
        return _calculateTipAndExpectedOutAmount(new BigNumber(config.jito.minTip ?? 1_000), minTip);
    }
    throw new NotProfitableError();
}

export class JupiterApiError extends TransactionError {
    constructor(message: string) {
        super(message);
    }
}

export class RoutePlanDoesNotConsumeAllTheAmountError extends JupiterApiError {
    constructor(message: string = "Route plan does not consume all the amount") {
        super(message);
    }
}

export class TokenNotTradeableError extends JupiterApiError {
    constructor(message: string = "Token not tradeable") {
        super(message);
    }
}

export class CouldNotFindAnyRouteError extends JupiterApiError {
    constructor(message: string = "Could not find any route") {
        super(message);
    }
}


type JupiterApiErrorResponse = {
    errorCode?: string,
    error: string,
}

export const handleResponseError = async (
    e: unknown
): Promise<Error> => {
    if (e instanceof ResponseError) {
        const response: Response = e.response
        const respText = await response.text();
        try {
            const parsed: JupiterApiErrorResponse = JSON.parse(respText);
            if (parsed.errorCode) {
                switch (parsed.errorCode) {
                    case "COULD_NOT_FIND_ANY_ROUTE":
                        return Promise.reject(new CouldNotFindAnyRouteError(parsed.error));
                    case "ROUTE_PLAN_DOES_NOT_CONSUME_ALL_THE_AMOUNT":
                        return Promise.reject(new RoutePlanDoesNotConsumeAllTheAmountError(parsed.error));
                    case "TOKEN_NOT_TRADABLE": {
                        return Promise.reject(new TokenNotTradeableError(parsed.error));
                    }
                }
            }
            if (parsed.error) {
                return Promise.reject(new JupiterApiError(parsed.error));
            }
        } catch (e) {
            return Promise.reject(new JupiterApiError(`Could not parse error response: ${e.message}`));
        }
        return Promise.reject(new JupiterApiError(respText));
    }
    if (e instanceof Error) {
        return Promise.reject(e);
    }
    return Promise.reject(new Error("Unknown error"));
}


export const getQuote = async (
    fetcher: ReturnType<typeof createJupiterApiClient>,
    inputMint: string,
    outputMint: string,
    amount: BigNumber | string,
    maxSlippage: number,
    maxAccounts: number,
    onlyDirectRoutes: boolean = false,
    //dexes: string = config.jupiter.dexes.join(","),
) => await fetcher.quoteGet({
    inputMint,
    outputMint,
    amount: amount instanceof BigNumber ? amount.toNumber() : BigNumber(amount).toNumber(),
    swapMode: "ExactIn",
    slippageBps: maxSlippage,
    maxAccounts,
    onlyDirectRoutes,
    restrictIntermediateTokens: config.jupiter.restrictIntermediateTokens,
}).catch(async e => Promise.reject(await handleResponseError(e)));



export const getSwapInstructionsUncached = async (
    fetcher: ReturnType<typeof createJupiterApiClient>,
    quote: QuoteResponse,
) => await fetcher.swapInstructionsPost({
    swapRequest: {
        userPublicKey: config.SIGNER_KEY.publicKey.toString(),
        useSharedAccounts: false,
        wrapAndUnwrapSol: false,
        dynamicComputeUnitLimit: false,
        useTokenLedger: false,
        skipUserAccountsRpcCalls: true,
        quoteResponse: quote,
    }
}).catch(async e => Promise.reject(await handleResponseError(e)));


export const getQuotes = async (
    mint: string,
    arbMint: string,
    { inAmount, quoteA_maxAccounts, quoteB_maxAccounts }: RandomQuoteData,
): Promise<ArbRoute> => await getQuote(
    privateFetcher,
    mint,
    arbMint,
    inAmount,
    config.slippageA,
    quoteA_maxAccounts,
    config.onlyDirectRoutesA,
).then(async quoteA => {
    const quoteB = await getQuote(
        privateFetcher,
        arbMint,
        mint,
        quoteA.otherAmountThreshold,
        config.slippageB,
        quoteB_maxAccounts,
        config.onlyDirectRoutesB,
    );
    return { quoteA, quoteB };
});


export const deserializeInstruction = async (
    instruction: Instruction
) => {
    try {
        return new TransactionInstruction({
            programId: new PublicKey(instruction.programId),
            keys: instruction.accounts.map(key => ({
                pubkey: new PublicKey(key.pubkey),
                isSigner: key.isSigner,
                isWritable: key.isWritable,
            })),
            data: Buffer.from(instruction.data, "base64"),
        });
    }
    catch (e) {
        return Promise.reject(e);
    }
}


/**
 * Filter out setup instructions for ATAs already initialised
 * @param setupInstructions
 * @returns {Promise<TransactionInstruction[]>}
 */
const filterSetupInstructions = async (
    setupInstructions: TransactionInstruction[]
): Promise<TransactionInstruction[]> => {
    const ataInfosMaybeCachedUninitialised = (await getAccountInfos(
        AccountInfoType.AssociatedTokenAccount,
        setupInstructions.map(instruction => instruction.keys[1].pubkey.toString()),
        true
    )).filter(ataInfo => !ataInfo || ataInfo && !ataInfo.accountInfo || ataInfo.accountInfo?.lamports <= 0);
    const uninitialisedAtasUncached = await getAccountInfos(
        AccountInfoType.AssociatedTokenAccount,
        ataInfosMaybeCachedUninitialised.filter(ataInfo => ataInfo.fromCache).map(info => info.publicKey.toString()),
        false
    )
    const ataInfos = [...uninitialisedAtasUncached, ...ataInfosMaybeCachedUninitialised.filter(ataInfo => !ataInfo.fromCache)];
    const setupInstructionsFiltered = setupInstructions.filter(setupInstruction => 
        ataInfos.find(ataInfo => ataInfo?.publicKey.equals(setupInstruction.keys[1].pubkey))
    );
    return setupInstructionsFiltered;
}


const getFilteredSetupInstructions = async (
    setupInstructions: Instruction[]
): Promise<TransactionInstruction[]> => await filterSetupInstructions(await Promise.all(setupInstructions.map(deserializeInstruction)));



type PreparedSwapInstructions = {
    addressLookupTableAccounts: AddressLookupTableAccount[],
    setupInstructions: TransactionInstruction[],
    swapInstruction: TransactionInstruction,
}


const prepareSwapInstructionsCached = async (
    swapInfo: CachedSwapData,
    inAmount: BigNumber,
    outAmount: BigNumber,
): Promise<PreparedSwapInstructions> => {
    const accounts = swapInfo.remainingAccounts.map(account => ({...account, pubkey: new PublicKey(account.pubkey)}))
    const [addressLookupTableAccounts, setupInstructions, { instruction: swapInstruction }] = await Promise.all([
        getAddressLookupTableAccounts(
            [...config.addressLookupTableAddresses, ...swapInfo.addressLookupTableAddresses]
        ),
        getFilteredSetupInstructions(swapInfo.setupInstructions),
        createRouteMethodInstruction(
            {
                tokenProgram: accounts[0].pubkey,
                userTransferAuthority: accounts[1].pubkey,
                userSourceTokenAccount: accounts[2].pubkey,
                userDestinationTokenAccount: accounts[3].pubkey,
                destinationTokenAccount: accounts[4].pubkey,
                destinationMint: accounts[5].pubkey,
                platformFeeAccount: accounts[6].pubkey,
                eventAuthority: accounts[7].pubkey,
                program: accounts[8].pubkey,
            },
            accounts.slice(9),
            swapInfo.routePlan,
            new BN(inAmount.toString()),
            new BN(outAmount.toString()),
            config.SIGNER_KEY,
        )
    ]);
    return {
        addressLookupTableAccounts,
        setupInstructions,
        swapInstruction,
    }
}


const prepareSwapInstructionsUncached = async (
    swapInfo: SwapInstructionsResponse,
): Promise<PreparedSwapInstructions> => {
    const [addressLookupTableAccounts, setupInstructions, swapInstruction] = await Promise.all([
        getAddressLookupTableAccounts(
            [...config.addressLookupTableAddresses, ...swapInfo.addressLookupTableAddresses]
        ),
        getFilteredSetupInstructions(swapInfo.setupInstructions),
        deserializeInstruction(swapInfo.swapInstruction)
    ]);
    return {
        addressLookupTableAccounts,
        setupInstructions,
        swapInstruction,
    }
}


export const createSwapTx = async (
    {
        setupInstructions,
        swapInstruction,
        addressLookupTableAccounts,
        blockhash,
        computeUnitLimit,
        heapSize,
        tipIx,
    }: {
        setupInstructions: TransactionInstruction[],
        swapInstruction: TransactionInstruction,
        addressLookupTableAccounts: AddressLookupTableAccount[],
        blockhash: string,
        computeUnitLimit: number,
        heapSize: number,
        tipIx?: TransactionInstruction,
    }
) => await compileTransaction(
    config.SIGNER_KEY.publicKey,
    [
        ComputeBudgetProgram.setComputeUnitLimit({
            units: BigNumber.min(BigNumber.max(computeUnitLimit, 10_000), 1_400_000).toNumber(),
        }),
        ...new BigNumber(heapSize).isGreaterThan(32_768) ? [ComputeBudgetProgram.requestHeapFrame({
            bytes: BigNumber.min(heapSize, 262_144).toNumber(),
        })] : [],
        ...setupInstructions,
        swapInstruction,
        ...tipIx ? [tipIx] : [],
    ],
    addressLookupTableAccounts,
    blockhash,
)

export const createTipTx = async (
    {
        blockhash,
        tipIx,
    }: {
        blockhash: string,
        tipIx?: TransactionInstruction,
    }
) => await compileTransaction(
    config.SIGNER_KEY.publicKey,
    [
        ...tipIx ? [tipIx] : [],
    ],
    [],
    blockhash,
)


export const getSwapInstructions = async (
    quoteResponse: QuoteResponse[],
): Promise<{
    swapInstruction: TransactionInstruction,
    setupInstructions: TransactionInstruction[],
    addressLookupTableAccounts: AddressLookupTableAccount[],
}[]> => {
    const isEnabledCache = config.cache.swapInfo && lodash.every(
        quoteResponse.flatMap(
            quote => quote.routePlan.map(step => step.swapInfo.label)
        ),
        label => lodash.includes([
            ...config.cache.enabledCacheDexes ?? [],
            ...[
                "Aldrin",
                "Aldrin V2",
                "Dexlab",
                "FluxBeam",
                "Helium Network",
                "Mercurial",
                "Meteora",
                "Openbook",
                "OpenBook V2",
                "Orca V1",
                "Orca V2",
                "Penguin",
                "Phoenix",
                "Raydium",
                "Saber",
                "Saber (Decimals)",
                "Sanctum",
                "Sanctum Infinity",
                "Saros",
                "Token Swap",
                "Oasis"
            ]
        ], label)
    );
    if (isEnabledCache) {
        const swapInfos = await Promise.all(quoteResponse.map(quote => getSwapInstructionsCached(privateFetcher, quote)));
        return await Promise.all(swapInfos.map((swapInfo, index) => prepareSwapInstructionsCached(
            swapInfo,
            new BigNumber(quoteResponse[index].inAmount),
            new BigNumber(quoteResponse[index].otherAmountThreshold),
        )));
    }
    const swapInfos = await Promise.all(quoteResponse.map(quote => getSwapInstructionsUncached(privateFetcher, quote)));
    return await Promise.all(swapInfos.map(swapInfo => prepareSwapInstructionsUncached(swapInfo)));
}



export const getSwapInstructionsCached = async (
    fetcher: ReturnType<typeof createJupiterApiClient>,
    quote: QuoteResponse,
): Promise<CachedSwapData> => {
    const { inputMint, outputMint, routePlan } = quote;
    const [routeAmmkeys] = [
        routePlan.map(step => step.swapInfo.ammKey),
    ];
    const cachedSwap = SwapDB.get({
        inputMint,
        outputMint,
        routeAmmkeys
    });
    if (cachedSwap && Date.now() < cachedSwap.expiry) {
        return cachedSwap.value;
    }
    const swap = await getSwapInstructionsUncached(fetcher, quote);
    const decoded = await decodeSwapInstructionData<Route["Arguments"]>(Buffer.from(swap.swapInstruction.data, "base64"));
    void SwapDB.put({ inputMint, outputMint, routeAmmkeys }, {
        value: {
            routePlan: decoded.routePlan,
            remainingAccounts: swap.swapInstruction.accounts,
            setupInstructions: swap.setupInstructions,
            addressLookupTableAddresses: swap.addressLookupTableAddresses,
        },
        expiry: Date.now() + config.cache.maxCacheAgeMs
    });
    return {
        routePlan: decoded.routePlan,
        remainingAccounts: swap.swapInstruction.accounts,
        setupInstructions: swap.setupInstructions,
        addressLookupTableAddresses: swap.addressLookupTableAddresses,
    };
}

/**
 * Anchor can't handle all errors for some reason, so this exists to handle those cases
 * @param logs
 * @returns 
 */
export const extractErrorDetailFromLogs = (
    logs: string[]
): {
    programId: string,
    logs: string[]
} => {
    const failedIndex = logs.findLastIndex(log => log.search(/Program (.*) failed/) !== -1)
    const startInvokeIndex = logs.findLastIndex(log => log.search(/Program (.*) invoke/) !== -1);
    const programId = logs[startInvokeIndex]?.match(/Program (.*) invoke/)?.[1] ||
        logs[failedIndex]?.match(/Program (.*) failed/)?.[1];
    const startSuccessIndex = logs.findLastIndex(log => log.search(/Program (.*) success/) !== -1);

    const logsFiltered = startSuccessIndex !== -1
        ? logs.slice(startSuccessIndex, failedIndex + 1)
        : startInvokeIndex !== -1
            ? logs.slice(startInvokeIndex, failedIndex + 1)
            : logs.slice(-5)
        ;
    return {
        programId: programId || "unknown",
        logs: logsFiltered
    };
}


export const simulation = async (
    tx: VersionedTransaction,
): Promise<SimulatedTransactionResponse> => {
    try {
        const simulation = await getSimulationConnection().simulateTransaction(tx, {
            replaceRecentBlockhash: true,
            sigVerify: false,
        })
        if (simulation.value.err) {
            if (simulation.value.err === "BlockhashNotFound") {
                return Promise.reject(new BlockhashNotFoundError());
            }
            if (simulation.value.logs) {
                if (
                    typeof simulation.value.err === "object"
                    && Object.hasOwn(simulation.value.err, "InstructionError")
                ) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const errs = new Map<number, string>([(simulation.value.err as any)?.InstructionError]).entries();
                    for (const [__, err] of errs) {
                        if (err === "InvalidInstructionData") {
                            return Promise.reject(new InvalidInstructionData("InstructionError: InvalidInstructionData"));
                        }
                        if (typeof err === "object") {
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            if ((err as any)?.Custom === 6001) {
                                return Promise.reject(new SlippageToleranceExceededError());
                            }
                        }
                    }
                }
                if (simulation.value.logs.find(log => log.search(/SlippageToleranceExceeded/) !== -1)) {
                    return Promise.reject(new SlippageToleranceExceededError());
                }
                if (simulation.value.logs.find(log => log.search(/insufficient funds/) !== -1)) {
                    return Promise.reject(new InsufficientFundsError(simulation.value));
                }
                if (simulation.value.logs.find(log => log.search(/memory allocation failed/) !== -1)) {
                    return Promise.reject(new MemoryAllocationFailedError());
                }
                if (simulation.value.logs.find(log => log.search(/Transaction locked too many accounts/) !== -1)
                    || typeof simulation.value.err === "string" && simulation.value.err == "TooManyAccountLocks"
                ) {
                    return Promise.reject(new TooManyAccountLocksError());
                }
                if (simulation.value.logs.find(log => log.search(/(exceeded CUs meter at BPF instruction|Computational budget exceeded)/) !== -1)) {
                    return Promise.reject(new ComputationalBudgetExceededError());
                }
                const {programId, logs} = extractErrorDetailFromLogs(simulation.value.logs);
                const programName = Cache.programIdsToName.get(programId) || "unknown";
                switch (programName) {
                    case "Openbook": // Openbook bases their exceptions on line numbers so if they ever change the code, then this won't work, which is a retarded thing for them to do
                        if (logs.find(log => log.search(/0x10000a6/) !== -1)) { // InvalidMarketFlags
                            return Promise.reject(new SimulateTransactionError("Openbook failed: InvalidMarketFlags"));
                        }
                        break;
                }
                if (logs.length > 0) {
                    return Promise.reject(new SimulateTransactionError(`Program ${programName} failed:\n -> ${logs.join("\n -> ")}`));
                }
            }
            if (typeof simulation.value.err === "string") {
                return Promise.reject(new SimulateTransactionError(simulation.value.err));
            }
            return Promise.reject(new SimulateTransactionError(await bfj.stringify(simulation.value.err, {
                space: 2,
                promises: 'ignore',
                buffers: 'ignore',
                maps: 'ignore',
                iterables: 'ignore',
                bufferLength: 4096,
            })));
        }
        return {
            ...simulation.value,
        };
    }
    catch (e) {
        if (e instanceof Error) {
            if (e.message.search(/Transaction too large/) !== -1) {
                return Promise.reject(new TransactionTooLargeError());
            }
            return Promise.reject(e);
        }
        return Promise.reject(new UnknownSimulationError("Unknown error"));
    }
}
