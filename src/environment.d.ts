declare global {
    namespace NodeJS {
        interface ProcessEnv {
            NODE_ENV: 'development' | 'production';
            SIGNER_KEY: string;
            BE_KEY: string;
        }
    }
}

export {}
