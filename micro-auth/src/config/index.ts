import dotenv from 'dotenv';
dotenv.config();

export const config = {
    port: process.env.PORT || 3002,
    env: process.env.NODE_ENV || 'development',
    jwtAccessSecret: process.env.JWT_ACCESS_SECRET || 'access_secret',
    internalApiKey: process.env.INTERNAL_API_KEY || 'secret_internal_key',
    services: {
        rbac: process.env.RBAC_SERVICE_URL || 'http://localhost:3002',
    }
};