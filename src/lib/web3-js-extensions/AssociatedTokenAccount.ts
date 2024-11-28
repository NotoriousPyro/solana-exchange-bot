import { Connection, PublicKey } from "@solana/web3.js";
import {
    TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { unpackAccount } from "./UnpackAccount";


export const getAllTokenAccountsByOwner = async (
    connection: Connection,
    owner: PublicKey
) => await connection.getProgramAccounts(TOKEN_PROGRAM_ID, {
    filters: [
        {
            dataSize: 165
        }, {
            memcmp: {
                offset: 32,
                bytes: owner.toString(),
            }
        }
    ]
});

export const getAllTokenAccountsByOwnerUnpacked = async (
    connection: Connection,
    owner: PublicKey
) => (await getAllTokenAccountsByOwner(connection, owner)).map(unpackAccount);
