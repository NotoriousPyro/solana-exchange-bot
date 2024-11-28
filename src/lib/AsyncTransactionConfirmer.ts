import { Connection, Logs, PublicKey } from "@solana/web3.js";

export type LogsInfo = {
    logs?: Logs,
    slot: number,
};

export type LogsInfoDB = {
    get: (
        signature: string
    ) => LogsInfo | undefined,

    put: (
        signature: string,
        logsInfo: LogsInfo
    ) => Promise<boolean>,

    remove: (
        signature: string
    ) => Promise<boolean>,
}

export class ConfirmTransactionFailureError extends Error {
    constructor(signature: string) {
        super("Failed to confirm transaction:" + signature);
        this.name = "ConfirmTransactionFailure";
    }
}

export class TransactionConfirmer {
    private subscriptionId: number
    private logsInfoDB: LogsInfoDB

    constructor(
        connection: Connection,
        logInfoDB: LogsInfoDB,
        account: PublicKey,
    ) {
        this.logsInfoDB = logInfoDB
        this.subscriptionId = connection.onLogs(account,
            (logs, ctx) => {
                const info = this.logsInfoDB.get(logs.signature);
                if (info && info.slot <= ctx.slot) {
                    void this.logsInfoDB.put(logs.signature, { logs, slot: ctx.slot });
                }
            },
            "finalized"
        );
    }

    private logs = async (
        signature: string,
        minContextSlot: number = 0,
    ): Promise<LogsInfo> => {
        for (let i = 0; i < 120; i++) {
            const confirmed = this.logsInfoDB.get(signature);
            if (confirmed && confirmed.slot >= minContextSlot) {
                if (confirmed.logs) {
                    if (confirmed.logs.err) {
                        return Promise.reject(confirmed.logs);
                    }
                    if (confirmed.logs?.logs.length > 0) {
                        if (confirmed.logs?.logs.slice(-1)[0].match(/success/) !== null) {
                            return Promise.resolve(confirmed);
                        }
                        return Promise.reject(confirmed.logs);
                    }
                }
            }
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        return Promise.reject(new ConfirmTransactionFailureError(signature));
    }

    public confirm = async (
        signature: string,
        minContextSlot: number = 0,
    ): Promise<Logs> => {
        await this.logsInfoDB.put(signature, { slot: minContextSlot });
        try {
            const { logs } = await this.logs(signature, minContextSlot);
            return logs;
        }
        finally {
            void this.logsInfoDB.remove(signature);
        }
    }
}
