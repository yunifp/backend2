import { Router } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { config } from '../config';
import { validateToken } from '../middlewares/auth.middleware';
import { validateAppId } from '../middlewares/app-id.middleware';
import { onProxyReq, onProxyRes } from '../utils/proxyHelper';

const router = Router();

router.use('/', validateAppId, validateToken, createProxyMiddleware({
    target: config.services.rbac,
    changeOrigin: true,
    on: {
        proxyReq: onProxyReq,
        proxyRes: onProxyRes
    },
    pathRewrite: {
        '^/': ''
    }
}));

router.use('/users/get-by-id', validateAppId, validateToken, createProxyMiddleware({
    target: config.services.rbac,
    changeOrigin: true,
    on: {
        proxyReq: onProxyReq,
        proxyRes: onProxyRes
    },
    pathRewrite: {
        '^/': '/get-by-id/'
    }
}));




export default router;