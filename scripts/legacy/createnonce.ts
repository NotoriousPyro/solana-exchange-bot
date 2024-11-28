import {
    Connection,
    CreateNonceAccountParams,
    Keypair,
    NONCE_ACCOUNT_LENGTH,
    PublicKey,
    SystemProgram,
    Transaction,
    TransactionMessage,
    VersionedTransaction,
    WithdrawNonceParams
} from "@solana/web3.js";
import config from "../../src/lib/Config";
import bs58 from "bs58";
import fs from 'fs';
import yaml from 'yaml';
import { createComputeBudgetInstruction } from "../../src/lib/TransactionBuilder";
const connection = new Connection(
    config.rpc.httpEndpoint,
    {
        disableRetryOnRateLimit: config.rpc.disableRetryOnRateLimit,
        commitment: config.rpc.commitment,
        wsEndpoint: config.rpc.wsEndpoint,
    },
);

/**
 * Create 5 nonce accounts and initialise them.
 */
const createNonceAccount = async () => {
    const instruction = new Transaction();
    const keypairs: Keypair[] = []
    for (let i = 0; i < 4; i++) {
        keypairs.push(Keypair.generate());
    }
    for (const keypair of keypairs) {
        const rent = await connection.getMinimumBalanceForRentExemption(NONCE_ACCOUNT_LENGTH)
        const nonceparams: CreateNonceAccountParams = {
            fromPubkey: config.SIGNER_KEY.publicKey,
            noncePubkey: keypair.publicKey,
            authorizedPubkey: config.SIGNER_KEY.publicKey,
            lamports: rent,
        };
        instruction.add(
            SystemProgram.createNonceAccount(nonceparams),
        )
    }
    const bhInfo = await connection.getLatestBlockhashAndContext({ commitment: "finalized" });
    const messageV0 = new TransactionMessage({
        payerKey: config.SIGNER_KEY.publicKey,
        recentBlockhash: bhInfo.value.blockhash,
        instructions: [
            ...createComputeBudgetInstruction(
                100_000, 100
            ),
            ...instruction.instructions
        ],
    }).compileToV0Message();
    const tx = new VersionedTransaction(messageV0);
    tx.sign([config.SIGNER_KEY, ...keypairs]);
    const simulation = await connection.simulateTransaction(tx, { commitment: "processed" });
    if (simulation.value.err) {
        throw new Error(`Simulation failed: ${simulation.value.err.toString()}`);
    }
    try {
        const signature = await connection.sendTransaction(tx, {
            maxRetries: 20,
            skipPreflight: false,
            preflightCommitment: "processed",
        });
        const confirmation = await connection.confirmTransaction({
            signature,
            blockhash: bhInfo.value.blockhash,
            lastValidBlockHeight: bhInfo.value.lastValidBlockHeight,
        }, "finalized");
        if (confirmation.value.err) {
            throw new Error(`Transaction not confirmed: ${confirmation.value.err.toString()}`);
        }
        console.log("Confirmed: ", signature);
        fs.appendFileSync("noncekeys.yaml", yaml.stringify(keypairs.map(keypair => bs58.encode(keypair.secretKey))));
        fs.appendFileSync("noncepubkeys.yaml", yaml.stringify(keypairs.map(keypair => keypair.publicKey.toString())));
    } catch (error) {
        console.error("Failed: ", error);
        throw error;
    }
}


/**
 * Withdraw the lamports from the nonce accounts and close them.
 * @param nonceAccountPublicKeys List of nonce account public keys
 * @param nonceAccountAuthorisedPubkey Authorised public key for the nonce accounts
 * @param nonceAccountToPubkey Public key to withdraw the lamports to
 * @param txPayerAndSigner Transaction payer and signer
 */
