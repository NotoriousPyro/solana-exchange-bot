import { SystemProgram } from "@solana/web3.js";
import { connection } from "../src/connection";
import config from "../src/lib/Config";


const main = async () => {
    const test = await connection.getSlot();
    console.log(test);
    const nonceAccounts = await connection.getProgramAccounts(
        // The system program owns all nonce accounts.
        SystemProgram.programId,
        {
            filters: [
                {
                    // Nonce accounts are exactly 80 bytes long
                    dataSize: 80,
                },
                {
                    // The authority's 32-byte public key is written
                    // into bytes 8-40 of the nonce's account data.
                    memcmp: {
                        bytes: config.SIGNER_KEY.publicKey.toString(),
                        offset: 8,
                    },
                },
            ],
        }
    );
    console.log(nonceAccounts);
    console.log(nonceAccounts.map(nonce => nonce.pubkey.toBase58()));
}

main();