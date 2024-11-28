import {
    AddressLookupTableAccount,
    ComputeBudgetProgram,
    PublicKey,
    TransactionInstruction,
    TransactionMessage,
    VersionedTransaction,
} from "@solana/web3.js";
import {
    TOKEN_PROGRAM_ID,
    createAssociatedTokenAccountIdempotentInstruction,
    createCloseAccountInstruction,
} from '@solana/spl-token';


export const createComputeBudgetInstruction = (computeUnitLimit: number = 600000, computeUnitPrice: number = 1) => [
    ComputeBudgetProgram.setComputeUnitLimit({
        units: computeUnitLimit // compute units
    }),
    ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: computeUnitPrice // priority fee
    })
];


/**
 * Create an ATA instruction where the owner is also the payer.
 * @param tokenMint 
 * @param ata PublicKey
 * @param payerAndOwner 
 * @param tokenProgramId 
 * @returns 
 */
export const createOwnedAssociatedTokenAccountIdempotentInstruction = (
    tokenMint: PublicKey,
    ata: PublicKey,
    payerAndOwner: PublicKey,
    tokenProgramId: PublicKey,
): TransactionInstruction =>
    createAssociatedTokenAccountIdempotentInstruction(
        payerAndOwner,
        ata,
        payerAndOwner,
        tokenMint,
        tokenProgramId,
    )

export const createCloseOwnedAccountInstruction = (
    owner: PublicKey,
    ata: PublicKey,
): TransactionInstruction =>
    createCloseAccountInstruction(
        ata,
        owner,
        owner,
        undefined,
        TOKEN_PROGRAM_ID,
    )


export const compileTransaction = async (
    payer: PublicKey,
    instructions: TransactionInstruction[],
    addressLookupTableAccounts: AddressLookupTableAccount[],
    blockhash: string,
): Promise<VersionedTransaction> => {
    try {
        const messageV0 = new TransactionMessage({
            payerKey: payer,
            recentBlockhash: blockhash,
            instructions,
        }).compileToV0Message(addressLookupTableAccounts);
        return new VersionedTransaction(messageV0);
    }
    catch (e) {
        return Promise.reject(e);
    }
}
