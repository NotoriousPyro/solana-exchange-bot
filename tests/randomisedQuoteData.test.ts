

import { getRandomizedQuoteData } from '../src/utils';

describe('getRandomizedQuoteData', () => {
    it('should return accounts to 100', () => {
        const quoteData = getRandomizedQuoteData(100_000, 1_000_000, 36, 64, 100);
        expect(quoteData.quoteA_maxAccounts + quoteData.quoteB_maxAccounts).toBe(100)
    });
})
