import dotenv from 'dotenv';
dotenv.config();

export const config = {
    port: process.env.PORT || 80,
    env: process.env.NODE_ENV || 'development',
    jwtAccessSecret: process.env.JWT_ACCESS_SECRET || 'access_secret',
    internalApiKey: process.env.INTERNAL_API_KEY || 'secret_internal_key',
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    services: {
        auth: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
        rbac: process.env.RBAC_SERVICE_URL || 'http://localhost:3002',
        logs: process.env.LOG_SERVICE_URL || 'http://localhost:3003',
        notification: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3004', 
        master: process.env.MASTER_SERVICE_URL || 'http://localhost:3005',
    }
};

