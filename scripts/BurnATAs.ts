import { ComputeBudgetProgram, TransactionInstruction, TransactionMessage, VersionedTransaction } from "@solana/web3.js";
import { blockhashCache, connection, getAccountInfos } from "../src/connection";
import config from "../src/lib/Config";
import { WellKnownTokenMints } from "../src/const";
import { simulation } from "../src/swaphelper";
import { sleep } from "../src/utils";
import { jitoConnection } from "./jitoconnection";
import { getAllTokenAccountsByOwnerUnpacked } from "../src/lib/web3-js-extensions/AssociatedTokenAccount";
import { createBurnCheckedInstruction, createCloseAccountInstruction } from "@solana/spl-token";
import { AccountInfoType } from "../src/db/AccountInfoDB";
import { unpackMint } from "../src/lib/web3-js-extensions/UnpackMint";

const owningAccount = config.SIGNER_KEY;

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


const burnATA = async (instructions: TransactionInstruction[]) => {
    const recentBlockhash = await blockhashCache.fetch("blockhash")
    const messageV0 = new TransactionMessage({
        payerKey: owningAccount.publicKey,
        recentBlockhash: recentBlockhash.blockhash,
        instructions: [
            ComputeBudgetProgram.setComputeUnitLimit({
                units: 100_000 // compute units
            }),
            ...instructions,
        ],
    }).compileToV0Message();
    const tx = new VersionedTransaction(messageV0);
    await simulation(tx);
    try {
        const recentBlockhash = await blockhashCache.fetch("blockhash");
        tx.message.recentBlockhash = recentBlockhash.blockhash;
        tx.sign([owningAccount]);
        await jitoConnection.sendTransaction(tx, {
            maxRetries: 20,
            skipPreflight: true,
            preflightCommitment: "processed",
        });
        // const confirmation = await connection.confirmTransaction({
        //     signature,
        //     blockhash: recentBlockhash.blockhash,
        //     lastValidBlockHeight: recentBlockhash.lastValidBlockHeight,
        // }, "finalized");
        // if (confirmation.value.err) {
        //     return Promise.reject(new Error(`Transaction not confirmed: ${confirmation.value.err.toString()}`));
        // }
        // console.log("Confirmed: ", signature);
        //return confirmation.value;
    } catch (e) {
        return Promise.reject(e);
    }
}

const burnAtas = async (excludedMints: string[]) => {
    const unpackedATAs = (
        await getAllTokenAccountsByOwnerUnpacked(connection, owningAccount.publicKey)
    )
    .filter(
        account => !excludedMints.includes(account.mint.toString())
            && account.isInitialized
            && !account.isFrozen
    );
    const unpackedMints = (await getAccountInfos(
        AccountInfoType.TokenMint,
        unpackedATAs.map(ata => ata.mint.toString()),
        false,
    )).map(mint => unpackMint(mint.publicKey, mint.accountInfo));
    const closeInstructions = unpackedATAs.map((ata, index) => {
        if (!ata) {
            return;
        }
        const mint = unpackedMints[index];
        if (!mint) {
            return;
        }
        return [
            createBurnCheckedInstruction(
                ata.address,
                ata.mint,
                owningAccount.publicKey,
                ata.amount,
                mint.decimals,
                undefined,
                mint.tokenProgramId
            ),
            createCloseAccountInstruction(
                ata.address,
                owningAccount.publicKey,
                owningAccount.publicKey,
                undefined,
                mint.tokenProgramId
            )
        ];
    }).flat().filter(instruction => instruction);
    // close accounts in chunks of 10 instructions per chunk, .e.g 10 close instructions per transaction
    const chunkSize = 10;
    for (let i = 0; i < closeInstructions.length; i += chunkSize) {
        const chunk = closeInstructions.slice(i, i + chunkSize);
        await burnATA(chunk).catch(e => {
            console.error("Failed to burn ATAs", e);
        });
        await sleep(1000);
    }
}

const main = async () => {
    await burnAtas(excludedMints);
    console.log("Done");
    process.exit(0);
}
main();
