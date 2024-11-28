import { QuoteResponse } from "@jup-ag/api";
import lodash from "lodash";
import BigNumber from "bignumber.js";

export class MirroredRoutesError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "MirroredRoutesError";
    }
}

const normaliseAmmKeys = async (
    quoteA: QuoteResponse,
    quoteB: QuoteResponse
) => {
    const [ammKeysA, ammKeysB] = [
        quoteA.routePlan.map(step => step.swapInfo.ammKey),
        quoteB.routePlan.map(step => step.swapInfo.ammKey),
    ];
    const commonAmmkeys = lodash.intersectionWith<string>(ammKeysA, ammKeysB, lodash.isEqual);
    if (
        commonAmmkeys.length === ammKeysA.length
        && commonAmmkeys.length === ammKeysB.length
    ) {
        return Promise.reject(new MirroredRoutesError("Unable to normalize identical swaps"));
    }
    for (let i = 0; i < commonAmmkeys.length; i++) {
        const [indexOfAmmDuplicateA, indexOfAmmDuplicateB] = [
            lodash.findIndex(quoteA.routePlan, step => step.swapInfo.ammKey === commonAmmkeys[i]),
            lodash.findIndex(quoteB.routePlan, step => step.swapInfo.ammKey === commonAmmkeys[i])
        ];
        // Greater than A index 0 (not the first), and less than B index length - 1 (not the last)
        if (
            indexOfAmmDuplicateA > 0
            && indexOfAmmDuplicateB !== -1
            && indexOfAmmDuplicateB < quoteB.routePlan.length - 1
        ) {
            const duplicateSwapInfoA = quoteA.routePlan[indexOfAmmDuplicateA].swapInfo;
            const duplicateSwapInfoB = quoteB.routePlan[indexOfAmmDuplicateB].swapInfo;
            if (
                duplicateSwapInfoA.inputMint === duplicateSwapInfoB.outputMint
                && (
                    new BigNumber(duplicateSwapInfoA.inAmount).isGreaterThanOrEqualTo(duplicateSwapInfoB.outAmount)
                    || indexOfAmmDuplicateA === quoteA.routePlan.length - 1 // last index of A
                    && indexOfAmmDuplicateB === 0 // first index of B, handles the cases where the last and first ammkeys are the same of each quote
                )
            ) {
                const [
                    A_routePlan,
                    B_routePlan
                ] = [
                    quoteA.routePlan.slice(0, indexOfAmmDuplicateA),
                    quoteB.routePlan.slice(indexOfAmmDuplicateB + 1),
                ];
                if (
                    A_routePlan.length > 0
                    && B_routePlan.length > 0
                ) {
                    const [
                        A_routeStep_output,
                        B_routeStep_input
                    ] = [
                        A_routePlan.slice(-1)[0],
                        B_routePlan[0],
                    ];
                    if (
                        A_routeStep_output.swapInfo.outputMint === B_routeStep_input.swapInfo.inputMint
                        && new BigNumber(A_routeStep_output.swapInfo.outAmount).isGreaterThanOrEqualTo(B_routeStep_input.swapInfo.inAmount)
                    ) {
                        return Promise.resolve({
                            quoteA: {
                                ...quoteA,
                                routePlan: A_routePlan,
                                outputMint: A_routeStep_output.swapInfo.outputMint,
                                outAmount: A_routeStep_output.swapInfo.outAmount,
                                otherAmountThreshold: A_routeStep_output.swapInfo.outAmount,
                            },
                            quoteB: {
                                ...quoteB,
                                routePlan: B_routePlan,
                                inputMint: B_routeStep_input.swapInfo.inputMint,
                                inAmount: B_routeStep_input.swapInfo.inAmount,
                            }
                        });
                    }
                }
            }
        }
    }
    return Promise.resolve({ quoteA, quoteB });
}

type NormaliseQuoteResponseParams = {
    quoteA: QuoteResponse,
    quoteB: QuoteResponse,
    tradableMints: string[]
}

