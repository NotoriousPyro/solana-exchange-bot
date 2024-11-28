import { AccountInfo, PublicKey } from "@solana/web3.js";
import {
    ACCOUNT_SIZE,
    ACCOUNT_TYPE_SIZE,
    AccountType,
    Mint,
    MINT_SIZE, 
    MintLayout,
    MULTISIG_SIZE,
    TokenAccountNotFoundError,
    TokenInvalidAccountOwnerError,
    TokenInvalidAccountSizeError,
    TokenInvalidMintError
} from "@solana/spl-token";
import { TOKEN_PROGRAMS } from "./TokenProgram";


interface MintExtended extends Mint {
    tokenProgramId: PublicKey;
}

/**
 * Unpack a mint. A better version than the one in the spl-token package
 *
 * @param address   Mint account
 * @param info      Mint account data
 *
 * @return Unpacked mint
 */
export function unpackMint(address: PublicKey, info: AccountInfo<Buffer> | null): MintExtended {
    if (!info) throw new TokenAccountNotFoundError();
    const isTokenProgram = TOKEN_PROGRAMS.includes(info.owner.toString());
    if (!isTokenProgram) throw new TokenInvalidAccountOwnerError();
    if (info.data.length < MINT_SIZE) throw new TokenInvalidAccountSizeError();

    const rawMint = MintLayout.decode(new Uint8Array(info.data.subarray(0, MINT_SIZE)));
    let tlvData = Buffer.alloc(0);
    if (info.data.length > MINT_SIZE) {
        if (info.data.length <= ACCOUNT_SIZE) throw new TokenInvalidAccountSizeError();
        if (info.data.length === MULTISIG_SIZE) throw new TokenInvalidAccountSizeError();
        if (info.data[ACCOUNT_SIZE] != AccountType.Mint) throw new TokenInvalidMintError();
        tlvData = info.data.subarray(ACCOUNT_SIZE + ACCOUNT_TYPE_SIZE);
    }

    return {
        address,
        mintAuthority: rawMint.mintAuthorityOption ? rawMint.mintAuthority : null,
        supply: rawMint.supply,
        decimals: rawMint.decimals,
        isInitialized: rawMint.isInitialized,
        freezeAuthority: rawMint.freezeAuthorityOption ? rawMint.freezeAuthority : null,
        tlvData,
        tokenProgramId: info.owner,
    };
}