const withdrawNonceAccount = async (
    nonceAccountPublicKeys: PublicKey[],
    nonceAccountAuthorisedPubkey: PublicKey,
    nonceAccountToPubkey: PublicKey,
    txPayerAndSigner: Keypair
) => {
    const chunkSize = 5;
    for (let i = 0; i < nonceAccountPublicKeys.length; i += chunkSize) {
        const instruction = new Transaction();
        const chunk = nonceAccountPublicKeys.slice(i, i + chunkSize);
        for (const publicKey of chunk) {
            const rent = await connection.getMinimumBalanceForRentExemption(NONCE_ACCOUNT_LENGTH)
            const nonceparams: WithdrawNonceParams = {
                noncePubkey: publicKey,
                authorizedPubkey: nonceAccountAuthorisedPubkey,
                toPubkey: nonceAccountToPubkey,
                lamports: rent,
            };
            instruction.add(
                SystemProgram.nonceWithdraw(nonceparams),
            )
        }
        const bhInfo = await connection.getLatestBlockhashAndContext({ commitment: "finalized" });
        const messageV0 = new TransactionMessage({
            payerKey: txPayerAndSigner.publicKey,
            recentBlockhash: bhInfo.value.blockhash,
            instructions: [
                ...createComputeBudgetInstruction(
                    200_000, 100
                ),
                ...instruction.instructions
            ],
        }).compileToV0Message();
        const tx = new VersionedTransaction(messageV0);
        tx.sign([txPayerAndSigner]);
        const simulation = await connection.simulateTransaction(tx, { commitment: "processed" });
        console.log("Simulation: ", simulation.value);
        if (simulation.value.err === "BlockhashNotFound") {
            throw new Error("Blockhash not found. Try again.");
        }
        if (simulation.value.err) {
            throw simulation.value.err;
        }
        try {
            const signature = await connection.sendTransaction(tx, {
                maxRetries: 20,
                skipPreflight: true,
                preflightCommitment: "processed",
            });
            const confirmation = await connection.confirmTransaction({
                signature,
                blockhash: bhInfo.value.blockhash,
                lastValidBlockHeight: bhInfo.value.lastValidBlockHeight,
            }, "finalized");
            if (confirmation.value.err) {
                throw new Error(`Transaction not confirmed: ${confirmation.value.err.toString()}`);
            }
            console.log("Confirmed: ", signature);
            console.log("Nonce accounts withdrawn", chunk.map(key => key.toString()));
        } catch (error) {
            console.error("Failed: ", error);
            throw error;
        }
    }
}

// createNonceAccount().then(() => {
//     console.log("Nonce accounts created")
//     process.exit(0)
// });

