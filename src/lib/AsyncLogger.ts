import { Console } from "node:console";

type LogLevel = "INFO" | "ERROR" | "WARN" | "DEBUG" | "TRACE";

/** Asynchronous Promise-based logger */
export default class AsyncLogger extends Console {
    public name: string;
    constructor(name: string) {
        super({
            stdout: process.stdout,
            stderr: process.stderr,
            ignoreErrors: true,  // Ignore errors writing to the stream
        });
        this.name = name;
    }
    private formatMessage = (level: LogLevel, message: string) => `[${new Date().toISOString()}] [${level}] [${this.name}]: ${message}`;
    public override info: Console["info"] = (...args) =>
        new Promise((resolve, __) => {
            resolve(void 0);
            const [message, ...rest] = args;
            const formattedMessage = this.formatMessage('INFO', message);
            rest.length > 0
                ? console.info(formattedMessage, ...rest)
                : console.info(formattedMessage);
            return;
        });
    public override log: Console["log"] = async (...args) =>
        new Promise((resolve, __) => {
            resolve(void 0);
            const [message, ...rest] = args;
            const formattedMessage = this.formatMessage('INFO', message);
            rest.length > 0
                ? console.log(formattedMessage, ...rest)
                : console.log(formattedMessage);
            return;
        });
    public override error: Console["error"] = async (...args) =>
        new Promise((resolve, __) => {
            resolve(void 0);
            const [message, ...rest] = args;
            const formattedMessage = this.formatMessage('ERROR', message);
            rest.length > 0
                ? console.error(formattedMessage, ...rest)
                : console.error(formattedMessage);
            return;
        });
    public override warn: Console["warn"] = async (...args) =>
        new Promise((resolve, __) => {
            resolve(void 0);
            const [message, ...rest] = args;
            const formattedMessage = this.formatMessage('WARN', message);
            rest.length > 0
                ? console.warn(formattedMessage, ...rest)
                : console.warn(formattedMessage);
            return;
        });
    public override debug: Console["debug"] = async (...args) =>
        new Promise((resolve, __) => {
            resolve(void 0);
            if (process.env.NODE_ENV === 'production' || process.env.DEBUG !== 'true') return;
            const [message, ...rest] = args;
            const formattedMessage = this.formatMessage('DEBUG', message);
            rest.length > 0
                ? console.debug(formattedMessage, ...rest)
                : console.debug(formattedMessage);
            return;
        });
    public override trace: Console["trace"] = async (...args) =>
        new Promise((resolve, __) => {
            resolve(void 0);
            if (process.env.NODE_ENV === 'production' || process.env.TRACE !== 'true') return;
            const [message, ...rest] = args;
            const formattedMessage = this.formatMessage('TRACE', message);
            rest.length > 0
                ? console.trace(formattedMessage, ...rest)
                : console.trace(formattedMessage);
            return;
        });
}
