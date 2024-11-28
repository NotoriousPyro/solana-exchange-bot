process.title = "sexbot";
import {
    FetchError,
    QuoteResponse,
} from "@jup-ag/api";
import config from "./lib/Config";
import { TradeConfig } from "./lib/Config";
import {
    SimulatedTransactionResponse,
} from "@solana/web3.js";
import BigNumber from "bignumber.js";
import {
    getRandomizedQuoteData,
    sleep,
} from "./utils";
import AsyncLogger from "./lib/AsyncLogger";
import {
    CouldNotFindAnyRouteError,
    getQuotes,
    getSwapInstructions,
    getTipValue,
    createSwapTx,
    JupiterApiError,
    RoutePlanDoesNotConsumeAllTheAmountError,
    simulation,
    TokenNotTradeableError,
} from "./swaphelper";
import {
    blockhashCache,

} from "./connection";
import {
    initialiseCache
} from "./cache";
import keypress from "keypress";
import {
    BundleDispatcher,
    getTipTransactionInstruction,
    RateLimiterLimited,
    SendBundleError,
} from "./lib/Jito";
import SwapInfoMetaDB, { SwapInfoMeta, SwapInfoMetaKey } from "./db/SwapInfoMetaDB";
import { MirroredRoutesError, QuoteNormaliser } from "./lib/NormaliseQuoteResponse";
import { WellKnownTokenMints } from "./const";
import {
    SlippageToleranceExceededError,
    MemoryAllocationFailedError,
    TransactionTooLargeError,
    ComputationalBudgetExceededError,
    InsufficientFundsError,
    NotProfitableError,
    BlockhashNotFoundError,
    InvalidInstructionData,
    SimulateTransactionError,
    UnknownSimulationError,
    TooManyAccountLocksError
} from "./exceptions";


let debug = false;
let printQuoteData = false;
let printTimetaken = false;
let trading = true;

const logger = new AsyncLogger("Main");

const JitoBundleDispatcher = new BundleDispatcher(config.BE_KEY, config.jito.regions, config.jito.maxTxPerSecondPerRegion);

// set the initial length of the pairs
let pairsLength = config.pairs.length;

setInterval(() => {
    // if the pairs length has changed, save the new pairs
    if (pairsLength !== config.pairs.length) {
        config.save().then(() => {
            pairsLength = config.pairs.length;
            logger.debug("Updated pairs", config.pairs);
        });
    }
}, 60000)

if (process.stdin.isTTY) {
    keypress(process.stdin);
    process.stdin.on('keypress', function (__ch, key) {
        logger.debug('got "keypress"', key);
        if (key) {
            if (key.ctrl) {
                if (key.name === 'c') {
                    logger.log("Exiting");
                    trading = false;
                    process.exit();
                }
            }
            if (key.name === 'd') {
                debug = !debug;
                logger.debug("Debug mode set to", debug);
            }
            if (key.name === 'p') {
                printQuoteData = !printQuoteData;
                logger.debug("Print quote data set to", printQuoteData);
            }
            if (key.name === 't') {
                printTimetaken = !printTimetaken;
                logger.debug("Print time taken set to", printTimetaken);
            }
        }
    });
    process.stdin.setRawMode(true);
}

process.stdin.resume();






const saveSimulationSuccess = async (
    swapInfoMetaKey: SwapInfoMetaKey,
    sim: SimulatedTransactionResponse,
    swapInfoMeta: SwapInfoMeta,
    heapSize: number,
) => {
    if (sim.unitsConsumed && sim.logs.length > 0) {
        const computeUnits = calculateComputeUnits(sim.unitsConsumed);
        void SwapInfoMetaDB.put(swapInfoMetaKey,
            {
                ...swapInfoMeta,
                computeUnits,
                heapSize,
                expiry: Date.now() + config.cache.maxCacheAgeMs,
            }
        );
        return Promise.resolve(sim);
    }
    return Promise.resolve(sim);
}

