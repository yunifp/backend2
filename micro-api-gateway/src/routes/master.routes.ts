import { Router } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { config } from '../config';
import { validateToken } from '../middlewares/auth.middleware';
import { validateAppId } from '../middlewares/app-id.middleware';
import { onProxyReq, onProxyRes } from '../utils/proxyHelper';

const router = Router();

router.use('/master', validateAppId, validateToken, createProxyMiddleware({
    target: config.services.master,
    changeOrigin: true,
    on: {
        proxyReq: onProxyReq,
        proxyRes: onProxyRes
    },
    pathRewrite: {
        '^/': '/master/'
    }
}));

export default router;