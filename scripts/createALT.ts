/* eslint-disable @typescript-eslint/no-unused-vars */
import {
    AddressLookupTableProgram,
    GetProgramAccountsFilter,
    PublicKey,
} from "@solana/web3.js";
import config from "../src/lib/Config";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { connection } from "../src/connection";
import fs from "fs";
import { sleep } from "../src/utils";
import yaml from "yaml";
import { unpackAccount } from "../src/lib/web3-js-extensions/UnpackAccount";
import { jitoTransactionSenderAndConfirmationWaiter, recentBlockhashManager } from "./helper";


const createAddressLookupTable = async () => {
    const slot = recentBlockhashManager.getSlot();
    const [lookupTableInst, lookupTableAddress] = AddressLookupTableProgram.createLookupTable({
        authority: config.SIGNER_KEY.publicKey,
        payer: config.SIGNER_KEY.publicKey,
        recentSlot: slot,
    });
    await jitoTransactionSenderAndConfirmationWaiter([lookupTableInst]);
    console.log(`Address lookup table: ${lookupTableAddress.toString()} created`);
    return lookupTableAddress.toString();
}


const extendAddressLookupTable = async (
    addressLookupTableAddress: string,
    addresses: string[]
) => {
    const extendInstruction = AddressLookupTableProgram.extendLookupTable({
        authority: config.SIGNER_KEY.publicKey,
        payer: config.SIGNER_KEY.publicKey,
        lookupTable: new PublicKey(addressLookupTableAddress),
        addresses: addresses.map(address => new PublicKey(address)),
    });
    await jitoTransactionSenderAndConfirmationWaiter([extendInstruction]);
    console.log(`Address lookup table: ${addressLookupTableAddress} extended with ${addresses.length} addresses`);
    return Promise.resolve();
}


const extendAddressTable = async (
    addressTable: string,
    addresses: string[]
) => {
    const created: string[] = []
    const chunkSize = 20;
    for (let i = 0; i < addresses.length; i += chunkSize) {
        const chunk = addresses.slice(i, i + chunkSize);
        try {
            await extendAddressLookupTable(addressTable, chunk);
            await sleep(1000); // Sleep between each extension to avoid hitting rate limits and so forth
        }
        catch (error) {
            console.error(error);
            continue; // Just report the error and try the next chunk, we won't modify the file later for the chunks that failed
        }
        created.push(...chunk);
    }
    return Promise.resolve(created);
}


const extendAddressTableFromFile = async (addressTable: string, file: string) => {
    const ataInfo = yaml.parse(fs.readFileSync(file, "utf-8")) as string[];
    const info = await extendAddressTable(addressTable, ataInfo).then(
        created => ataInfo.filter(ata => !created.includes(ata))
    )
    fs.writeFileSync(file, yaml.stringify(info, null, 2))
}


const deactivateAddressLookupTable = async (address: string) => {
    const deactivate = AddressLookupTableProgram.deactivateLookupTable({
        lookupTable: new PublicKey(address),
        authority: config.SIGNER_KEY.publicKey,

    });
    await jitoTransactionSenderAndConfirmationWaiter([deactivate]);
    console.log("Address lookup table deactivated: ", address);
    return Promise.resolve();
}

const closeAddressLookupTable = async (address: string) => {
    const close = AddressLookupTableProgram.closeLookupTable({
        lookupTable: new PublicKey(address),
        authority: config.SIGNER_KEY.publicKey,
        recipient: config.SIGNER_KEY.publicKey,
    });
    await jitoTransactionSenderAndConfirmationWaiter([close]);
    console.log("Address lookup table closed: ", address);
    return Promise.resolve();
}


/**
 * Looks for all the ATAs in an account, and then splits them into two files based on contents of mintsHighValue.yaml
 * @returns 
 */
const saveAtas = async () => {
    const allTokenAccountsFilter: GetProgramAccountsFilter[] = [
        {
            dataSize: 165
        }, {
            memcmp: {
                offset: 32,
                bytes: config.SIGNER_KEY.publicKey.toString(),
            }
        }
    ];
    const allTokenAccounts = await connection.getProgramAccounts(
        TOKEN_PROGRAM_ID, { filters: allTokenAccountsFilter }
    );
    const atas = allTokenAccounts.map(unpackAccount).filter(info => info.isInitialized);
    const ataMints = atas.map(ata => ata.mint.toString());
    const mintsHighValue = Array.from(config.feeMintMap.keys()).filter(mint => ataMints.includes(mint));
    const otherMints = atas.map(ata => ata.mint.toString()).filter(ata => !mintsHighValue.includes(ata));
    let chunk = 0;
    const chunkSize = 256 - mintsHighValue.length;
    for (let start = 0; start < otherMints.length; start += chunkSize) {
        /** save a chunk of public keys as strings */
        const atasChunk = [...mintsHighValue, ...otherMints.slice(start, start + chunkSize)];
        fs.writeFileSync(`scripts/data/addresstables/addresstable_${chunk}.yaml`, yaml.stringify(atasChunk, null, 2));
        chunk++;
    }
    return Promise.resolve();
}




const main = async () => {
    await recentBlockhashManager.run();
    
    // Just enable the desired section.

    // Fetch ATAs from the account and split them, useful for  extending from file
    // await saveAtas().then(() => {
    //     console.log("ATAs saved")
    //     process.exit(0)
    // })

    // Create ALT
    // createAddressLookupTable().then(() => {
    //     process.exit(0)
    // })

    // Extend ALT from file
    // extendFromFile("ASrmTGZ37LoRiDiops7SDJZEWEM4ZeDcVrV11Vxj9qho", "atainfo.yaml").then(() => {
    //     console.log("Address lookup table address extended")
    //     process.exit(0)
    // });

    // Deactivate ALT
    // deactivateAddressLookupTable("CcJKsd4xyRvrEV4puTpXFrNjkaLQb1XM8ZJmPeNtiM5M").then(() => {
    //     console.log("Address lookup table closed")
    //     process.exit(0)
    // })

    // Close ALT (must be deactivated first)
    // closeAddressLookupTable("CcJKsd4xyRvrEV4puTpXFrNjkaLQb1XM8ZJmPeNtiM5M").then(() => {
    //     process.exit(0)
    // })

}

main();