const saveSimulationFailure = async (
    swapInfoMetaKey: SwapInfoMetaKey,
    e: unknown,
    swapInfoMeta: SwapInfoMeta,
    heapSize?: number,
    computeUnits?: number,
) => {
    const slippageToleranceExceeded = e instanceof SlippageToleranceExceededError;
    if (slippageToleranceExceeded) {
        return Promise.reject(e);
    }
    const tooManyAccountLocks = e instanceof TooManyAccountLocksError;
    const memoryAllocationFailed = e instanceof MemoryAllocationFailedError;
    const transactionTooLarge = e instanceof TransactionTooLargeError;
    const computationalBudgetExceeded = e instanceof ComputationalBudgetExceededError;
    void SwapInfoMetaDB.put(swapInfoMetaKey, {
        ...swapInfoMeta,
        tooManyAccountLocks,
        transactionTooLarge,
        memoryAllocationFailed,
        heapSize: memoryAllocationFailed ? heapSize + (config.heapSizeStep ?? 32_768) : heapSize,
        computationalBudgetExceeded,
        computeUnits: computationalBudgetExceeded ? computeUnits + (config.computeUnitLimitStep ?? 5_000) : computeUnits,
        lastSimulationFailedAnyReason: true,
    })
    return Promise.reject(e);
}


const calculateComputeUnits = (
    computeUnits?: number,
): number => computeUnits
    ? BigNumber.min(
        BigNumber.max(
            new BigNumber(computeUnits).plus(config.computeUnitLimitStep ?? 5000),
            100_000
        ),
        config.computeUnitLimitBase ?? 1_400_000
    ).decimalPlaces(0).toNumber()
    : config.computeUnitLimitBase ?? 1_400_000
    ;


const shouldSimulate = async (
    swapInfoMeta: SwapInfoMeta,
): Promise<boolean> => {
    if (swapInfoMeta?.tooManyAccountLocks) {
        return Promise.reject(new TooManyAccountLocksError());
    }
    if (swapInfoMeta?.transactionTooLarge) {
        return Promise.reject(new TransactionTooLargeError());
    }
    if (swapInfoMeta?.lastSimulationFailedAnyReason) {
        return Promise.resolve(true);
    }
    if (!swapInfoMeta?.expiry || swapInfoMeta?.expiry && swapInfoMeta.expiry < Date.now()) {
        return Promise.resolve(true);
    }
    return Promise.resolve(false);
}

// const calculateInputOutputDifference = (
//     inAmount: BigNumber,
//     expectedOutAmount: BigNumber
// ) => expectedOutAmount.minus(inAmount);

type ArbitrageRoute = {
    quoteA: QuoteResponse,
    quoteB: QuoteResponse,
    tipValue: BigNumber,
    expectedOutAmount: BigNumber
}

type Arbitrageur = (
    {
        quoteA,
        quoteB,
        ...tipInfo
    }: ArbitrageRoute
) => Promise<void>;
/**
 * Arbs quoteA and quoteB in separate transactions: txA and txB
 * @param client {DefaultApi}
 * @param quoteA {QuoteResponse}
 * @param quoteB {QuoteResponse}
 * @param arbConfig {TradeConfig}
 * @returns {Promise<void>}
 */
