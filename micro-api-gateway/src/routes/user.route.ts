import { Router } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { config } from '../config';
import { onProxyReq, onProxyRes } from '../utils/proxyHelper';

const router = Router();

router.use('/', createProxyMiddleware({
    target: config.services.rbac || 'http://localhost:3002',
    changeOrigin: true,
    pathRewrite: { '^/api/users': '/users' },
    on: {
        proxyReq: onProxyReq,
        proxyRes: onProxyRes
      }
}));

export default router;