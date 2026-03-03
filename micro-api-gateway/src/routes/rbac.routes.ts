import { Router } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { config } from '../config';
import { validateToken } from '../middlewares/auth.middleware';
import { validateAppId } from '../middlewares/app-id.middleware';
import { onProxyReq, onProxyRes } from '../utils/proxyHelper';

const router = Router();

router.use('/users', validateAppId, validateToken, createProxyMiddleware({
    target: config.services.rbac,
    changeOrigin: true,
    on: {
        proxyReq: onProxyReq,
        proxyRes: onProxyRes
    },
    pathRewrite: {
        '^/': '/users/'
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
        '^/': '/users/get-by-id/'
    }
}));

router.use('/user-groups', validateAppId, validateToken, createProxyMiddleware({
    target: config.services.rbac,
    changeOrigin: true,
    on: {
        proxyReq: onProxyReq,
        proxyRes: onProxyRes
    },
    pathRewrite: {
        '^/': '/user-groups/'
    }
}));

router.use('/roles/permissions', validateAppId, validateToken, createProxyMiddleware({
    target: config.services.rbac,
    changeOrigin: true,
    on: {
        proxyReq: onProxyReq,
        proxyRes: onProxyRes
    },
    pathRewrite: {
        '^/': '/roles/permissions/'
    }
}));

router.use('/roles/role-permissions', validateAppId, validateToken, createProxyMiddleware({
    target: config.services.rbac,
    changeOrigin: true,
    on: {
        proxyReq: onProxyReq,
        proxyRes: onProxyRes
    },
    pathRewrite: {
        '^/': '/roles/role-permissions/'
    }
}));

export default router;