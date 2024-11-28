import { NormaliseQuoteResponse } from "../src/lib/NormaliseQuoteResponse";
import {
    test_01_quoteA, test_01_quoteB,
    test_02_quoteA, test_02_quoteB,
    test_03_quoteA, test_03_quoteB,
    test_04_quoteA, test_04_quoteB,
    quoteI, quoteJ,
    quoteK, quoteL,
    quoteM, quoteN,
    // quoteO, quoteP
} from "./NormaliseQuoteResponse.testdata"
import { WellKnownTokenMints } from "../src/const";
import { QuoteResponse } from "@jup-ag/api";

const tradableMints = [WellKnownTokenMints.Solana]


describe('normaliseQuoteInfo', () => {
    it('should remove the first route hop that duplicate mints and lose money', async () => {
        const { quoteA: quoteAnormalised, quoteB: quoteBnormalised } = await NormaliseQuoteResponse(test_01_quoteA, test_01_quoteB, tradableMints);
        expect(quoteAnormalised).toMatchObject({
            inputMint: WellKnownTokenMints.Solana,
            inAmount: "187632425", //"100000000",
            outputMint: WellKnownTokenMints.sUSDC8,
            outAmount: "2487795000",
            otherAmountThreshold: "2487795000",
            routePlan: [
                // {
                //     swapInfo: {
                //         ammKey: "HZsTF6VHdQy2W6cfEEqqpoTFKocx7Ch5c4TnWucXkAYv",
                //         label: "Whirlpool",
                //         inputMint: WellKnownTokenMints.JitoSOL,
                //         outputMint: WellKnownTokenMints.Solana,
                //         inAmount: "180632425",
                //         outAmount: "187632425",
                //         feeAmount: "17635",
                //         feeMint: WellKnownTokenMints.JitoSOL
                //     },
                //     percent: 100
                // },
                {
                    swapInfo: {
                        ammKey: "DEXYosS6oEGvk8uCDayvwEZz4qEyDJRf9nFgYCaqPMTm",
                        label: "Perps",
                        inputMint: WellKnownTokenMints.Solana,
                        outputMint: WellKnownTokenMints.USDC,
                        inAmount: "187632425",
                        outAmount: "24877950",
                        feeAmount: "2733",
                        feeMint: WellKnownTokenMints.Solana
                    },
                    percent: 100
                },
                {
                    swapInfo: {
                        ammKey: "DecZY86MU5Gj7kppfUCEmd4LbXXuyZH1yHaP2NTqdiZB",
                        label: "Saber Decimal Wrapper",
                        inputMint: WellKnownTokenMints.USDC,
                        outputMint: WellKnownTokenMints.sUSDC8,
                        inAmount: "24877950",
                        outAmount: "2487795000",
                        feeAmount: "0",
                        feeMint: WellKnownTokenMints.USDC
                    },
                    percent: 100
                }
            ],
        } as QuoteResponse);
        expect(quoteBnormalised).toMatchObject({
            inputMint: WellKnownTokenMints.sUSDC8,
            inAmount: "2487795000",
            outputMint: WellKnownTokenMints.Solana,
            outAmount: "187642425",
            otherAmountThreshold: "187642425",
            routePlan: [
                {
                    swapInfo: {
                        ammKey: "DecZY86MU5Gj7kppfUCEmd4LbXXuyZH1yHdfaP2NTqdiZB",
                        label: "Saber Decimal Wrapper",
                        inputMint: WellKnownTokenMints.sUSDC8,
                        outputMint: WellKnownTokenMints.USDC,
                        inAmount: "2487795000",
                        outAmount: "24877950",
                        feeAmount: "0",
                        feeMint: WellKnownTokenMints.sUSDC8
                    },
                    percent: 100
                },
                {
                    swapInfo: {
                        ammKey: "2wT8Yq49kHgDzXuPxZSaeLaH1qbmGXtEyPy64bL7aD3c",
                        label: "Lifinity V2",
                        inputMint: WellKnownTokenMints.USDC,
                        outputMint: WellKnownTokenMints.Solana,
                        inAmount: "24877950",
                        outAmount: "187642425",
                        feeAmount: "2734",
                        feeMint: WellKnownTokenMints.USDC
                    },
                    percent: 100
                },
                // {
                //     swapInfo: {
                //         ammKey: "HvtYZ3e8JPhy7rm6kvWVB2jJUddyytkLcwTMSSnB7T3U",
                //         label: "Lifinity V2",
                //         inputMint: WellKnownTokenMints.Solana,
                //         outputMint: WellKnownTokenMints.JitoSOL,
                //         inAmount: "187642425",
                //         outAmount: "180662425",
                //         feeAmount: "7",
                //         feeMint: WellKnownTokenMints.Solana
                //     },
                //     percent: 100
                // }
            ],
        } as QuoteResponse);
        expect(quoteAnormalised.routePlan.length).toBe(2);
        expect(quoteBnormalised.routePlan.length).toBe(2);
    });

    it('should leave alone route hops that duplicate mints and result in more money', async () => {
        const { quoteA: quoteAnormalised, quoteB: quoteBnormalised } = await NormaliseQuoteResponse(test_02_quoteA, test_02_quoteB, tradableMints);
        expect({ quoteA: quoteAnormalised, quoteB: quoteBnormalised }).toStrictEqual({ quoteA: test_02_quoteA, quoteB: test_02_quoteB });
    });

    it('should remove the 2nd route hop that duplicate mints and lose money', async () => {
        const { quoteA: quoteAnormalised, quoteB: quoteBnormalised } = await NormaliseQuoteResponse(test_03_quoteA, test_03_quoteB, tradableMints)
        expect(quoteAnormalised).toStrictEqual({
            inputMint: WellKnownTokenMints.Solana,
            inAmount: "100000000",
            outputMint: WellKnownTokenMints.mSOL,
            outAmount: "82451309",
            otherAmountThreshold: "82451309",
            routePlan: [
                {
                    swapInfo: {
                        ammKey: '8M5rjeDQKW4w4rmWFQLTqCYVuA1rMe9Z2QQ2SZResD9M',
                        label: 'Meteora DLMM',
                        inputMint: WellKnownTokenMints.Solana,
                        outputMint: WellKnownTokenMints.USDC,
                        inAmount: '100000000',
                        outAmount: '13673164',
                        feeAmount: '13081',
                        feeMint: WellKnownTokenMints.Solana
                    },
                    percent: 100
                },
                {
                    swapInfo: {
                        ammKey: 'HvtYZ3e8JPhy7rm6kvWVB2jJUddyytkLcwTMSSnB7T3U',
                        label: 'Lifinity V2',
                        inputMint: WellKnownTokenMints.USDC,
                        outputMint: WellKnownTokenMints.mSOL,
                        inAmount: '13673164',
                        outAmount: '82451309',
                        feeAmount: '2734',
                        feeMint: WellKnownTokenMints.USDC
                    },
                    percent: 100
                }
            ],
            slippageBps: 0,
            swapMode: "ExactIn",
            timeTaken: 0,
            priceImpactPct: "0",
            contextSlot: 0,
        } as QuoteResponse);
        expect(quoteBnormalised).toMatchObject({
            inputMint: WellKnownTokenMints.mSOL,
            inAmount: "82451308",
            outputMint: WellKnownTokenMints.Solana,
            outAmount: "100034460",
            otherAmountThreshold: "100034460",
            routePlan: [
                {
                    swapInfo: {
                        ammKey: '3kg9FUEWgMMvMA5tg6sA7wJ4NsNQnDruhbqPstDWUe21',
                        label: 'OpenBook V2',
                        inputMint: WellKnownTokenMints.mSOL,
                        outputMint: WellKnownTokenMints.Solana,
                        inAmount: '82451308',
                        outAmount: '100034460',
                        feeAmount: '0',
                        feeMint: WellKnownTokenMints.mSOL
                    },
                    percent: 100
                }
            ],
        } as QuoteResponse);
        expect(quoteAnormalised.routePlan.length).toBe(2);
        expect(quoteBnormalised.routePlan.length).toBe(1);
    });

    it('should remove the route hop that duplicate ammkeys and lose money', async() => {
        const { quoteA: quoteAnormalised, quoteB: quoteBnormalised } = await NormaliseQuoteResponse(test_04_quoteA, test_04_quoteB, tradableMints)
        expect(quoteAnormalised).toMatchObject({
            inputMint: WellKnownTokenMints.Solana,
            inAmount: "100000000",
            outputMint: WellKnownTokenMints.mSOL,
            outAmount: "82451309",
            otherAmountThreshold: "82451309",
            routePlan: [
                {
                    swapInfo: {
                        ammKey: "8M5rjeDQKW4w4rmWFQLTqCYVuA1rMe9Z2QQ2SZResD9M",
                        label: "Meteora DLMM",
                        inputMint: WellKnownTokenMints.Solana,
                        outputMint: WellKnownTokenMints.USDC,
                        inAmount: "100000000",
                        outAmount: "13673164",
                        feeAmount: "13081",
                        feeMint: WellKnownTokenMints.Solana
                    },
                    percent: 100
                },
                {
                    swapInfo: {
                        ammKey: "HvtYZ3e8JPhy7rm6kvWVB2jJUddyytkLcwTMSSnB7T3U",
                        label: "Lifinity V2",
                        inputMint: WellKnownTokenMints.USDC,
                        outputMint: WellKnownTokenMints.mSOL,
                        inAmount: "13673164",
                        outAmount: "82451309",
                        feeAmount: "2734",
                        feeMint: WellKnownTokenMints.USDC
                    },
                    percent: 100
                }
            ],
        } as QuoteResponse);
        expect(quoteBnormalised).toMatchObject({
            inputMint: WellKnownTokenMints.mSOL,
            inAmount: "82451308",
            outputMint: WellKnownTokenMints.Solana,
            outAmount: "100034460",
            otherAmountThreshold: "100034460",
            routePlan: [
                {
                    swapInfo: {
                        ammKey: "8GQP8XkaXVCArWYovfiLRuHpJzgoou2ofDDZdyd6TpNK",
                        label: "Lifinity V2",
                        inputMint: WellKnownTokenMints.mSOL,
                        outputMint: WellKnownTokenMints.JUP,
                        inAmount: "82451308",
                        outAmount: "13673164",
                        feeAmount: "2733",
                        feeMint: WellKnownTokenMints.mSOL
                    },
                    percent: 100
                },
                {
                    swapInfo: {
                        ammKey: "3kg9FUEWgMMvMA5tg6sA7wJ4NsNQnDruhbqPstDWUe21",
                        label: "OpenBook V2",
                        inputMint: WellKnownTokenMints.JUP,
                        outputMint: WellKnownTokenMints.Solana,
                        inAmount: "13673164",
                        outAmount: "100034460",
                        feeAmount: "0",
                        feeMint: WellKnownTokenMints.Solana
                    },
                    percent: 100
                }
            ],
        } as QuoteResponse);
        expect(quoteAnormalised.routePlan.length).toBe(2);
        expect(quoteBnormalised.routePlan.length).toBe(2);
    });

    it('should remove first SPL if SOL exists twice in profit', async() => {
        const { quoteA: quoteAnormalised, quoteB: quoteBnormalised } = await NormaliseQuoteResponse(quoteI, quoteJ, tradableMints);
        expect(quoteAnormalised).toMatchObject({
            inputMint: WellKnownTokenMints.Solana,
            inAmount: "100000000",
            outputMint: WellKnownTokenMints.WENWEN,
            outAmount: "88176721",
            otherAmountThreshold: "88176721",
            routePlan: [
                {
                    swapInfo: {
                        ammKey: "HvtYZ3e8JPhy7rm6kvWVB2jJUddyytkLcwTMSSnB7T3U",
                        label: "Lifinity V2",
                        inputMint: WellKnownTokenMints.Solana,
                        outputMint: WellKnownTokenMints.USA,
                        inAmount: "100000000",
                        outAmount: "7600000",
                        feeAmount: "2734",
                        feeMint: WellKnownTokenMints.Solana
                    },
                    percent: 100
                },
                {
                    swapInfo: {
                        ammKey: "HZsTF6VHdQy2W6cfEEqqpoTFKocx7Ch5c4TnWucXkAYv",
                        label: "Whirlpool",
                        inputMint: WellKnownTokenMints.USA,
                        outputMint: WellKnownTokenMints.WENWEN,
                        inAmount: "7600000",
                        outAmount: "88176721",
                        feeAmount: "7",
                        feeMint: WellKnownTokenMints.USA
                    },
                    percent: 100
                }
            ],
        } as QuoteResponse)
        expect(quoteBnormalised).toMatchObject({
            inputMint: WellKnownTokenMints.WENWEN,
            inAmount: "88176721",
            outputMint: WellKnownTokenMints.Solana,
            outAmount: "100001000",
            otherAmountThreshold: "100001000",
            routePlan: [
                {
                    swapInfo: {
                        ammKey: "HZsTF6VHdQy2W6cfEdEqqpoTFKocx7Ch5c4TnWucXkAYv",
                        label: "Whirlpool",
                        inputMint: WellKnownTokenMints.WENWEN,
                        outputMint: WellKnownTokenMints.Solana,
                        inAmount: "88176721",
                        outAmount: "100001000",
                        feeAmount: "17635",
                        feeMint: WellKnownTokenMints.WENWEN
                    },
                    percent: 100
                },
            ],
        } as QuoteResponse);
        expect(quoteAnormalised.routePlan.length).toBe(2);
        expect(quoteBnormalised.routePlan.length).toBe(1);
    });

    it('should remove first SPL if SOL exists twice in profit 2', async() => {
        const { quoteA: quoteAnormalised, quoteB: quoteBnormalised } = await NormaliseQuoteResponse(quoteK, quoteL, tradableMints);
        expect(quoteAnormalised).toMatchObject({
            inputMint: WellKnownTokenMints.Solana,
            inAmount: "66550226",
            outputMint: WellKnownTokenMints.USDC,
            outAmount: "872821",
            otherAmountThreshold: "872821",
            routePlan: [
                {
                    swapInfo: {
                        ammKey: "HvtYZ3e8JPhy7rm6kvWVB2jJUddyytkLcwTMSSnB7T3U",
                        label: "Lifinity V2",
                        inputMint: WellKnownTokenMints.Solana,
                        outputMint: WellKnownTokenMints.Bonk,
                        inAmount: "66550226",
                        outAmount: "51246283645",
                        feeAmount: "2734",
                        feeMint: WellKnownTokenMints.Solana
                    },
                    percent: 100
                },
                {
                    swapInfo: {
                        ammKey: "HZsTF6VHdQy2W6cfEEqqpoTFKocx7Ch5c4TnWucXkAYv",
                        label: "Whirlpool",
                        inputMint: WellKnownTokenMints.Bonk,
                        outputMint: WellKnownTokenMints.USDC,
                        inAmount: "51246283645",
                        outAmount: "872821",
                        feeAmount: "7",
                        feeMint: WellKnownTokenMints.Bonk
                    },
                    percent: 100
                }
            ],
        } as QuoteResponse)
        expect(quoteBnormalised).toMatchObject({
            inputMint: WellKnownTokenMints.USDC,
            inAmount: "872821",
            outputMint: WellKnownTokenMints.Solana,
            outAmount: "66582911",
            otherAmountThreshold: "66582911",
            routePlan: [
                {
                    swapInfo: {
                        ammKey: "HZsTF6VHdQy2W6cfEdEqqpoTFKocx7Ch5c4TnWucXkAYv",
                        label: "Whirlpool",
                        inputMint: WellKnownTokenMints.USDC,
                        outputMint: WellKnownTokenMints.Solana,
                        inAmount: "872821",
                        outAmount: "66582911",
                        feeAmount: "17635",
                        feeMint: WellKnownTokenMints.USDC
                    },
                    percent: 100
                },
            ],
        } as QuoteResponse)
        expect(quoteAnormalised.routePlan.length).toBe(2);
        expect(quoteBnormalised.routePlan.length).toBe(1);
    });

    it('should remove duplicated saber decimal wrapper and compress route to tradeable mint', async () => {
        const { quoteA: quoteAnormalised, quoteB: quoteBnormalised } = await NormaliseQuoteResponse(quoteM, quoteN, [...tradableMints, WellKnownTokenMints.JitoSOL, WellKnownTokenMints.USDC]);
        expect(quoteAnormalised).toMatchObject({
            inputMint: WellKnownTokenMints.Solana,
            inAmount: "187632425",
            outputMint: WellKnownTokenMints.USDC,
            outAmount: "24877950",
            otherAmountThreshold: "24877950",
            swapMode: "ExactIn",
            slippageBps: 0,
            priceImpactPct: "0.0001218336282019580467247679",
            routePlan: [
                // {
                //     swapInfo: {
                //         ammKey: "HZsTF6VHdQy2W6cfEEqqpoTFKocx7Ch5c4TnWucXkAYv",
                //         label: "Whirlpool",
                //         inputMint: WellKnownTokenMints.JitoSOL,
                //         outputMint: WellKnownTokenMints.Solana,
                //         inAmount: "180632425",
                //         outAmount: "187632425",
                //         feeAmount: "17635",
                //         feeMint: WellKnownTokenMints.JitoSOL
                //     },
                //     percent: 100
                // },
                {
                    swapInfo: {
                        ammKey: "DEXYosS6oEGvk8uCDayvwEZz4qEyDJRf9nFgYCaqPMTm",
                        label: "Perps",
                        inputMint: WellKnownTokenMints.Solana,
                        outputMint: WellKnownTokenMints.USDC,
                        inAmount: "187632425",
                        outAmount: "24877950",
                        feeAmount: "2733",
                        feeMint: WellKnownTokenMints.Solana
                    },
                    percent: 100
                },
                // {
                //     swapInfo: {
                //         ammKey: "DecZY86MU5Gj7kppfUCEmd4LbXXuyZH1yHaP2NTqdiZB",
                //         label: "Saber Decimal Wrapper",
                //         inputMint: WellKnownTokenMints.USDC,
                //         outputMint: WellKnownTokenMints.sUSDC8,
                //         inAmount: "24877950",
                //         outAmount: "2487795000",
                //         feeAmount: "0",
                //         feeMint: WellKnownTokenMints.USDC
                //     },
                //     percent: 100
                // }
            ],
        } as QuoteResponse)
        expect(quoteBnormalised).toMatchObject({
            inputMint: WellKnownTokenMints.USDC,
            inAmount: "24877950",
            outputMint: WellKnownTokenMints.Solana,
            outAmount: "187642425",
            otherAmountThreshold: "187642425",
            swapMode: "ExactIn",
            slippageBps: 0,
            priceImpactPct: "0",
            routePlan: [
                // {
                //     swapInfo: {
                //         ammKey: "DecZY86MU5Gj7kppfUCEmd4LbXXuyZH1yHaP2NTqdiZB",
                //         label: "Saber Decimal Wrapper",
                //         inputMint: WellKnownTokenMints.sUSDC8,
                //         outputMint: WellKnownTokenMints.USDC,
                //         inAmount: "2487795000",
                //         outAmount: "24877950",
                //         feeAmount: "0",
                //         feeMint: WellKnownTokenMints.sUSDC8
                //     },
                //     percent: 100
                // },
                {
                    swapInfo: {
                        ammKey: "2wT8Yq49kHgDzXuPxZSaeLaH1qbmGXtEyPy64bL7aD3c",
                        label: "Lifinity V2",
                        inputMint: WellKnownTokenMints.USDC,
                        outputMint: WellKnownTokenMints.Solana,
                        inAmount: "24877950",
                        outAmount: "187642425",
                        feeAmount: "2734",
                        feeMint: WellKnownTokenMints.USDC
                    },
                    percent: 100
                },
                // {
                //     swapInfo: {
                //         ammKey: "HvtYZ3e8JPhy7rm6kvWVB2jJUddyytkLcwTMSSnB7T3U",
                //         label: "Lifinity V2",
                //         inputMint: WellKnownTokenMints.Solana,
                //         outputMint: WellKnownTokenMints.JitoSOL,
                //         inAmount: "187642425",
                //         outAmount: "180662425",
                //         feeAmount: "7",
                //         feeMint: WellKnownTokenMints.Solana
                //     },
                //     percent: 100
                // }
            ],
        } as QuoteResponse);
        expect(quoteAnormalised.routePlan.length).toBe(1);
        expect(quoteBnormalised.routePlan.length).toBe(1);
    });

    it('should remove duplicated saber decimal wrapper and not compress to mints that are not set as tradable', async () => {
        const { quoteA: quoteAnormalised, quoteB: quoteBnormalised } = await NormaliseQuoteResponse(quoteM, quoteN, []);
        expect(quoteAnormalised).toMatchObject({
            inputMint: WellKnownTokenMints.JitoSOL,
            inAmount: "180632425",
            outputMint: WellKnownTokenMints.USDC,
            outAmount: "24877950",
            otherAmountThreshold: "24877950",
            swapMode: "ExactIn",
            slippageBps: 0,
            priceImpactPct: "0.0001218336282019580467247679",
            routePlan: [
                {
                    swapInfo: {
                        ammKey: "HZsTF6VHdQy2W6cfEEqqpoTFKocx7Ch5c4TnWucXkAYv",
                        label: "Whirlpool",
                        inputMint: WellKnownTokenMints.JitoSOL,
                        outputMint: WellKnownTokenMints.Solana,
                        inAmount: "180632425",
                        outAmount: "187632425",
                        feeAmount: "17635",
                        feeMint: WellKnownTokenMints.JitoSOL
                    },
                    percent: 100
                },
                {
                    swapInfo: {
                        ammKey: "DEXYosS6oEGvk8uCDayvwEZz4qEyDJRf9nFgYCaqPMTm",
                        label: "Perps",
                        inputMint: WellKnownTokenMints.Solana,
                        outputMint: WellKnownTokenMints.USDC,
                        inAmount: "187632425",
                        outAmount: "24877950",
                        feeAmount: "2733",
                        feeMint: WellKnownTokenMints.Solana
                    },
                    percent: 100
                },
            ],
        } as QuoteResponse)
        expect(quoteBnormalised).toMatchObject({
            inputMint: WellKnownTokenMints.USDC,
            inAmount: "24877950",
            outputMint: WellKnownTokenMints.JitoSOL,
            outAmount: "180662425",
            otherAmountThreshold: "180662425",
            swapMode: "ExactIn",
            slippageBps: 0,
            priceImpactPct: "0",
            routePlan: [
                {
                    swapInfo: {
                        ammKey: "2wT8Yq49kHgDzXuPxZSaeLaH1qbmGXtEyPy64bL7aD3c",
                        label: "Lifinity V2",
                        inputMint: WellKnownTokenMints.USDC,
                        outputMint: WellKnownTokenMints.Solana,
                        inAmount: "24877950",
                        outAmount: "187642425",
                        feeAmount: "2734",
                        feeMint: WellKnownTokenMints.USDC
                    },
                    percent: 100
                },
                {
                    swapInfo: {
                        ammKey: "HvtYZ3e8JPhy7rm6kvWVB2jJUddyytkLcwTMSSnB7T3U",
                        label: "Lifinity V2",
                        inputMint: WellKnownTokenMints.Solana,
                        outputMint: WellKnownTokenMints.JitoSOL,
                        inAmount: "187642425",
                        outAmount: "180662425",
                        feeAmount: "7",
                        feeMint: WellKnownTokenMints.Solana
                    },
                    percent: 100
                }
            ],
        } as QuoteResponse);
        expect(quoteAnormalised.routePlan.length).toBe(2);
        expect(quoteBnormalised.routePlan.length).toBe(2);
    });

    // it('should remove duplicated saber decimal wrapper and compress multiple tradable mints', async() => {
    //     const { quoteA: quoteAnormalised, quoteB: quoteBnormalised } = await NormaliseQuoteResponse(quoteO, quoteP, [WellKnownTokenMints.INF, WellKnownTokenMints.Solana]);
    //     expect(quoteAnormalised).toMatchObject({
    //         inputMint: WellKnownTokenMints.INF,
    //         inAmount: "187632425",
    //         outputMint: WellKnownTokenMints.USDC,
    //         outAmount: "24877950",
    //         otherAmountThreshold: "24877950",
    //         swapMode: "ExactIn",
    //         slippageBps: 0,
    //         priceImpactPct: "0.0001218336282019580467247679",
    //         routePlan: [
    //             {
    //                 swapInfo: {
    //                     ammKey: "DEXYosS6oEGvk8uCDayvwEZz4qEyDJRf9nFgYCaqPMTm",
    //                     label: "Perps",
    //                     inputMint: WellKnownTokenMints.INF,
    //                     outputMint: WellKnownTokenMints.USDC,
    //                     inAmount: "187632425",
    //                     outAmount: "24877950",
    //                     feeAmount: "2733",
    //                     feeMint: WellKnownTokenMints.INF
    //                 },
    //                 percent: 100
    //             },
    //         ],
    //     } as QuoteResponse)
    //     expect(quoteBnormalised).toMatchObject({
    //         inputMint: WellKnownTokenMints.USDC,
    //         inAmount: "24877950",
    //         outputMint: WellKnownTokenMints.INF,
    //         outAmount: "187642425",
    //         otherAmountThreshold: "187642425",
    //         swapMode: "ExactIn",
    //         slippageBps: 0,
    //         priceImpactPct: "0",
    //         routePlan: [
    //             {
    //                 swapInfo: {
    //                     ammKey: "2wT8Yq49kHgDzXuPxZSaeLaH1qbmGXtEyPy64bL7aD3c",
    //                     label: "Lifinity V2",
    //                     inputMint: WellKnownTokenMints.USDC,
    //                     outputMint: WellKnownTokenMints.INF,
    //                     inAmount: "24877950",
    //                     outAmount: "187642425",
    //                     feeAmount: "2734",
    //                     feeMint: WellKnownTokenMints.USDC
    //                 },
    //                 percent: 100
    //             },
    //         ],
    //     } as QuoteResponse);
    //     expect(quoteAnormalised.routePlan.length).toBe(1);
    //     expect(quoteBnormalised.routePlan.length).toBe(1);
    // });
});
