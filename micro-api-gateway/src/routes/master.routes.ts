import { Router } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { config } from '../config';
import { validateToken } from '../middlewares/auth.middleware';
import { onProxyReq, onProxyRes } from '../utils/proxyHelper';

const router = Router();

router.use('/create-profile', createProxyMiddleware({
    target: config.services.master,
    changeOrigin: true,
    on: { proxyReq: onProxyReq, proxyRes: onProxyRes },
    pathRewrite: {
        '^/': '/master/profile/create-profile',
    }
}));
router.use('/', validateToken, createProxyMiddleware({
    target: config.services.master, // http://localhost:3005
    changeOrigin: true,
    on: {
        proxyReq: onProxyReq,
        proxyRes: onProxyRes
    },
    pathRewrite: {
        '^/': '/master/',
    }
}));


export default router;