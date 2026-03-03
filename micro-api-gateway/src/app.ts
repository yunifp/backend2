import express from 'express';
import dotenv from 'dotenv';
dotenv.config();

import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import compression from 'compression';
import { config } from './config';
import routes from './routes';
import { validateAppId } from './middlewares/app-id.middleware';
import {globalLimiter} from './middlewares/rateLimiter.middleware'

import { createLoggerMiddleware } from './middlewares/logger.middleware';

const app = express();

app.use(cors({
    origin: config.corsOrigin,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-app-id'],
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(compression());
app.use(morgan('dev', {
    skip: (req, res) => res.statusCode < 400
}));

app.use(createLoggerMiddleware({
    serviceName: 'API-GATEWAY',
    logServiceUrl: `${config.services.logs}/logs/activities`,
    internalApiKey: config.internalApiKey,
    configRefreshInterval: 1 * 60 * 1000
}));

app.use(globalLimiter);
app.use('/api', validateAppId, routes);

app.listen(config.port, () => {
    console.log(`🛡️  API Gateway berjalan di ${config.env} mode on port ${config.port}`);
});