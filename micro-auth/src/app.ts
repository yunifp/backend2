import express from 'express';
import dotenv from 'dotenv';
dotenv.config();

import cookieParser from 'cookie-parser';
import cors from 'cors';
import authRoutes from './routes/auth.routes';

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: '*', credentials: true }));

app.use('/', authRoutes);

app.listen(3001, () => console.log(`Auth Service running on port ${process.env.PORT || 3001}`));