const arbSplit: Arbitrageur = async (
    {
        quoteA,
        quoteB,
        tipValue,
        expectedOutAmount
    }: ArbitrageRoute
): Promise<void> => {
    const swapInfoMetaKeyA = SwapInfoMetaDB.keyByQuotes([quoteA])
    const swapInfoMetaA = SwapInfoMetaDB.get(swapInfoMetaKeyA);
    const simulateA = await shouldSimulate(swapInfoMetaA);
    const swapInfoMetaKeyB = SwapInfoMetaDB.keyByQuotes([quoteB]);
    const swapInfoMetaB = SwapInfoMetaDB.get(swapInfoMetaKeyB);
    const simulateB = await shouldSimulate(swapInfoMetaB);
    const [swapA, swapB] = await getSwapInstructions([
        {
            ...quoteA,
            inAmount: quoteA.inAmount,
        },
        {
            ...quoteB,
            outAmount: expectedOutAmount.toString(),
            otherAmountThreshold: expectedOutAmount.toString(),
        },
    ]);
    const computeUnitLimits = [
        calculateComputeUnits(swapInfoMetaA?.computeUnits),
        calculateComputeUnits(swapInfoMetaB?.computeUnits),
    ];
    const heapSizes = [
        swapInfoMetaA?.heapSize ?? config.defaultHeapSizeSplitArb ?? 65_536,
        swapInfoMetaB?.heapSize ?? config.defaultHeapSizeSplitArb ?? 65_536,
    ];
    const tipIxs = [
        undefined,
        getTipTransactionInstruction(config.SIGNER_KEY, tipValue.toNumber()),
    ];
    const blockhash = await blockhashCache.fetch('blockhash');
    const [txA, txB] = (await Promise.all([swapA, swapB].map(
        (swap, index) => createSwapTx({
            setupInstructions: swap.setupInstructions,
            swapInstruction: swap.swapInstruction,
            addressLookupTableAccounts: swap.addressLookupTableAccounts,
            blockhash: blockhash.blockhash,
            computeUnitLimit: computeUnitLimits[index],
            heapSize: heapSizes[index],
            tipIx: tipIxs[index],
        })
    ))).map(tx => {
        tx.sign([config.SIGNER_KEY]);
        return tx;
    });
    await Promise.all([
        simulateA ? simulation(txA)
            .then(res => saveSimulationSuccess(swapInfoMetaKeyA, res, swapInfoMetaA, heapSizes[0]))
            .catch(e => saveSimulationFailure(swapInfoMetaKeyA, e, swapInfoMetaA, heapSizes[0], computeUnitLimits[0]))
            : Promise.resolve(),
        simulateB ? simulation(txB)
            .then(res => saveSimulationSuccess(swapInfoMetaKeyB, res, swapInfoMetaB, heapSizes[1]))
            .catch(async e => {
                const swapInfoMetaKey = swapInfoMetaKeyB;
                const swapInfoMeta = swapInfoMetaB;
                const insufficientFundsError = e instanceof InsufficientFundsError;
                if (insufficientFundsError) {
                    return await saveSimulationSuccess(swapInfoMetaKey, e.simulation, swapInfoMeta, heapSizes[1]);
                }
                const heapSize = heapSizes[1];
                const computeUnitLimit = computeUnitLimits[1];
                return await saveSimulationFailure(swapInfoMetaKey, e, swapInfoMeta, heapSize, computeUnitLimit);
            })
            : Promise.resolve(),
    ]);
    await JitoBundleDispatcher.sendBundleGRPC(
        [txA, txB],
    ).catch(async e => {
        if (e instanceof TooManyAccountLocksError) {
            if (e.message.includes("too many account locks")) {
                const swapInfoMetaKey = SwapInfoMetaDB.keyByQuotes([quoteA, quoteB]);
                await saveSimulationFailure(swapInfoMetaKey, e, {
                    tooManyAccountLocks: true,
                })
            }
        }
        return Promise.reject(e);
    });
    return Promise.resolve();
}

/**
 * Arb quoteA and quoteB atomically in one transaction
 * @param client {DefaultApi}
 * @param quoteA {QuoteResponse}
 * @param quoteB {QuoteResponse}
 * @param arbConfig {TradeConfig}
 * @returns {Promise<void>}
 */
