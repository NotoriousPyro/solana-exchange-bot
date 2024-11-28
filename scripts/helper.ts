import { connection, getAccountInfos } from "../src/connection";
import { AccountInfoType } from "../src/db/AccountInfoDB";
import { RecentBlockhashManager } from "../src/lib/RecentBlockhashManager";
import { unpackMint } from "../src/lib/web3-js-extensions/UnpackMint";
import { Connection, TransactionInstruction, TransactionMessage, VersionedTransaction } from "@solana/web3.js";
import { Agent } from 'https';
import { createComputeBudgetInstruction } from "../src/lib/TransactionBuilder";
import config from "../src/lib/Config";
import { simulation } from "../src/swaphelper";

export const jitoConnection = new Connection(
    "https://amsterdam.mainnet.block-engine.jito.wtf/api/v1/transactions",
    {
        commitment: "processed",
        httpAgent: new Agent({
            keepAlive: true,
            keepAliveMsecs: 60000,
        }),
    },
);


export const getAllMintAccountsByATAs = async (atas: string[]) => {
    const mintAccountInfo = await getAccountInfos(
        AccountInfoType.TokenMint,
        atas,
        false,
    );
    return mintAccountInfo.map(mint => unpackMint(mint.publicKey, mint.accountInfo));
}


export const recentBlockhashManager = new RecentBlockhashManager(connection);

export const jitoTransactionSenderAndConfirmationWaiter = async (
    ixs: TransactionInstruction[]
) => {
    const messageV0 = new TransactionMessage({
        payerKey: config.SIGNER_KEY.publicKey,
        recentBlockhash: recentBlockhashManager.getBlockhash(),
        instructions: [
            ...createComputeBudgetInstruction(
                100_000, 100
            ),
            ...ixs,
        ],
    }).compileToV0Message();
    const tx = new VersionedTransaction(messageV0);
    await simulation(tx);
    try {
        const blockhash = recentBlockhashManager.getBlockhash();
        const lastValidBlockHeight = recentBlockhashManager.getLastValidBlockheight();
        tx.message.recentBlockhash = blockhash;
        tx.sign([config.SIGNER_KEY]);
        const signature = await jitoConnection.sendTransaction(tx, {
            maxRetries: 20,
            skipPreflight: true,
            preflightCommitment: "processed",
        });
        const confirmation = await connection.confirmTransaction({
            signature,
            blockhash,
            lastValidBlockHeight,
        }, "finalized");
        if (confirmation.value.err) {
            throw new Error(`Transaction not confirmed: ${confirmation.value.err.toString()}`);
        }
        console.log("Confirmed: ", signature);
    } catch (error) {
        console.error("Failed: ", error);
        throw error;
    }
}
