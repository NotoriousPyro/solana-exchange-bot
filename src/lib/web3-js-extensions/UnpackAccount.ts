import { AccountInfo, PublicKey } from "@solana/web3.js";
import {
    ACCOUNT_SIZE,
    ACCOUNT_TYPE_SIZE,
    AccountLayout,
    AccountState,
    AccountType,
    Account,
    MULTISIG_SIZE,
    TokenAccountNotFoundError,
    TokenInvalidAccountError,
    TokenInvalidAccountOwnerError,
    TokenInvalidAccountSizeError,
} from "@solana/spl-token";
import { TOKEN_PROGRAMS } from "./TokenProgram";



/**
 * Unpack a token account. A better version than the one in the spl-token package
 *
 * @param pubkey   Token account
 * @param account  Token account data
 *
 * @return Unpacked token account
 */
export function unpackAccount({
    pubkey: address,
    account: info,
}: {
    pubkey: PublicKey;
    account: AccountInfo<Buffer> | null
}): Account {
    if (!info) throw new TokenAccountNotFoundError();
    const isTokenProgram = TOKEN_PROGRAMS.includes(info.owner.toString());
    if (!isTokenProgram) throw new TokenInvalidAccountOwnerError();
    if (info.data.length < ACCOUNT_SIZE) throw new TokenInvalidAccountSizeError();

    const rawAccount = AccountLayout.decode(new Uint8Array(info.data.subarray(0, ACCOUNT_SIZE)));
    let tlvData = Buffer.alloc(0);
    if (info.data.length > ACCOUNT_SIZE) {
        if (info.data.length === MULTISIG_SIZE) throw new TokenInvalidAccountSizeError();
        if (info.data[ACCOUNT_SIZE] != AccountType.Account) throw new TokenInvalidAccountError();
        tlvData = info.data.subarray(ACCOUNT_SIZE + ACCOUNT_TYPE_SIZE);
    }

    return {
        address,
        mint: rawAccount.mint,
        owner: rawAccount.owner,
        amount: rawAccount.amount,
        delegate: rawAccount.delegateOption ? rawAccount.delegate : null,
        delegatedAmount: rawAccount.delegatedAmount,
        isInitialized: rawAccount.state !== AccountState.Uninitialized,
        isFrozen: rawAccount.state === AccountState.Frozen,
        isNative: !!rawAccount.isNativeOption,
        rentExemptReserve: rawAccount.isNativeOption ? rawAccount.isNative : null,
        closeAuthority: rawAccount.closeAuthorityOption ? rawAccount.closeAuthority : null,
        tlvData,
    };
}