const arbAtomic: Arbitrageur = async (
    {
        quoteA,
        quoteB,
        tipValue,
        expectedOutAmount
    }: ArbitrageRoute
): Promise<void> => {
    const swapInfoMetaKey = SwapInfoMetaDB.keyByQuotes([quoteA, quoteB]);
    const swapInfoMeta = SwapInfoMetaDB.get(swapInfoMetaKey);
    const simulate = await shouldSimulate(swapInfoMeta);
    const quote = {
        inputMint: quoteA.inputMint,
        outputMint: quoteA.inputMint,
        inAmount: quoteA.inAmount,
        outAmount: expectedOutAmount.toString(),
        otherAmountThreshold: expectedOutAmount.toString(),
        swapMode: quoteA.swapMode,
        slippageBps: 0,
        priceImpactPct: new BigNumber(quoteA.priceImpactPct).plus(quoteB.priceImpactPct).dividedBy(2).toString(),
        routePlan: [
            ...quoteA.routePlan,
            ...quoteB.routePlan,
        ],
    };
    const [swap] = await getSwapInstructions([quote]);
    const computeUnitLimit = calculateComputeUnits(swapInfoMeta?.computeUnits);
    const heapSize = swapInfoMeta?.heapSize ?? config.defaultHeapSize ?? 131_072;
    const tipIx = getTipTransactionInstruction(config.SIGNER_KEY, tipValue.toNumber());
    const blockhash = await blockhashCache.fetch('blockhash');
    const [tx] = (await Promise.all([swap].map(swap => createSwapTx({
        setupInstructions: swap.setupInstructions,
        swapInstruction: swap.swapInstruction,
        addressLookupTableAccounts: swap.addressLookupTableAccounts,
        blockhash: blockhash.blockhash,
        computeUnitLimit,
        heapSize,
        tipIx,
    })))).map(tx => {
        tx.sign([config.SIGNER_KEY]);
        return tx;
    });
    if (simulate) {
        await simulation(tx)
            .then(res => saveSimulationSuccess(swapInfoMetaKey, res, swapInfoMeta, heapSize))
            .catch(e => saveSimulationFailure(swapInfoMetaKey, e, swapInfoMeta, heapSize, computeUnitLimit));
    }
    await JitoBundleDispatcher.sendBundleGRPC(
        [tx],
    ).catch(async e => {
        if (e instanceof TooManyAccountLocksError) {
            if (e.message.includes("too many account locks")) {
                await saveSimulationFailure(swapInfoMetaKey, e, {
                    tooManyAccountLocks: true,
                })
            }
        }
        return Promise.reject(e);
    });
    return Promise.resolve();
}

const handleJupiterApiErrors = async (e: Error) => {
    if (e instanceof CouldNotFindAnyRouteError) {
        logger.debug(e);
        return Promise.resolve();
    }
    if (e instanceof RoutePlanDoesNotConsumeAllTheAmountError) {
        logger.warn(e);
        return Promise.resolve();
    }
    if (e instanceof TokenNotTradeableError) {
        logger.error(e);
        return Promise.resolve();
    }
    if (e instanceof JupiterApiError) {
        logger.error(e);
        return Promise.resolve();
    }
    if (e instanceof Error) {
        logger.error(e.message);
    }
    return Promise.reject(e);
}

const handleErrors = async (
    e: Error,
    mint: string,
    vsMint: string
) => {
    if (e instanceof RateLimiterLimited
        || e instanceof RangeError
    ) {
        logger.debug(e.message, mint, vsMint);
        return Promise.resolve();
    }
    if (
        e instanceof MirroredRoutesError
        || e instanceof NotProfitableError
        || e instanceof RoutePlanDoesNotConsumeAllTheAmountError
        || e instanceof TransactionTooLargeError
        || e instanceof FetchError
    ) {
        logger.debug(e.message, mint, vsMint);
        return Promise.resolve();
    }
    if (
        e instanceof BlockhashNotFoundError
        || e instanceof MemoryAllocationFailedError
        || e instanceof TooManyAccountLocksError
        || e instanceof SlippageToleranceExceededError
        || e instanceof InvalidInstructionData
        || e instanceof InsufficientFundsError
        || e instanceof SimulateTransactionError
        || e instanceof ComputationalBudgetExceededError
        || e instanceof SendBundleError
    ) {
        logger.warn(e.message, mint, vsMint);
        return Promise.resolve();
    }
    if (e instanceof UnknownSimulationError) {
        logger.error(e.message, mint, vsMint);
        return Promise.resolve();
    }
    return await handleJupiterApiErrors(e);
}


