import { Connection } from "@solana/web3.js";
import AsyncLogger from "./AsyncLogger";
import BigNumber from "bignumber.js";

/**
 * mostly deprecated and replaced with a simple LRU cache
 */
export class RecentBlockhashManager {
    private connection: Connection;
    private logger = new AsyncLogger("RecentBlockhashManager");

    private __blockhashFetchTime: number = 0;

    private __recentBlockhash: string = "";
    public getBlockhash() {
        return this.__recentBlockhash;
    }

    private __lastValidBlockheight: number = 0;
    public getLastValidBlockheight() {
        return this.__lastValidBlockheight;
    }

    private __blockHeight: number = 0;
    public getBlockheight() {
        return this.__blockHeight;
    }

    private __slot: number = 0;
    public getSlot() {
        return this.__slot;
    }

    private isInvalid() {
        return this.__recentBlockhash === "" || this.isExpired();
    }

    private isExpired() { // this is some kind of weird sweet spot that works well, idk why
        return this.__lastValidBlockheight - 25 > this.__blockHeight || new BigNumber(Date.now() - 1000 * 15).isGreaterThanOrEqualTo(this.__blockhashFetchTime);
    }

    public async signalBlockhashNotFound() {
        if (!this.__blockhashUpdateLock) {
            await this.__updateBlockhash();
        }
    }

    private updateBlockhashInfo(blockhash: string, lastValidBlockheight: number, slot: number) {
        this.__recentBlockhash = blockhash;
        this.__lastValidBlockheight = lastValidBlockheight;
        this.__blockhashFetchTime = Date.now();
        this.__slot = slot;
        this.logger.info(`Blockhash updated to ${this.__recentBlockhash}`);
    }
    

    private __blockhashUpdateLock: boolean = false;
    private async __updateBlockhash(): Promise<string> {
        if (!this.__blockhashUpdateLock) {
            this.__blockhashUpdateLock = true;
            const blockHeight = await this.connection.getBlockHeight({ commitment: 'confirmed' });
            this.__blockHeight = blockHeight;
            if (this.isInvalid()) {
                const { value: { blockhash }, context: { slot }} = await this.connection.getLatestBlockhashAndContext({ commitment: 'processed' });
                this.updateBlockhashInfo(blockhash, blockHeight, slot);
            }
            this.__blockhashUpdateLock = false;
        }
        return this.__recentBlockhash;
    }

    public run = async () => await this.__updateBlockhash();

    constructor(connection: Connection) {
        this.connection = connection;
        setInterval(() => {
            this.__updateBlockhash();
        }, 1000);
    }
}
