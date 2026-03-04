import express, { Application, Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';

dotenv.config();

import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config';
import profileRoutes from './routes/profile.routes';
import fakultasProdiRoutes from './routes/fakultas-prodi.routes';
import karirRoutes from './routes/karir.routes';
import postRoutes from './routes/post.routes';
import { createLoggerMiddleware } from './middlewares/logger.middleware';


const app: Application = express();

app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));

app.use(createLoggerMiddleware({
    serviceName: 'MASTER-SERVICE',
    logServiceUrl: `${config.services.logs}/logs/activities`,
    internalApiKey: config.internalApiKey,
    configRefreshInterval: 1 * 60 * 1000
}));

app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({ status: 'UP', service: 'Master-Service' });
});

app.use('/master', profileRoutes);
app.use('/master', fakultasProdiRoutes);
app.use('/master', karirRoutes);
app.use('/master', postRoutes);


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

const PORT = process.env.PORT || 3005;
app.listen(PORT, () => {
    console.log(`Master Berjalan pada port ${PORT}`);
    console.log(`Internal Endpoint tersedia di http://localhost:${PORT}`);
});

export default app;