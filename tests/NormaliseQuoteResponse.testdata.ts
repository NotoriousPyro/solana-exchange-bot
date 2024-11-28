import { WellKnownTokenMints } from "../src/const"
import { QuoteResponse } from "@jup-ag/api"

export const test_00_quoteA: QuoteResponse = {
    inputMint: WellKnownTokenMints.JitoSOL,
    inAmount: "180632425",
    outputMint: WellKnownTokenMints.sUSDC8,
    outAmount: "2487795000",
    otherAmountThreshold: "2487795000",
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
}

export const test_00_quoteB: QuoteResponse = {
    inputMint: WellKnownTokenMints.sUSDC8,
    inAmount: "2487795000",
    outputMint: WellKnownTokenMints.JitoSOL,
    outAmount: "180662425",
    otherAmountThreshold: "180662425",
    swapMode: "ExactIn",
    slippageBps: 0,
    priceImpactPct: "0",
    routePlan: [
        {
            swapInfo: {
                ammKey: "DecZY86MU5Gj7kppfUCEmd4LbXXuyZH1yHaP2NTqdiZB",
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
}

export const test_01_quoteA: QuoteResponse = {
    inputMint: WellKnownTokenMints.JitoSOL,
    inAmount: "180632425",
    outputMint: WellKnownTokenMints.sUSDC8,
    outAmount: "2487795000",
    otherAmountThreshold: "2487795000",
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
}

export const test_01_quoteB: QuoteResponse = {
    inputMint: WellKnownTokenMints.sUSDC8,
    inAmount: "2487795000",
    outputMint: WellKnownTokenMints.JitoSOL,
    outAmount: "180662425",
    otherAmountThreshold: "180662425",
    swapMode: "ExactIn",
    slippageBps: 0,
    priceImpactPct: "0",
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
}

// export const quoteA: QuoteResponse = {
//     inputMint: WellKnownTokenMints.Solana,
//     inAmount: "100000000",
//     outputMint: WellKnownTokenMints.JitoSOL,
//     outAmount: "88176721",
//     otherAmountThreshold: "88176721",
//     swapMode: "ExactIn",
//     slippageBps: 0,
//     priceImpactPct: "0",
//     routePlan: [
//         {
//             swapInfo: {
//                 ammKey: "8M5rjeDQKW4w4rmWFQLTqCYVuA1rMe9Z2QQ2SZResD9M",
//                 label: "Meteora DLMM",
//                 inputMint: WellKnownTokenMints.Solana,
//                 outputMint: WellKnownTokenMints.USDC,
//                 inAmount: "100000000",
//                 outAmount: "13673164",
//                 feeAmount: "13081",
//                 feeMint: WellKnownTokenMints.Solana
//             },
//             percent: 100
//         },
//         {
//             swapInfo: {
//                 ammKey: "HvtYZ3e8JPhy7rm6kvWVB2jJUddyytkLcwTMSSnB7T3U",
//                 label: "Lifinity V2",
//                 inputMint: WellKnownTokenMints.USDC,
//                 outputMint: WellKnownTokenMints.mSOL,
//                 inAmount: "13673164",
//                 outAmount: "82451309",
//                 feeAmount: "2734",
//                 feeMint: WellKnownTokenMints.USDC
//             },
//             percent: 100
//         },
//         {
//             swapInfo: {
//                 ammKey: "HZsTF6VHdQy2W6cfEEqqpoTFKocx7Ch5c4TnWucXkAYv",
//                 label: "Whirlpool",
//                 inputMint: WellKnownTokenMints.mSOL,
//                 outputMint: WellKnownTokenMints.JitoSOL,
//                 inAmount: "82451309",
//                 outAmount: "88176721",
//                 feeAmount: "7",
//                 feeMint: WellKnownTokenMints.mSOL
//             },
//             percent: 100
//         }
//     ],
//     contextSlot: 0,
//     timeTaken: 0
// }

// export const quoteB: QuoteResponse = {
//     inputMint: WellKnownTokenMints.JitoSOL,
//     inAmount: "88176721",
//     outputMint: WellKnownTokenMints.Solana,
//     outAmount: "100034460",
//     otherAmountThreshold: "100034460",
//     swapMode: "ExactIn",
//     slippageBps: 0,
//     priceImpactPct: "0.0001218336282019580467247679",
//     routePlan: [
//         {
//             swapInfo: {
//                 ammKey: "Az6u7Aw3Es5SwpaVsELTbfavgJ6itMr9PyruaTuaqH7w",
//                 label: "Lifinity V2",
//                 inputMint: WellKnownTokenMints.JitoSOL,
//                 outputMint: WellKnownTokenMints.USDC,
//                 inAmount: "88176721",
//                 outAmount: "13666039",
//                 feeAmount: "17635",
//                 feeMint: WellKnownTokenMints.JitoSOL
//             },
//             percent: 100
//         },
//         {
//             swapInfo: {
//                 ammKey: "8GQP8XkaXVCArWYovfiLRuHpJzgoou2ofDDZdyd6TpNK",
//                 label: "Lifinity V2",
//                 inputMint: WellKnownTokenMints.USDC,
//                 outputMint: WellKnownTokenMints.Bonk,
//                 inAmount: "13666039",
//                 outAmount: "78035010166",
//                 feeAmount: "2733",
//                 feeMint: WellKnownTokenMints.USDC
//             },
//             percent: 100
//         },
//         {
//             swapInfo: {
//                 ammKey: "3kg9FUEWgMMvMA5tg6sA7wJ4NsNQnDruhbqPstDWUe21",
//                 label: "OpenBook V2",
//                 inputMint: WellKnownTokenMints.Bonk,
//                 outputMint: WellKnownTokenMints.Solana,
//                 inAmount: "78035010166",
//                 outAmount: "100034460",
//                 feeAmount: "0",
//                 feeMint: WellKnownTokenMints.Bonk
//             },
//             percent: 100
//         }
//     ],
//     contextSlot: 0,
//     timeTaken: 0
// }

export const test_02_quoteA: QuoteResponse = {
    inputMint: WellKnownTokenMints.Solana,
    inAmount: "100000000",
    outputMint: WellKnownTokenMints.JitoSOL,
    outAmount: "88176721",
    otherAmountThreshold: "88176721",
    swapMode: "ExactIn",
    slippageBps: 0,
    priceImpactPct: "0",
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
        },
        {
            swapInfo: {
                ammKey: "HZsTF6VHdQy2W6cfEEqqpoTFKocx7Ch5c4TnWucXkAYv",
                label: "Whirlpool",
                inputMint: WellKnownTokenMints.mSOL,
                outputMint: WellKnownTokenMints.JitoSOL,
                inAmount: "82451309",
                outAmount: "88176721",
                feeAmount: "7",
                feeMint: WellKnownTokenMints.mSOL
            },
            percent: 100
        }
    ],
    contextSlot: 0,
    timeTaken: 0
}

export const test_02_quoteB: QuoteResponse = {
    inputMint: WellKnownTokenMints.JitoSOL,
    inAmount: "88176721",
    outputMint: WellKnownTokenMints.Solana,
    outAmount: "100034460",
    otherAmountThreshold: "100034460",
    swapMode: "ExactIn",
    slippageBps: 0,
    priceImpactPct: "0.0001218336282019580467247679",
    routePlan: [
        {
            swapInfo: {
                ammKey: "Az6u7Aw3Es5SwpaVsELTbfavgJ6itMr9PyruaTuaqH7w",
                label: "Lifinity V2",
                inputMint: WellKnownTokenMints.JitoSOL,
                outputMint: WellKnownTokenMints.USDC,
                inAmount: "88176721",
                outAmount: "13673165",
                feeAmount: "17635",
                feeMint: WellKnownTokenMints.JitoSOL
            },
            percent: 100
        },
        {
            swapInfo: {
                ammKey: "8GQP8XkaXVCArWYovfiLRuHpJzgoou2ofDDZdyd6TpNK",
                label: "Lifinity V2",
                inputMint: WellKnownTokenMints.USDC,
                outputMint: WellKnownTokenMints.Bonk,
                inAmount: "13673165",
                outAmount: "78035010166",
                feeAmount: "2733",
                feeMint: WellKnownTokenMints.USDC
            },
            percent: 100
        },
        {
            swapInfo: {
                ammKey: "3kg9FUEWgMMvMA5tg6sA7wJ4NsNQnDruhbqPstDWUe21",
                label: "OpenBook V2",
                inputMint: WellKnownTokenMints.Bonk,
                outputMint: WellKnownTokenMints.Solana,
                inAmount: "78035010166",
                outAmount: "100034460",
                feeAmount: "0",
                feeMint: WellKnownTokenMints.Solana
            },
            percent: 100
        }
    ],
    contextSlot: 0,
    timeTaken: 0
}

export const test_03_quoteA: QuoteResponse = {
    inputMint: WellKnownTokenMints.Solana,
    inAmount: "100000000",
    outputMint: WellKnownTokenMints.JitoSOL,
    outAmount: "88176721",
    otherAmountThreshold: "88176721",
    swapMode: "ExactIn",
    slippageBps: 0,
    priceImpactPct: "0",
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
        },
        {
            swapInfo: {
                ammKey: "HZsTF6VHdQy2W6cfEEqqpoTFKocx7Ch5c4TnWucXkAYv",
                label: "Whirlpool",
                inputMint: WellKnownTokenMints.mSOL,
                outputMint: WellKnownTokenMints.JitoSOL,
                inAmount: "82451309",
                outAmount: "88176721",
                feeAmount: "7",
                feeMint: WellKnownTokenMints.mSOL
            },
            percent: 100
        }
    ],
    contextSlot: 0,
    timeTaken: 0
}

