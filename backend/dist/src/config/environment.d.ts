/**
 * Environment configuration utility
 * Centralizes environment variable handling
 */
export declare const NODE_ENV: string;
export declare const isDevelopment: boolean;
export declare const isProduction: boolean;
export declare const isTest: boolean;
export declare const PORT: string | number;
export declare const HOST: string;
export declare const RATE_LIMIT: {
    WINDOW_MS: number;
    MAX_REQUESTS: number;
    AUTH_MAX_REQUESTS: number;
};
export declare const CORS_ORIGINS: (string | RegExp)[];
//# sourceMappingURL=environment.d.ts.map