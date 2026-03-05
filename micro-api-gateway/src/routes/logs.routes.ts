import { Router } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { config } from '../config';
import { validateToken } from '../middlewares/auth.middleware';
import { validateAppId } from '../middlewares/app-id.middleware';
import { onProxyReq, onProxyRes } from '../utils/proxyHelper';

const router = Router();

router.use('/configs', validateAppId, validateToken, createProxyMiddleware({
    target: config.services.logs,
    changeOrigin: true,
    on: {
        proxyReq: onProxyReq,
        proxyRes: onProxyRes
    },
    pathRewrite: {
        '^/': '/logs/configs/'
    }
}));

router.use('/activities', validateAppId, validateToken, createProxyMiddleware({
    target: config.services.logs,
    changeOrigin: true,
    on: {
        proxyReq: onProxyReq,
        proxyRes: onProxyRes
    },
    pathRewrite: {
        '^/': '/logs/activities/'
    }
}));

router.use('/audits', validateAppId, validateToken, createProxyMiddleware({
    target: config.services.logs,
    changeOrigin: true,
    on: {
        proxyReq: onProxyReq,
        proxyRes: onProxyRes
    },
    pathRewrite: {
        '^/': '/logs/audits/'
    }
}));

router.use('/services', validateAppId, validateToken, createProxyMiddleware({
    target: config.services.logs,
    changeOrigin: true,
    on: {
        proxyReq: onProxyReq,
        proxyRes: onProxyRes
    },
    pathRewrite: {
        '^/': '/logs/services/'
    }
}));

export default router;