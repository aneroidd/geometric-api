import 'dotenv/config';
export declare const env: {
    DATABASE_URL: string;
    JWT_SECRET: string;
    JWT_EXPIRES_IN: string;
    JWT_REFRESH_EXPIRES_IN: string;
    PORT: number;
    NODE_ENV: "development" | "production" | "test";
    CORS_ORIGIN: string;
};
