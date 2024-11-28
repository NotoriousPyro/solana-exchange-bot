import { PublicKey, Transaction, TransactionMessage, VersionedTransaction } from "@solana/web3.js";
import config from "../src/lib/Config";
import BigNumber from "bignumber.js";
import { createAssociatedTokenAccountIdempotentInstruction, createTransferCheckedInstruction, getAssociatedTokenAddressSync } from "@solana/spl-token";
import { blockhashCache, connection } from "../src/connection";
import { createComputeBudgetInstruction } from "../src/lib/TransactionBuilder";
import { simulation } from "../src/swaphelper";

/**
 * Distributes rewards based on a a token amount a user has, e.g. staked or LP tokens.
 * 
 * Caps each person's rewards to the amount they have staked or the total reward available.
 */
const sendRewards = async () => {
    const cliff = 8; // dec
    const totalLimit = new BigNumber(4_166_000).dividedBy(cliff);
    const instruction = new Transaction();
    const stakers: { // Collection of all those holding a certain amount of a token you want to distribute rewards based on
        publicKey: PublicKey,
        staked: BigNumber,
    }[] = [
        {
            publicKey: "9BBRGif6mYsqwrSAFyeHqedEbZyXhyEK3RNfrXR1PoVM",
            staked: 536_773,
        },
        {
            publicKey: "7Vjm4ZMMVTB6d14z3SPfnSCyxtUiT4CPLXpwHftg9cVn",
            staked: 1_885_518,
        },
        {
            publicKey: "724gB6hsqBx1KvjdgVTFnAJ1puCE4cufn82Bhr7FZJYR",
            staked: 20_000_000,
        }
    ].map(staker => ({
        publicKey: new PublicKey(staker.publicKey),
        staked: new BigNumber(staker.staked),
    }));
    const totalStaked = stakers.reduce((acc, curr) => acc.plus(curr.staked), new BigNumber(0));
    const multiplier = new BigNumber(totalStaked).dividedBy(totalLimit);  // The total rewards that are available based on the total staked
    const rewards = [ // The tokens that will be distributed, and the amount that will be distributed based on the staked amount
        {
            mint: new PublicKey("DARpE2GaVrazeh6mopWXbTT1hV3EbNNvHrJMMqJXUm6i"),
            amount: BigNumber.min(totalLimit, new BigNumber(totalLimit).multipliedBy(multiplier)),
            decimals: 9,
        }
        // {
        //     mint: new PublicKey("BoZoQQRAmYkr5iJhqo7DChAs7DPDwEZ5cv1vkYC9yzJG"),
        //     amount: BigNumber.min(5_000_000_000_000, new BigNumber(5_000_000_000_000).multipliedBy(multiplier)),
        //     decimals: 5,
        // }
    ]
    const perStakerRewards: {  // The calculated rewards for each staker
        publicKey: PublicKey,
        rewards: {
            mint: PublicKey,
            ata: PublicKey,
            amount: BigNumber,
            decimals: number,
        }[]
    }[] = stakers.map(staker => ({
        publicKey: staker.publicKey,
        rewards: rewards.map(reward => ({
            mint: reward.mint,
            ata: getAssociatedTokenAddressSync(reward.mint, staker.publicKey),
            amount: reward.amount.multipliedBy(staker.staked).dividedBy(totalStaked).decimalPlaces(0),
            decimals: reward.decimals,
        }))
    }));
    for (const staker of perStakerRewards) {  // Create the instructions to send the rewards and create the associated token accounts
        for (const reward of staker.rewards) {
            const sourceAta = getAssociatedTokenAddressSync(reward.mint, config.SIGNER_KEY.publicKey);
            instruction.add(
                createAssociatedTokenAccountIdempotentInstruction(config.SIGNER_KEY.publicKey, reward.ata, staker.publicKey, reward.mint),
                createTransferCheckedInstruction(sourceAta, reward.mint, reward.ata, config.SIGNER_KEY.publicKey, BigInt(reward.amount.toString()), reward.decimals)
            )
        }
    }
    const recentBlockhash = await blockhashCache.fetch("blockhash");
    const messageV0 = new TransactionMessage({
        payerKey: config.SIGNER_KEY.publicKey,
        recentBlockhash: recentBlockhash.blockhash,
        instructions: [
            ...createComputeBudgetInstruction(100_000, 100),
            ...instruction.instructions
        ],
    }).compileToV0Message();
    const tx = new VersionedTransaction(messageV0);
    await simulation(tx);
    try {
        const recentBlockhash = await blockhashCache.fetch("blockhash");
        tx.message.recentBlockhash = recentBlockhash.blockhash;
        tx.sign([config.SIGNER_KEY]);
        const signature = await connection.sendTransaction(tx, {
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
            throw new Error(`Transaction not confirmed: ${confirmation.value.err.toString()}`);
        }
        console.log("Confirmed: ", signature);
    } catch (error) {
        console.error("Failed to send rewards: ", error);
        throw error;
    }
}


const main = async () => {
    await sendRewards();
    process.exit(0);
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
