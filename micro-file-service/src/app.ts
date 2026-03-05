import express, { Application, Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';

dotenv.config();

import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config';
import { createLoggerMiddleware } from './middlewares/logger.middleware';
import fileRoutes from './routes/file.routes';


const app: Application = express();

app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));

// app.use(createLoggerMiddleware({
//     serviceName: 'FILE-SERVICE',
//     logServiceUrl: `${config.services.logs}/logs/activities`,
//     internalApiKey: config.internalApiKey,
//     configRefreshInterval: 1 * 60 * 1000
// }));

app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({ status: 'UP', service: 'File-Service' });
});

app.use('/file', fileRoutes);

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

const PORT = process.env.PORT || 3006;
app.listen(PORT, () => {
    console.log(`File Service Berjalan pada port ${PORT}`);
    console.log(`Internal Endpoint tersedia di http://localhost:${PORT}`);
});

export default app;