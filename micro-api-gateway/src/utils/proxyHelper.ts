// src/utils/proxyHelper.ts
import { fixRequestBody } from 'http-proxy-middleware';
import { config } from '../config';

export const onProxyRes = (proxyRes: any, req: any, res: any) => {
    delete proxyRes.headers['access-control-allow-origin'];
    delete proxyRes.headers['access-control-allow-credentials'];
    delete proxyRes.headers['access-control-allow-methods'];
    delete proxyRes.headers['access-control-allow-headers'];

    res.setHeader('Access-Control-Allow-Origin', "*");
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-app-id');
};

export const onProxyReq = (proxyReq: any, req: any, res: any) => {
    proxyReq.setHeader('x-internal-key', config.internalApiKey);
    if (req.body) {
        fixRequestBody(proxyReq, req);
    }
};