const tradeToken = async (
    mint: string,
    vsMint: string,
    arbConfig: TradeConfig,
    quoteNormaliser: QuoteNormaliser
) => {
    const randomQuoteData = getRandomizedQuoteData(
        arbConfig.minAmount,
        arbConfig.maxAmount,
        arbConfig.minAccounts,
        arbConfig.maxAccounts,
        config.TARGET_ACCOUNTS
    )
    const quoteInfo = await getQuotes(mint, vsMint, randomQuoteData);
    const normalisedQuoteInfo = await quoteNormaliser.normalise(quoteInfo);
    const tipInfo = {
        minTip: new BigNumber(arbConfig.minJitoTip),
        maxTip: new BigNumber(arbConfig.maxJitoTip),
        tipPercentage: arbConfig.tipPercentage
    };
    await arbAtomic({
        ...normalisedQuoteInfo,
        ...getTipValue(normalisedQuoteInfo, tipInfo),
    })
    .catch(async e => {
        if (e instanceof RoutePlanDoesNotConsumeAllTheAmountError) {
            await arbAtomic({
                ...quoteInfo,
                ...getTipValue(quoteInfo, tipInfo),
            })
            .catch(async e => {
                const isTooLarge = e instanceof TransactionTooLargeError;
                const memoryAllocationFailed = e instanceof MemoryAllocationFailedError;
                if (isTooLarge || memoryAllocationFailed) {
                    return await arbSplit({
                        ...quoteInfo,
                        ...getTipValue(quoteInfo, tipInfo, 2),
                    });
                }
                return Promise.reject(e);
            })
        }
        const isTooLarge = e instanceof TransactionTooLargeError;
        const memoryAllocationFailed = e instanceof MemoryAllocationFailedError;
        if (isTooLarge || memoryAllocationFailed) {
            return await arbSplit({
                ...normalisedQuoteInfo,
                ...getTipValue(normalisedQuoteInfo, tipInfo, 2),
            });
        }
        return Promise.reject(e);
    });
    return Promise.resolve();
}


const trade = async (
    tradeConfig: TradeConfig,
) => {
    let i = 0;
    const tradableMints = tradeConfig.shortenToNearestMint
        ? tradeConfig.mints
        : [WellKnownTokenMints.Solana];
    const quoteNormaliser = new QuoteNormaliser(tradableMints);
    while (trading) {
        if (i >= config.pairs.length) {
            i = 0;
        }
        const vsMint = config.pairs[i++ % config.pairs.length];
        if (vsMint) {
            for (const mint of tradeConfig.mints) {
                if (vsMint === mint) {
                    continue; // can't trade mint A -> A directly via quote, so skip
                }
                await tradeToken(mint, vsMint, tradeConfig, quoteNormaliser).catch(async e => {
                    if (e instanceof RateLimiterLimited) {
                        await sleep(tradeConfig.loopIterationDelayMs);
                    }
                    if (e instanceof AggregateError) {
                        return await Promise.allSettled(e.errors.map(e => handleErrors(e, mint, vsMint)));
                    }
                    return await handleErrors(e, mint, vsMint);
                });
            }
            await sleep(tradeConfig.loopIterationDelayMs);
        }
    }
}


const main = async () => {
    await initialiseCache(config.cache);
    config.tradeConfigs.map(trade)
};


main()