export const test_03_quoteB: QuoteResponse = {
    inputMint: WellKnownTokenMints.JitoSOL,
    inAmount: "88176721",
    outputMint: WellKnownTokenMints.Solana,
    outAmount: "100034460",
    otherAmountThreshold: "100034460",
    swapMode: "ExactIn",
    slippageBps: 0,
    priceImpactPct: "0.0001218336282019580467247679",
    routePlan: [
        {
            swapInfo: {
                ammKey: "Az6u7Aw3Es5SwpaVsELTbfavgJ6itMr9PyruaTuaqH7w",
                label: "Lifinity V2",
                inputMint: WellKnownTokenMints.JitoSOL,
                outputMint: WellKnownTokenMints.USDC,
                inAmount: "88176721",
                outAmount: "13673165",
                feeAmount: "17635",
                feeMint: WellKnownTokenMints.JitoSOL
            },
            percent: 100
        },
        {
            swapInfo: {
                ammKey: "8GQP8XkaXVCArWYovfiLRuHpJzgoou2ofDDZdyd6TpNK",
                label: "Lifinity V2",
                inputMint: WellKnownTokenMints.USDC,
                outputMint: WellKnownTokenMints.mSOL,
                inAmount: "13673165",
                outAmount: "82451308",
                feeAmount: "2733",
                feeMint: WellKnownTokenMints.USDC
            },
            percent: 100
        },
        {
            swapInfo: {
                ammKey: "3kg9FUEWgMMvMA5tg6sA7wJ4NsNQnDruhbqPstDWUe21",
                label: "OpenBook V2",
                inputMint: WellKnownTokenMints.mSOL,
                outputMint: WellKnownTokenMints.Solana,
                inAmount: "82451308",
                outAmount: "100034460",
                feeAmount: "0",
                feeMint: WellKnownTokenMints.mSOL
            },
            percent: 100
        }
    ],
    contextSlot: 0,
    timeTaken: 0
}

