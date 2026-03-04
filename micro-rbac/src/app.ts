import express, { Application, Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';

dotenv.config();

import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config';
import internalRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import { createLoggerMiddleware } from './middlewares/logger.middleware';


const app: Application = express();

app.use(helmet());
app.use(morgan('dev', {
    skip: (req, res) => res.statusCode < 400
}));
app.use(express.json());

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));

app.use(createLoggerMiddleware({
    serviceName: 'RBAC-SERVICE',
    logServiceUrl: `${config.services.logs}/logs/activities`,
    internalApiKey: config.internalApiKey,
    configRefreshInterval: 1 * 60 * 1000
}));

app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({ status: 'UP', service: 'RBAC-Service' });
});

app.use('/', internalRoutes);
app.use('/users', userRoutes);



app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error(`[Error] ${err.message}`);

    const statusCode = err.status || 500;
    res.status(statusCode).json({
        status: 'error',
        message: err.message || 'Internal Server Error',
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });
});

(BigInt.prototype as any).toJSON = function () {
    return this.toString();
};

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
    console.log(`RBAC Berjalan pada port ${PORT}`);
    console.log(`Internal Endpoint tersedia di http://localhost:${PORT}`);
});

export default app;