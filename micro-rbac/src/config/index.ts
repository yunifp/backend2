import dotenv from 'dotenv';
dotenv.config();

export const config = {
    internalApiKey: process.env.INTERNAL_API_KEY || 'secret_internal_key',
    services: {
        logs: process.env.LOGS_SERVICE_URL || 'http://localhost:3003',
        master: process.env.MASTER_SERVICE_URL || 'http://localhost:3005'
    }
};
