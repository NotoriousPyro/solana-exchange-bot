import {
    ComputeBudgetProgram,
    PublicKey,
    TransactionMessage,
    VersionedTransaction
} from "@solana/web3.js";
import { connection } from "../src/connection";
import config from "../src/lib/Config";
import {
    TOKEN_PROGRAM_ID,
    createCloseAccountInstruction,
    createTransferCheckedInstruction,
    getAssociatedTokenAddressSync } from "@solana/spl-token";
import {
    createWSOLAssociatedTokenAccountIdempotentInstruction
} from "../src/lib/TransactionBuilder";
import { WellKnownTokenMints } from "../src/const";
import { jitoConnection } from "../src/jito";

const owningAccount = config.keypair;


const Unwrap = async () => {
    const wsolAccountAta = getAssociatedTokenAddressSync(
        new PublicKey(WellKnownTokenMints.Solana),
        owningAccount.publicKey,
        false,
        TOKEN_PROGRAM_ID
    );
    // const [lamportsAccount, wsolAccount] = await getAccountInfos([owningAccount.publicKey, wsolAccountAta]);
    const close = createCloseAccountInstruction(
        wsolAccountAta,
        owningAccount.publicKey,
        owningAccount.publicKey,
        undefined,
        TOKEN_PROGRAM_ID
    );
    const create = createWSOLAssociatedTokenAccountIdempotentInstruction(
        owningAccount.publicKey,
        wsolAccountAta
    )
    const transferChecked = createTransferCheckedInstruction(
        owningAccount.publicKey,
        new PublicKey(WellKnownTokenMints.Solana),
        wsolAccountAta,
        owningAccount.publicKey,
        config.maxAmount,
        9,
        undefined,
        TOKEN_PROGRAM_ID
    );
    const bhInfo = await connection.getLatestBlockhashAndContext({ commitment: "finalized" });
    const messageV0 = new TransactionMessage({
        payerKey: owningAccount.publicKey,
        recentBlockhash: bhInfo.value.blockhash,
        instructions: [
            ComputeBudgetProgram.setComputeUnitLimit({
                units: 100_000 // compute units
            }),
            close,
            create,
            transferChecked,
        ],
    }).compileToV0Message();
    const tx = new VersionedTransaction(messageV0);
    tx.sign([owningAccount]);
    const simulation = await connection.simulateTransaction(tx, { commitment: "processed" });
    if (simulation.value.err) {
        throw new Error(JSON.stringify(simulation.value.err));
    }
    try {
        const signature = await jitoConnection.sendTransaction(tx, {
            maxRetries: 20,
            skipPreflight: true,
            preflightCommitment: "processed",
        });
        const confirmation = await connection.confirmTransaction({
            signature,
            blockhash: bhInfo.value.blockhash,
            lastValidBlockHeight: bhInfo.value.lastValidBlockHeight,
        }, "processed");
        if (confirmation.value.err) {
            throw new Error(`Transaction not confirmed: ${confirmation.value.err.toString()}`);
        }
        console.log("Confirmed: ", signature);
    } catch (error) {
        console.error("Failed to burn accounts", error);
        throw error;
    }
}

const Wrap = async () => {
    const wsolAccountAta = getAssociatedTokenAddressSync(
        new PublicKey(WellKnownTokenMints.Solana),
        owningAccount.publicKey,
        false,
        TOKEN_PROGRAM_ID
    );
    // const [lamportsAccount, wsolAccount] = await getAccountInfos([owningAccount.publicKey, wsolAccountAta]);

    const close = createCloseAccountInstruction(
        wsolAccountAta,
        owningAccount.publicKey,
        owningAccount.publicKey,
        undefined,
        TOKEN_PROGRAM_ID
    );
    const create = createWSOLAssociatedTokenAccountIdempotentInstruction(
        owningAccount.publicKey,
        wsolAccountAta
    )
    const transferChecked = createTransferCheckedInstruction(
        owningAccount.publicKey,
        new PublicKey(WellKnownTokenMints.Solana),
        wsolAccountAta,
        owningAccount.publicKey,
        config.maxAmount,
        9,
        undefined,
        TOKEN_PROGRAM_ID
    );
    const bhInfo = await connection.getLatestBlockhashAndContext({ commitment: "finalized" });
    const messageV0 = new TransactionMessage({
        payerKey: owningAccount.publicKey,
        recentBlockhash: bhInfo.value.blockhash,
        instructions: [
            ComputeBudgetProgram.setComputeUnitLimit({
                units: 100_000 // compute units
            }),
            close,
            create,
            transferChecked,
        ],
    }).compileToV0Message();
    const tx = new VersionedTransaction(messageV0);
    tx.sign([owningAccount]);
    const simulation = await connection.simulateTransaction(tx, { commitment: "processed" });
    if (simulation.value.err) {
        throw new Error(JSON.stringify(simulation.value.err));
    }
    try {
        const signature = await jitoConnection.sendTransaction(tx, {
            maxRetries: 20,
            skipPreflight: true,
            preflightCommitment: "processed",
        });
        const confirmation = await connection.confirmTransaction({
            signature,
            blockhash: bhInfo.value.blockhash,
            lastValidBlockHeight: bhInfo.value.lastValidBlockHeight,
        }, "processed");
        if (confirmation.value.err) {
            throw new Error(`Transaction not confirmed: ${confirmation.value.err.toString()}`);
        }
        console.log("Confirmed: ", signature);
    } catch (error) {
        console.error("Failed to burn accounts", error);
        throw error;
    }
}

