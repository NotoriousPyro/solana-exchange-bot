import BigNumber from 'bignumber.js';
import { RandomQuoteData } from './types';


export function limitBigNumberInRange(num: BigNumber, min: BigNumber, max: BigNumber) {
    return BigNumber.min(BigNumber.max(num, min), max);
}


export const randomBigNumberPairInRange = (
    min: BigNumber,
    max: BigNumber,
    randomiser: BigNumber = BigNumber.random()
): [BigNumber, BigNumber] => {
    const _MIN = min;
    const _MAX = max.minus(min);
    const maxA = limitBigNumberInRange(
        (randomiser.multipliedBy(_MAX).decimalPlaces(0, BigNumber.ROUND_FLOOR)).plus(1),
        _MIN,
        _MAX
    );
    const maxB = limitBigNumberInRange(max.minus(maxA), _MIN, _MAX);
    return [maxA, maxB];
}


export const randomBigNumberInRange = (
    min: BigNumber,
    max: BigNumber,
    rd = BigNumber.random()
): BigNumber =>
    BigNumber.min(
        rd.multipliedBy(rd)
            .multipliedBy(max.minus(min))
            .plus(min)
    , max);


export const sleep = async (ms: number) => new Promise(resolve => setTimeout(resolve, ms));


export const ToBigNumber = (value: string | number | BigNumber | bigint): BigNumber =>
    value instanceof BigNumber
        ? value
        : new BigNumber(`${value}`)
    ;


export const ToDecimal = (
    value: string | number | bigint | BigNumber,
    decimals: number
): BigNumber =>
    ToBigNumber(value)
        .dividedBy(new BigNumber(10).pow(decimals))
    ;


export const ToBigNumberPowDecimals = (
    value: string | number | BigNumber | bigint,
    decimals: number
): BigNumber =>
    ToBigNumber(value)
        .multipliedBy(new BigNumber(10).pow(decimals))
        .decimalPlaces(0)
    ;


export const getRandomizedQuoteData = (
    minAmount: number,
    maxAmount: number,
    minAccounts: number,
    maxAccounts: number,
    targetAccounts: number,
): RandomQuoteData => {
    const rb = BigNumber.random();
    const MIN_AMOUNT = new BigNumber(minAmount);
    const MAX_AMOUNT = new BigNumber(maxAmount);
    const MIN_ACCOUNTS = new BigNumber(minAccounts);
    const MAX_ACCOUNTS = new BigNumber(maxAccounts);
    const TARGET_ACCOUNTS = new BigNumber(targetAccounts);
    const inAmount = randomBigNumberInRange(MIN_AMOUNT, MAX_AMOUNT).decimalPlaces(0)
    const ACCOUNTS = randomBigNumberPairInRange(MIN_ACCOUNTS, TARGET_ACCOUNTS, rb)
    const [MAX_ACCOUNTS_A, MAX_ACCOUNTS_B] = ACCOUNTS;
    const quoteA_maxAccounts = limitBigNumberInRange(
        MAX_ACCOUNTS_A.plus(
            BigNumber.max(0,
                MAX_ACCOUNTS_B.minus(MAX_ACCOUNTS)
            )
        ),
        MIN_ACCOUNTS,
        MAX_ACCOUNTS
    );
    const quoteB_maxAccounts = limitBigNumberInRange(
        MAX_ACCOUNTS_B.plus(
            BigNumber.max(0,
                MAX_ACCOUNTS_A.minus(MAX_ACCOUNTS)
            )
        ),
        MIN_ACCOUNTS,
        MAX_ACCOUNTS
    );
    return {
        inAmount,
        quoteA_maxAccounts: quoteA_maxAccounts.toNumber(),
        quoteB_maxAccounts: quoteB_maxAccounts.toNumber(),
    }
}

