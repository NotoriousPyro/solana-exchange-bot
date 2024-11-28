import { ComputeBudgetProgram, TransactionExpiredBlockheightExceededError, TransactionMessage, VersionedTransaction } from "@solana/web3.js";
import { blockhashCache, connection, getAddressLookupTableAccounts } from "../src/connection";
import config from "../src/lib/Config";
import { WellKnownTokenMints } from "../src/const";
import BigNumber from "bignumber.js";
import { deserializeInstruction, getQuote, getSwapInstructionsUncached, officialFetcher, simulation } from "../src/swaphelper";
import { SwapInstructionsResponse } from "@jup-ag/api";
import { sleep, ToDecimal } from "../src/utils";
import { jitoConnection } from "./jitoconnection";
import { getAllTokenAccountsByOwnerUnpacked } from "../src/lib/web3-js-extensions/AssociatedTokenAccount";

const owningAccount = config.SIGNER_KEY;

const desiredOutputMint = WellKnownTokenMints.Solana
const desiredOutputMintDecimals = 9;
const slippageTolerance = 5;
const desiredOutputAmount: BigNumber = new BigNumber(0.000005001);

const excludedMints = [
    WellKnownTokenMints.Solana,
    WellKnownTokenMints.SEX,
    WellKnownTokenMints.mSOL,
    WellKnownTokenMints.bSOL,
    WellKnownTokenMints.JitoSOL,
    WellKnownTokenMints.hSOL,
    WellKnownTokenMints.stSOL,
    WellKnownTokenMints.INF,
    WellKnownTokenMints.vSOL,
    WellKnownTokenMints.jupSOL,
    WellKnownTokenMints.LST,
    WellKnownTokenMints.JSOL
]


const sellATA = async (swap: SwapInstructionsResponse) => {
    const swapInstruction = await deserializeInstruction(swap.swapInstruction);
    const addressLookupTableAccounts = await getAddressLookupTableAccounts([...swap.addressLookupTableAddresses, ...config.addressLookupTableAddresses]);
    const recentBlockhash = await blockhashCache.fetch("blockhash")
    const messageV0 = new TransactionMessage({
        payerKey: owningAccount.publicKey,
        recentBlockhash: recentBlockhash.blockhash,
        instructions: [
            ComputeBudgetProgram.setComputeUnitLimit({
                units: 1_400_000 // compute units
            }),
            swapInstruction,
        ],
    }).compileToV0Message(addressLookupTableAccounts);
    const tx = new VersionedTransaction(messageV0);
    await simulation(tx);
    try {
        const recentBlockhash = await blockhashCache.fetch("blockhash");
        tx.message.recentBlockhash = recentBlockhash.blockhash;
        tx.sign([owningAccount]);
        const signature = await jitoConnection.sendTransaction(tx, {
            maxRetries: 20,
            skipPreflight: true,
            preflightCommitment: "processed",
        });
        const confirmation = await connection.confirmTransaction({
            signature,
            blockhash: recentBlockhash.blockhash,
            lastValidBlockHeight: recentBlockhash.lastValidBlockHeight,
        }, "finalized");
        if (confirmation.value.err) {
            return Promise.reject(new Error(`Transaction not confirmed: ${confirmation.value.err.toString()}`));
        }
        console.log("Confirmed: ", signature);
        return confirmation.value;
    } catch (e) {
        return Promise.reject(e);
    }
}

const sellATAs = async (excludedMints: string[]) => {
    const unpackedATAs = (
        await getAllTokenAccountsByOwnerUnpacked(connection, owningAccount.publicKey)
    )
    .filter(
        account => !excludedMints.includes(account.mint.toString())
            && account.isInitialized
            && account.amount > 0
            && !account.isFrozen
    );
    for (const ata of unpackedATAs) {
        const quote = await getQuote(
            officialFetcher,
            ata.mint.toString(),
            desiredOutputMint,
            new BigNumber(ata.amount.toString()),
            slippageTolerance,
            48,
            false
        ).catch(e => {
            console.error(`Failed to get quote for ${ata.mint.toString()}`, e);
            return null;
        })
        if (!quote) {
            continue;
        }
        const decimalOutput = ToDecimal(quote.otherAmountThreshold, desiredOutputMintDecimals);
        if (decimalOutput.isLessThan(desiredOutputAmount)) {
            console.log(`Skipping ${ata.mint.toString()} because it's not worth enough: ${decimalOutput.toString()} ${desiredOutputMint.toString()}`);
            continue;
        }
        await getSwapInstructionsUncached(officialFetcher, quote)
            .then(sellATA)
            .catch(e => {
                if (e instanceof TransactionExpiredBlockheightExceededError) {
                    console.error("Transaction expired blockheight exceeded. Could not confirm signature", e.signature);
                }
                else {
                    console.error(`Failed to swap ${ata.mint.toString()}`, e);
                }
            }
        );
        await sleep(1000);
    }
}

const main = async () => {
    await sellATAs(excludedMints);
    console.log("Done");
    process.exit(0);
}
main();
