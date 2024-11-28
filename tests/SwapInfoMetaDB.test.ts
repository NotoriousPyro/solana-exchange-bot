import SwapInfoMetaDB from "../src/db/SwapInfoMetaDB"


describe("SwapInfoMeta", () => {
    it("saves and retrieves swapinfometa", async () => {
        const swapInfoMetaKey = SwapInfoMetaDB.keyByQuotes([{
            inputMint: "a",
            outputMint: "b",
            routePlan: [
                {
                    swapInfo: {
                        ammKey: "c"
                    }
                }
            ]
        } as never,
        {
            inputMint: "d",
            outputMint: "e",
            routePlan: [
                {
                    swapInfo: {
                        ammKey: "f"
                    }
                },
                {
                    swapInfo: {
                        ammKey: "g"
                    }
                }
            ]
        } as never]);
        expect(swapInfoMetaKey).toEqual([["a", "b", "c"], ["d", "e", "f", "g"]]);
        const swapInfoMeta = {
            skipPreflight: true,
            computeUnits: 5,
            memoryAllocationFailed: false,
            heapSize: 10,
            tooManyAccountLocks: false,
            transactionTooLarge: false,
            expiry: 100
        }
        await SwapInfoMetaDB.put(swapInfoMetaKey, swapInfoMeta);
        const retrievedSwapInfoMeta = SwapInfoMetaDB.get(swapInfoMetaKey);
        expect(retrievedSwapInfoMeta).toEqual(swapInfoMeta);
    })
})