export const test_04_quoteA: QuoteResponse = {
    inputMint: WellKnownTokenMints.Solana,
    inAmount: "100000000",
    outputMint: WellKnownTokenMints.JitoSOL,
    outAmount: "88176721",
    otherAmountThreshold: "88176721",
    swapMode: "ExactIn",
    slippageBps: 0,
    priceImpactPct: "0",
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
        },
        {
            swapInfo: {
                ammKey: "HZsTF6VHdQy2W6cfEEqqpoTFKocx7Ch5c4TnWucXkAYv",
                label: "Whirlpool",
                inputMint: WellKnownTokenMints.mSOL,
                outputMint: WellKnownTokenMints.JitoSOL,
                inAmount: "82451309",
                outAmount: "88176721",
                feeAmount: "7",
                feeMint: WellKnownTokenMints.mSOL
            },
            percent: 100
        }
    ],
    contextSlot: 0,
    timeTaken: 0
}

export const test_04_quoteB: QuoteResponse = {
    inputMint: WellKnownTokenMints.JitoSOL,
    inAmount: "88176721",
    outputMint: WellKnownTokenMints.Solana,
    outAmount: "100034460",
    otherAmountThreshold: "100034460",
    swapMode: "ExactIn",
    slippageBps: 0,
    priceImpactPct: "0.0001218336282019580467247679",
    routePlan: [
        {
            swapInfo: {
                ammKey: "HZsTF6VHdQy2W6cfEEqqpoTFKocx7Ch5c4TnWucXkAYv",
                label: "Whirlpool",
                inputMint: WellKnownTokenMints.JitoSOL,
                outputMint: WellKnownTokenMints.mSOL,
                inAmount: "88176721",
                outAmount: "82451308",
                feeAmount: "17635",
                feeMint: WellKnownTokenMints.JitoSOL
            },
            percent: 100
        },
        {
            swapInfo: {
                ammKey: "8GQP8XkaXVCArWYovfiLRuHpJzgoou2ofDDZdyd6TpNK",
                label: "Lifinity V2",
                inputMint: WellKnownTokenMints.mSOL,
                outputMint: "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",
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
                inputMint: "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",
                outputMint: WellKnownTokenMints.Solana,
                inAmount: "13673164",
                outAmount: "100034460",
                feeAmount: "0",
                feeMint: WellKnownTokenMints.Solana
            },
            percent: 100
        }
    ],
    contextSlot: 0,
    timeTaken: 0
}

