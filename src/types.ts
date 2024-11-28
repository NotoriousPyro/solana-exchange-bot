import { QuoteResponse } from "@jup-ag/api";
import { TransactionError, SimulatedTransactionAccountInfo, TransactionReturnData } from "@solana/web3.js";
import BigNumber from "bignumber.js";


export type SimulatedTransactionResponse = {
    err: TransactionError | string | null;
    logs: Array<string> | null;
    accounts?: (SimulatedTransactionAccountInfo | null)[] | null;
    unitsConsumed?: number;
    returnData?: TransactionReturnData | null;
}

export type ArbRoute = {
    quoteA: QuoteResponse,
    quoteB: QuoteResponse,
}

export type RandomQuoteData = {
    inAmount: BigNumber
    quoteA_maxAccounts: number
    quoteB_maxAccounts: number
}




/**
 * In `Target`, replace all instances of the type assignable to `Assignable` with the type `Replacement`
 */
export type AssignableTypeReplacer<Target, Assignable, Replacement> = {
    [Property in keyof Target]: Target[Property] extends Assignable ? Replacement : Target[Property];
}

/**
 * In `Target`, replace all instances of properties whose keys are in the union `Keys` with the type `Replacement`
 */
export type KeyedTypeReplacer<Target, Keys extends keyof Target, Replacement> = {
    [Property in keyof Target]: Property extends Keys ? Replacement : Target[Property];
}

/**
 * In `Target`, replace all instances of properties whose keys are in the union `Keys` if they are assignable to `Assignable` with the type `Replacement`
 */
export type AssignableKeyedTypeReplacer<Target, Keys extends keyof Target, Assignable, Replacement> =
    KeyedTypeReplacer<Target, Keys, Replacement>
    & AssignableTypeReplacer<Target, Assignable, Replacement>
;