const nonces = [
    "4PNBx18yjsLLBRF3cgshgkTXzqFBvpmo5mqzwpMqjqmu",
    "8zNVK5kdJBWDaYhydZFSnm4FiSv7VsbsxJ878cFWZDPF",
    "AVPqstYCkURqwoXtFY8RiPGFuRu78D5PNNVPEP93pcNg",
    "FFryTEGBJGJC4wFDM1BapbK9zZM8XUiAGZAXDmQVZzNp",
    "8xtnTm7S3m8XPbdeZHRefDcC8fGkyQHA89bC93N8ExUq",
    "3wxdVYeS2DZbdQgdpKiY3L2r6Ycrp4TwDxu7U3rjr2QN",
    "BUjRk4FUjW6DF6MiM8aekdhbSsV9B4N46uP1bo3w8qxt",
    "8HL6Uy9obgkSsd3FmZDQFRZqnToqGRyDT8JKVwgGhtLN",
    "6NeMbewZhhHcoPRpe3afEEpC1Rqmm3LEtSvuVn3cxa4M",
    "9MtfSmLHcL4BZaP6ojsvUq2TekLguctPfuU3uTHhzNg7",
    "3rfohdvr8uH4CXa8yCjpmZWj7ktAfHkw62zM612TCR2h",
    "5pacZtuQF6y2YWV6PYwGU5RJqLmYYhqvYxkPxa9YEeTu",
    "GvJEeYvScPC6Qc8hoJv6YzGSXakyZTZNt6vDaj9fHLSY",
    "HndV1E58ymqofqcQwRRFP5iSdNtRMyVv7ttnbJ24bu22",
    "5RaUcHV82sncAvEd43Ym45Sa12m9BPcDhCvoJySNxiQV",
    "2wSMKxBkuEhrkqJC1FsUN2KLPnaXDvMSYdjjbJc2hApA",
    "5zc5KbnuB9hiRFTCuaePCUjrV5isHunbyU6CJRZpq6Ln",
    "BgMTG5VHPzC1H4dAds7YyB3X74jgiqiCMU1FZW4RMifm",
    "5DWLC6hwNJF6eZiN9n2hVdsLRP8uBtJKzS5HKqBiyWaA",
    "GQ6s2YaWD2TFgdkPD7untv4wyP15YH8BjsYn4PeXwAvU",
    "FtNyTkcwxxDer5RgduripfFMuCg6ZoPWQAgqh2nmwuYU",
    "HGNpRkxrJ3gsNHXo4V5pEVZyp6teT27CZvKBQeSw5aBP",
    "BsUHboYwcH7Y2PCtY9XaB9z7M2rT8djQ6ABf1SdrTTac",
    "qPv3CQAGFHHjieH5YzSTSDXKqQfSjeBpkz8SCimv9Ds",
    "5dWPGmGYbJmns8CQB4u2aHX5WqdeTzqNizZSV19Jf2gA",
    "9JFDNBX4pQcpe13fuG5QDRMbbdVrv281CzU1Sqpgtd2L",
    "9W16aW3nyXn2prZJKPw2itanFn9qzcTUSAUTfDtHS1hL",
    "CAwFYQp4LCHRAnUvZoSnrU4PJaLMLZr8EZkgB6Rc73Nt",
    "2Xa6ux2qH9SEydemeqzLmYFkd9pCgD5X2fUFFyzfWgrB",
    "C2aCWPPRWkqpugEtj5A1T2cbib2beAoJTJxw4Hccp8JT",
    "5FqMR3k2pmKZ6SzxX5F1uLvUbzqc2X2hmfV5yTLnSNcV",
    "G4CT1mTuRtq6YN4eE6jqG3g5hHM67r7f4NByMK66Bovf",
    "DqCbwf7ddC43qGtyxsXXQuyg3m8nrFj6fb48HHSfF7zL",
    "99DzPpNkKbqvL8hcFUZddFB9rgQGXvpZV83Sy7gF7YLv",
    "DHKC3SHDYust1dfmw49a4UWWoSmS7U1bQTvFFwVNNBZP",
    "E819jQhGgr9ePmW7esNCByRF1icFaCgKFSQXghPCRK8",
    "3NqkfEnYmRWS1mkWwJPSzfxuue42temwt9ET6vR9i2Ap",
    "EWhLRoqcgmoZscaiBw8ddKwsY6kxYDjpbBB33KXckvQr",
    "AgwKSraVCKJWHQ7xvuj5KzsaqW6aYuNBNXWePBpd18pH",
    "7eBXme6reUbVZ4PvRJU8pZYPPYaEnaNE4MVzYq3SUxTU",
    "EcbMhJRciZzF8yNtQbFwD1GCX5y7EMTDJELiRFiXX8Ko",
    "GV5gFPCMkWpE5qN3i96pizo9bS1MRnAQcBLKcGJK2EmQ",
    "9y4K8y92C5GnBMcxD8ejCSdksZBES8VrwxrW5Fa5tPnb",
    "CwFX8R15JTQ8bMD6zEazA75dF5sKojmLGGse34eRazkd",
    "CDJVETpgVFC9nY6t4hGd9EFms5Bes4nMBombuDB6S5WB",
    "BwmunDgvAnYNej7ZSsv2yARDTo9QtECxhGN6ZYeodpki",
    "9uUu4p6wv1zzwvvr9Q8sBs442bsYY6HnWTgzDQqs4LiP",
    "wJvnUviMjsHhMvUPqDfR4Wk4eXWk5EmUFRjhdAqBkVQ",
    "UQ4CxAGEa8yQGfQDbJXrQdKNqz46JZPLctF7X8jnaRu",
    "CQfg9pouCpHjFWmptCWd6byQPjamjWsXgAMPo6aow3pW",
    "6RVs4ZhkEPsUTWHGW4Hyke131vVTFLSqs1gTCgcjMBsK",
    "GvYVkisxr25DepWmreysUZxxnqV2ce578L4kfRL23kRe",
    "9bDaaaW5poaf1Ef939SvNge5CwgWnKHeHtwPZfKLzzej",
    "FWo2wrqJSujM9HEEJacpSmRsAkVZBB2SQUSuNggwVNgB",
    "BiwLpbua6scua8nQeoLUdD8szNUhkeVmUdAhgVwy24aS",
    "FX6mCg1S6hWDeb5595Ju8cAN4BENYyNfriZenhHqh6HR",
    "AQGM69x59jk49B9YYVa6LCKy3koskFEVhihfNkWhMi43",
    "8j6Ezitmn1Vuo4nXDwDfY4k5sxhydGHGCdj7pwSkkP4E",
    "8pArTjvMMrawJz5ZjVdBTBVptk9C263NnoaFe77rkZEQ",
    "216WjpCfMizEDb2yVhwG8wc4wcwYwefAZr6P1hiNJQGk",
    "82QnS4czLk91RepJZ6QwhRrHpdVou1EcMDqkui591VYz",
    "Gh2iXjcv6iep8YnuMcxW2PLnZnQ9VZrMd5sxN6L5Dxda",
    "RWJfUnZNzmg2gs4Jrv96ZVgcRgv6CXHxWzYFf3D9VTp",
    "2KRxpRTykuzHwL2Lcbr8a4AERXEQc7muc64pbb3zGuA2",
    "8BHuPfWUwSpUWfnXFD2ED5a7WxEBAZNwgYB9tJfQHtbs",
    "GqwXdMsy7H87qC2C5p98MgsBNPeyqrwL6hV2uygvPFaH",
    "4ypa1qGJoTu1JszphvqRejdCBWDu2H4dkdEojCB11Myx",
    "Qf7tuuhZhK2WdPjmrEQhHtGbF7vQmzfdEEWBaa3rCFV",
    "2mrg66do4DwpqZQmMFTwZfqb3Y7BkGEVAgCJNihRVG7i",
    "Hay68HLjwsu61eZrkNL6xLRzmk8C7G3dwhXvqVNdcvg",
    "3s2LwTneTi3U24xB4QUu9y8mVAsQ8GFyr3hPyUdyEq11",
    "DmGjGxfg8BYCgZsZKLdCSeUtxWj7XKFdyM6h5FgnMLFr",
    "DhvdysWEAGB2xY7p1ZrBf1vQ3tyf1vRbtiLCR5PWii8x",
    "2Nty5j1VUuBCDEhn2dwZSsRLMjNnvot5XBsDdFPc2gGX",
    "4tRQ3csjvo4ChjycqJ8mHEsaXv82aanuCXZgRaWi6WAh",
    "DDoqAKmpjUbn1setBYwkpE2nAkuwytSjpDKzbpHdB7sz",
    "GPoFSSxd8nu71B6xxnuvqRi4tZ7W6MMysrrzmp9WE8bD",
    "HdTJC46rCUqr7AsiG33gqgkfMdVBK1SJCtUUvo511Gqm",
    "EnAqt6QcyceXr7PX3kVQ4cVuQs2jvMVsT6RrLcnhNfLB",
    "HPU3jZeWrJTCxZZ6CiKyHAEvDdL4prwVotTwyRtwNS5v",
    "xrCirucZv84AHbz8PhkJN9nGcgA43gAvcKEwfUAsaD4",
    "EmFneBTH16dcMoRkZ4CjaYcy1DjcXTStSAcXcrfZfLja",
    "7SyZYmv5HMuqBbHsn3r4XPKdYr9vBGveZmhMX5PzwnyS",
    "6QhPuCoLXBiGWn87JzR532gX9wdAvyHVRVmcZnxQn54L",
    "F77seaNNPthXQ43t72tD7YB8Mzg8LZ3bCVdU2pjRngRE",
    "GfvpCWDRES6RtjkEtRj6CVSF9oQpmZcWYwvYoe8QVzik",
    "JfdL6DhAJa2PLoMBANg2trM34tzMtgGsfMGjDWPphYN",
    "FgG397FzKaxGPxA6ZjDpSKrqgUXxhq7u5kgTQXb8rZAQ",
    "76KoqQzpyFgPziVZKfQZmYT53LEWuu5FfgtnPLinSeF",
    "C4BrAgjALG5GgY7yo4wFP4ojQB5oNgLsypkK9CLNFQnA",
    "9mvRDyYZtkf93azBHZNWdWUdrtFuEMdBuarx9DRuRH8B",
    "685PJDWK8Cktmgkrfu17CN6n23XyWrSQvUKMqnV4R1fC",
    "AybXjqcTfpmnAWMaf2pbVjPE9SiXNpgH5WQojc2onUkY",
    "4ermm7nGPFuJ6dMHJn85D8AttjoqERAV6kNwnTPkAwWw",
    "GeS6dRrAapdqEZGSeDFwyfBGUEA6JbZqiwEMQwaWEB3j",
]