/**
 * may want to revisit at some point the conditions here,
 * but the main one to catch is where the last and first ammkeys of each swapInfo respectively are the same
 * so we want to remove that pointless hop.
 * @param quoteA 
 * @param quoteB 
 * @returns 
 */
export const NormaliseQuoteResponse = async (
    {
        quoteA,
        quoteB,
        tradableMints
    }: NormaliseQuoteResponseParams
): Promise<{ quoteA: QuoteResponse, quoteB: QuoteResponse }> => {
    if (quoteA.routePlan.length === 1 || quoteB.routePlan.length === 1) {
        // both swaps are direct, just return
        return Promise.resolve({ quoteA, quoteB });
    }
    const { quoteA: __quoteA, quoteB: __quoteB } = await normaliseAmmKeys(quoteA, quoteB);
    if (__quoteA.routePlan.length === 1 || __quoteB.routePlan.length === 1) {
        // both swaps are direct, just return
        return Promise.resolve({ quoteA: __quoteA, quoteB: __quoteB });
    }
    const [quoteAMixedPercentages, quoteBMixedPercentages] = [
        __quoteA.routePlan.filter(step => step.percent != 100),
        __quoteB.routePlan.filter(step => step.percent != 100),
    ]
    if (quoteAMixedPercentages.length > 0 || quoteBMixedPercentages.length > 0) {
        return Promise.resolve({ quoteA: __quoteA, quoteB: __quoteB });
    }
    const [inputMintsA, inputMintsB] = [
        __quoteA.routePlan.map(step => step.swapInfo.inputMint),
        __quoteB.routePlan.map(step => step.swapInfo.inputMint)
    ];
    const commonMints = lodash.intersectionWith<string>(inputMintsA, inputMintsB, lodash.isEqual);
    for (let i = 0; i < commonMints.length; i++) {
        const [
            quoteA_routeIndex_commonMintByOutputMint,
            quoteB_routeIndex_commonMintByInputMint
        ] = [
            lodash.findIndex(__quoteA.routePlan, step => step.swapInfo.outputMint === commonMints[i]),
            lodash.findIndex(__quoteB.routePlan, step => step.swapInfo.inputMint === commonMints[i])
        ];
        if (
            quoteA_routeIndex_commonMintByOutputMint > -1
            && quoteB_routeIndex_commonMintByInputMint > -1
        ) {
            const duplicateSwapInfoA = __quoteA.routePlan[quoteA_routeIndex_commonMintByOutputMint].swapInfo;
            const duplicateSwapInfoB = __quoteB.routePlan[quoteB_routeIndex_commonMintByInputMint].swapInfo;
            const A_output_gt_B_input = new BigNumber(duplicateSwapInfoA.outAmount).isGreaterThanOrEqualTo(duplicateSwapInfoB.inAmount); // e.g. sol
            //const A_input_gt_B_output = new BigNumber(duplicateSwapInfoA.inAmount).isGreaterThanOrEqualTo(duplicateSwapInfoB.outAmount); // e.g. hsol
            if (
                quoteA_routeIndex_commonMintByOutputMint < __quoteA.routePlan.length - 1
                && quoteB_routeIndex_commonMintByInputMint > 0
                && tradableMints.length > 0
                && duplicateSwapInfoA.outputMint === duplicateSwapInfoB.inputMint
                && tradableMints.includes(duplicateSwapInfoA.outputMint)
                && !A_output_gt_B_input // i.e. we're paying less if we remove the hops before and after these common mints
            ) {
                const [
                    A_routePlan,
                    B_routePlan
                ] = [
                    __quoteA.routePlan.slice(quoteA_routeIndex_commonMintByOutputMint + 1),
                    __quoteB.routePlan.slice(0, quoteB_routeIndex_commonMintByInputMint)
                ];
                if (
                    A_routePlan.length > 0
                    && B_routePlan.length > 0
                ) {
                    const [
                        A_routeStep_input,
                        B_routeStep_output
                    ] = [
                        A_routePlan[0],
                        B_routePlan.slice(-1)[0]
                    ];
                    if (
                        A_routeStep_input.swapInfo.inputMint === B_routeStep_output.swapInfo.outputMint
                        && new BigNumber(A_routeStep_input.swapInfo.inAmount).isLessThanOrEqualTo(new BigNumber(B_routeStep_output.swapInfo.outAmount))
                    ) {
                        return Promise.resolve({
                            quoteA: {
                                ...__quoteA,
                                routePlan: A_routePlan,
                                inputMint: A_routeStep_input.swapInfo.inputMint,
                                inAmount: A_routeStep_input.swapInfo.inAmount,
                            },
                            quoteB: {
                                ...__quoteB,
                                routePlan: B_routePlan,
                                outputMint: B_routeStep_output.swapInfo.outputMint,
                                outAmount: B_routeStep_output.swapInfo.outAmount,
                                otherAmountThreshold: B_routeStep_output.swapInfo.outAmount,
                            }
                        });
                    }
                }
            }
            if (A_output_gt_B_input) {
                const [
                    A_routePlan,
                    B_routePlan
                ] = [
                    __quoteA.routePlan.slice(0, quoteA_routeIndex_commonMintByOutputMint + 1),
                    __quoteB.routePlan.slice(quoteB_routeIndex_commonMintByInputMint)
                ];
                if (
                    A_routePlan.length > 0
                    && B_routePlan.length > 0
                ) {
                    const [
                        A_routeStep_output,
                        B_routeStep_input
                    ] = [
                        A_routePlan.slice(-1)[0],
                        B_routePlan[0]
                    ];
                    if (
                        A_routeStep_output.swapInfo.outputMint === B_routeStep_input.swapInfo.inputMint
                        && new BigNumber(A_routeStep_output.swapInfo.outAmount).isGreaterThanOrEqualTo(B_routeStep_input.swapInfo.inAmount)
                    ) {
                        return Promise.resolve({
                            quoteA: {
                                ...__quoteA,
                                routePlan: A_routePlan,
                                outputMint: A_routeStep_output.swapInfo.outputMint,
                                outAmount: A_routeStep_output.swapInfo.outAmount,
                                otherAmountThreshold: A_routeStep_output.swapInfo.outAmount,
                            },
                            quoteB: {
                                ...__quoteB,
                                routePlan: B_routePlan,
                                inputMint: B_routeStep_input.swapInfo.inputMint,
                                inAmount: B_routeStep_input.swapInfo.inAmount,
                            }
                        });
                    }
                }
            }
            // do some kind of check here to see if its possible to trade into a sol mint like jito sol, where the input sol is sol,
            // in essence a no brainer profit if 1 sol is worth more than 1 jito sol to just buy it at the discount and not as arbitrage
            // if (
            //     tradableMints.length > 0
            //     && tradableMints.includes(__quoteA.inputMint)
            //     && duplicateSwapInfoA.outputMint === WellKnownTokenMints.Solana
            //     && duplicateSwapInfoB.inputMint === WellKnownTokenMints.Solana
            //     && __quoteA.inputMint !== WellKnownTokenMints.Solana
            //     && __quoteB.outputMint !== WellKnownTokenMints.Solana
            // )
        }
    }
    return Promise.resolve({ quoteA: __quoteA, quoteB: __quoteB });
};

export class QuoteNormaliser {
    private tradableMints: string[] = [];
    constructor(
        tradableMints: string[]
    ) {
        this.tradableMints = tradableMints;
    }

    public async normalise({
        quoteA,
        quoteB
    }: {
        quoteA: QuoteResponse,
        quoteB: QuoteResponse
    }): Promise<{ quoteA: QuoteResponse, quoteB: QuoteResponse }> {
        return NormaliseQuoteResponse({
            quoteA,
            quoteB,
            tradableMints: this.tradableMints
        });
    }
}