export const quoteI: QuoteResponse = {
    inputMint: WellKnownTokenMints.USDT,
    inAmount: "13673164",
    outputMint: WellKnownTokenMints.WENWEN,
    outAmount: "88176721",
    otherAmountThreshold: "88176721",
    swapMode: "ExactIn",
    slippageBps: 0,
    priceImpactPct: "0",
    routePlan: [
        {
            swapInfo: {
                ammKey: "8M5rjeDQKW4w4rmWFQLTqCYVuA1rMe9Z2QQ2SZResD9M",
                label: "Meteora DLMM",
                inputMint: WellKnownTokenMints.USDT,
                outputMint: WellKnownTokenMints.Solana,
                inAmount: "13673164",
                outAmount: "100000000",
                feeAmount: "13081",
                feeMint: WellKnownTokenMints.USDT
            },
            percent: 100
        },
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
    contextSlot: 0,
    timeTaken: 0
}

export const quoteJ: QuoteResponse = {
    inputMint: WellKnownTokenMints.WENWEN,
    inAmount: "88176721",
    outputMint: WellKnownTokenMints.USDT,
    outAmount: "13675164",
    otherAmountThreshold: "13675164",
    swapMode: "ExactIn",
    slippageBps: 0,
    priceImpactPct: "0.0001218336282019580467247679",
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
        {
            swapInfo: {
                ammKey: "8GQP8XkaXVCArWYovfiLRuHpJzgoou2ofDDZdyd6TpNK",
                label: "Lifinity V2",
                inputMint: WellKnownTokenMints.Solana,
                outputMint: WellKnownTokenMints.USDT,
                inAmount: "100001000",
                outAmount: "13675164",
                feeAmount: "2733",
                feeMint: WellKnownTokenMints.Solana
            },
            percent: 100
        }
    ],
    contextSlot: 0,
    timeTaken: 0
}

