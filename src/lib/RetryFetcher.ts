import * as nodeFetch from 'node-fetch';
import {default as fetchRetry} from 'fetch-retry'
import https from 'https';
import http from 'http';

export const fetch = fetchRetry(nodeFetch.default);
type FetchFn = typeof nodeFetch.default;
export type Fetcher = (...args: Parameters<FetchFn>) => ReturnType<FetchFn>;
export const RetryFetcher: Fetcher = (...args) => {
    const [url, init] = args;
    return fetch(url, {
        ...init,
        retries: 3,
        retryDelay: function (attempt, __error, __response) {
            return Math.pow(2, attempt) * 100;
        },
        retryOn: function (attempt, __error, response) {
            if (response?.status === 200) return false;
            if (response?.status === 400) return false;
            if (response?.status === 429) return false;
            if (attempt <= 3) return true;
            return false;
        }
    });
}
export type FetcherWithCustomAgent = (agent: https.Agent | http.Agent) => Fetcher;
export const FetcherWithCustomAgent: FetcherWithCustomAgent = (agent: https.Agent | http.Agent) => {
    const fetcher: Fetcher = (...args) => {
        const [url, init] = args;
        return RetryFetcher(url, {
            ...init,
            agent
        })
    }
    return fetcher;
}
