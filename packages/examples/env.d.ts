declare global {
    namespace NodeJS {
        interface ProcessEnv {
            RING_REFRESH_TOKEN: string
            DEBUG: Boolean
        }
    }
}

export {}