export const quoteK: QuoteResponse = {
    inputMint: WellKnownTokenMints.USDT,
    inAmount: "8724627",
    outputMint: WellKnownTokenMints.USDC,
    outAmount: "872821",
    otherAmountThreshold: "872821",
    swapMode: "ExactIn",
    slippageBps: 0,
    priceImpactPct: "0",
    routePlan: [
        {
            swapInfo: {
                ammKey: "8M5rjeDQKW4w4rmWFQLTqCYVuA1rMe9Z2QQ2SZResD9M",
                label: "Meteora DLMM",
                inputMint: WellKnownTokenMints.USDT,
                outputMint: WellKnownTokenMints.Solana,
                inAmount: "13673164",
                outAmount: "66550226",
                feeAmount: "13081",
                feeMint: WellKnownTokenMints.USDT
            },
            percent: 100
        },
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
    contextSlot: 0,
    timeTaken: 0
}

export const quoteL: QuoteResponse = {
    inputMint: WellKnownTokenMints.USDC,
    inAmount: "872821",
    outputMint: WellKnownTokenMints.USDT,
    outAmount: "8726911",
    otherAmountThreshold: "8726911",
    swapMode: "ExactIn",
    slippageBps: 0,
    priceImpactPct: "0.0001218336282019580467247679",
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
        {
            swapInfo: {
                ammKey: "8GQP8XkaXVCArWYovfiLRuHpJzgoou2ofDDZdyd6TpNK",
                label: "Lifinity V2",
                inputMint: WellKnownTokenMints.Solana,
                outputMint: WellKnownTokenMints.USDT,
                inAmount: "66582911",
                outAmount: "8726911",
                feeAmount: "2733",
                feeMint: WellKnownTokenMints.Solana
            },
            percent: 100
        }
    ],
    contextSlot: 0,
    timeTaken: 0
}

export const quoteM: QuoteResponse = {
    inputMint: WellKnownTokenMints.JitoSOL,
    inAmount: "180632425",
    outputMint: WellKnownTokenMints.sUSDC8,
    outAmount: "2487795000",
    otherAmountThreshold: "2487795000",
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
    contextSlot: 0,
    timeTaken: 0
}

export const quoteN: QuoteResponse = {
    inputMint: WellKnownTokenMints.sUSDC8,
    inAmount: "2487795000",
    outputMint: WellKnownTokenMints.JitoSOL,
    outAmount: "180662425",
    otherAmountThreshold: "180662425",
    swapMode: "ExactIn",
    slippageBps: 0,
    priceImpactPct: "0",
    routePlan: [
        {
            swapInfo: {
                ammKey: "DecZY86MU5Gj7kppfUCEmd4LbXXuyZH1yHaP2NTqdiZB",
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
    contextSlot: 0,
    timeTaken: 0
}

export const quoteO: QuoteResponse = {
    inputMint: WellKnownTokenMints.JitoSOL,
    inAmount: "180632425",
    outputMint: WellKnownTokenMints.sUSDC8,
    outAmount: "2487795000",
    otherAmountThreshold: "2487795000",
    swapMode: "ExactIn",
    slippageBps: 0,
    priceImpactPct: "0.0001218336282019580467247679",
    routePlan: [
        {
            swapInfo: {
                ammKey: "HZsTF6VHdQy2W6cfEEqqpoTFKocx7Ch5c4TnWucXkAYv",
                label: "Whirlpool",
                inputMint: WellKnownTokenMints.JitoSOL,
                outputMint: WellKnownTokenMints.INF,
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
                inputMint: WellKnownTokenMints.INF,
                outputMint: WellKnownTokenMints.USDC,
                inAmount: "187632425",
                outAmount: "24877950",
                feeAmount: "2733",
                feeMint: WellKnownTokenMints.INF
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
    contextSlot: 0,
    timeTaken: 0
}

export const quoteP: QuoteResponse = {
    inputMint: WellKnownTokenMints.sUSDC8,
    inAmount: "2487795000",
    outputMint: WellKnownTokenMints.JitoSOL,
    outAmount: "180602425",
    otherAmountThreshold: "180602425",
    swapMode: "ExactIn",
    slippageBps: 0,
    priceImpactPct: "0",
    routePlan: [
        {
            swapInfo: {
                ammKey: "DecZY86MU5Gj7kppfUCEmd4LbXXuyZH1yHaP2NTqdiZB",
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
                outputMint: WellKnownTokenMints.INF,
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
                inputMint: WellKnownTokenMints.INF,
                outputMint: WellKnownTokenMints.JitoSOL,
                inAmount: "187642425",
                outAmount: "180602425",
                feeAmount: "7",
                feeMint: WellKnownTokenMints.INF
            },
            percent: 100
        }
    ],
    contextSlot: 0,
    timeTaken: 0
}