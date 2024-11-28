import { SimulatedTransactionResponse } from "./types";

export class TransactionError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "TransactionError";
    }
}

export class NotProfitableError extends TransactionError {
    constructor() {
        super("Not profitable");
        this.name = "NotProfitable";
    }
}

export class InvalidInstructionData extends TransactionError {
    constructor(message: string) {
        super(message);
        this.name = "InvalidInstructionData";
    }
}

export class SimulateTransactionError extends TransactionError {
    constructor(message: string) {
        super(`Failed to simulate transaction ${message}`);
        this.name = "SimulateTransactionError";
    }
}

export class SlippageToleranceExceededError extends TransactionError {
    constructor() {
        super(`Slippage tolerance exceeded`);
        this.name = "SlippageToleranceExceededError";
    }
}

export class TickArrayInvalidSequenceIndexError extends TransactionError {
    constructor() {
        super(`Invalid sequence index`);
        this.name = "TickArrayInvalidSequenceIndexError";
    }
}

export class IncorrectOracleAccountError extends TransactionError {
    constructor() {
        super(`Incorrect oracle account`);
        this.name = "IncorrectOracleAccountError";
    }
}

export class InsufficientFundsError extends TransactionError {
    simulation: SimulatedTransactionResponse;
    constructor(sim: SimulatedTransactionResponse) {
        super(`Insufficient funds`);
        this.name = "InsufficientFundsError";
        this.simulation = sim;
    }
}

export class BlockhashNotFoundError extends TransactionError {
    constructor() {
        super("Blockhash not found");
        this.name = "BlockhashNotFound";
    }
}

export class TooManyAccountLocksError extends Error {
    constructor() {
        super("Too many account locks");
        this.name = "TooManyAccountLocks";
    }
}

export class ComputationalBudgetExceededError extends Error {
    constructor() {
        super("Computational budget exceeded");
        this.name = "ComputationalBudgetExceeded";
    }
}

export class UnknownSimulationError extends Error {
    constructor(message?: string) {
        super(`Unknown simulation error ${message ? message : ""}`);
        this.name = "UnknownSimulationError";
    }
}

export class TransactionTooLargeError extends Error {
    constructor() {
        super("Transaction too large");
        this.name = "TransactionTooLarge";
    }
}

export class MemoryAllocationFailedError extends Error {
    constructor() {
        super("Memory allocation failed");
        this.name = "MemoryAllocationFailed";
    }
}

export class ConstraintRawError extends Error {
    constructor() {
        super("Constraint raw error");
        this.name = "ConstraintRawError";
    }
}

export class RequireKeysEqViolatedError extends Error {
    constructor() {
        super("Require keys eq violated");
        this.name = "RequireKeysEqViolated";
    }
}

export class BaseAndQuoteMintSameError extends Error {
    constructor() {
        super("Base and quote mint same");
        this.name = "BaseAndQuoteMintSame";
    }
}
