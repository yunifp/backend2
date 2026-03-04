import { Router } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { config } from '../config';
import { onProxyReq, onProxyRes } from '../utils/proxyHelper';

import rbacRoutes from './rbac.routes';
import masterRoutes from './master.routes';
import notificationRoutes from './notification.routes';
import logsRoutes from './logs.routes';
import userRoutes from './user.route';
import { globalLimiter, authLimiter } from '../middlewares/rateLimiter.middleware'

const router = Router();

router.use('/auth', authLimiter, createProxyMiddleware({
    target: config.services.auth,
    changeOrigin: true,
    on: {
        proxyReq: onProxyReq,
        proxyRes: onProxyRes
    },
    pathRewrite: { '^/api/auth': '' }
}));

router.use('/users', globalLimiter, userRoutes);
router.use('/', globalLimiter, rbacRoutes);
router.use('/', globalLimiter, masterRoutes);
router.use('/', globalLimiter, notificationRoutes);
router.use('/', globalLimiter, logsRoutes);

export default router;