withdrawNonceAccount(nonces).then(() =>
    console.log("Nonce accounts withdrawn")
);



/**
 * Create 25 nonce accounts and initialise them.
 */
// const createNonceAccounts = async () => {
//     const instruction = new Transaction();
//     for (let chunk = 0; chunk < 5; chunk++) {
//         const keypairs: Keypair[] = []
//         for (let i = 0; i < 5; i++) {
//             keypairs.push(Keypair.generate());
//         }
//         console.log("Secret keys for nonce accounts: ")
//         for (const keypair of keypairs) {
//             console.log(bs58.encode(keypair.secretKey))
//             const rent = await connection.getMinimumBalanceForRentExemption(NONCE_ACCOUNT_LENGTH)
//             const nonceparams: CreateNonceAccountParams = {
//                 fromPubkey: config.keypair.publicKey,
//                 noncePubkey: keypair.publicKey,
//                 authorizedPubkey: config.keypair.publicKey,
//                 lamports: rent,
//             };
//             instruction.add(
//                 SystemProgram.createNonceAccount(nonceparams),
//             )
//         }
//         const bhInfo = await connection.getLatestBlockhashAndContext();
//         instruction.feePayer = config.keypair.publicKey;
//         instruction.lastValidBlockHeight = bhInfo.value.lastValidBlockHeight;
//         instruction.recentBlockhash = bhInfo.value.blockhash;
//         instruction.sign(config.keypair, ...keypairs);
//         const signature = await connection.sendRawTransaction(instruction.serialize(), {skipPreflight: true})
//         await sleep(500);
//         console.log("Nonce Acct Initialised sig: ", signature);
//         fs.appendFileSync("nonce.yaml", yaml.stringify({
//             [signature]: keypairs.map(keypair => ({
//                 pubkey: keypair.publicKey.toString(),
//                 secret: bs58.encode(keypair.secretKey),
//             }))
//         }));
//     }
// }


