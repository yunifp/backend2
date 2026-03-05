import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import jwt from 'jsonwebtoken';

interface LoggerOptions {
    serviceName: string;
    logServiceUrl: string;
    internalApiKey: string;
    configRefreshInterval?: number;
}

let cachedConfigs: any[] = [];
let lastFetchTime = 0;

export const createLoggerMiddleware = (options: LoggerOptions) => {
    const { serviceName, logServiceUrl, internalApiKey, configRefreshInterval = 5 * 60 * 1000 } = options;

    const fetchConfigs = async (bearerToken: string) => {
        try {
            const configUrl = logServiceUrl.replace('/activities', '/configs');
            const response = await axios.post(configUrl,
                { action: 'GET_ALL', limit: 1000 },
                {
                    headers: {
                        'Authorization': bearerToken,
                        'x-internal-key': internalApiKey
                    }
                }
            );

            if (response.data?.success) {
                cachedConfigs = response.data.data.filter((c: any) =>
                    c.isActive === true && (c.serviceName === serviceName || c.scope === 'GLOBAL')
                );
                lastFetchTime = Date.now();
                console.log(`[Logger] Config refreshed. Active rules: ${cachedConfigs.length}`);
            }
        } catch (error: any) {
            console.error('[Logger] Gagal memuat konfigurasi log:', error.message);
        }
    };

    return async (req: Request, res: Response, next: NextFunction) => {
        const currentToken = req.headers['authorization'] || '';

        // 1. Refresh cache jika kosong atau sudah kedaluwarsa
        if (cachedConfigs.length === 0 || Date.now() - lastFetchTime > configRefreshInterval) {
            if (currentToken) {
                fetchConfigs(currentToken);
            }
        }

        // 2. Ekstrak identitas request
        const currentPath = req.originalUrl ? req.originalUrl.split('?')[0] : req.path;
        const method = req.method;
        const action = req.body?.action || 'REST_CALL';

        // 3. Cek apakah request ini masuk dalam aturan log
        const matchedConfig = cachedConfigs.find(c => {
            const isMethodMatch = c.method === 'ALL' || c.method === method;
            const isActionMatch = c.action === 'ALL' || c.action === action;
            const isPathMatch = c.targetPath.endsWith('*')
                ? currentPath.startsWith(c.targetPath.replace('*', ''))
                : currentPath.replace(/\/$/, '') === c.targetPath.replace(/\/$/, '');

            return isMethodMatch && isActionMatch && isPathMatch;
        });

        if (!matchedConfig) return next();

        // 4. Ekstrak User (Aman dari TypeScript Error berkat type casting 'any')
        let decodedUser = (req as any).user;

        // Jika middleware dipasang di Gateway (req.user kosong), decode manual dari token
        if (!decodedUser && currentToken.startsWith('Bearer ')) {
            try {
                const tokenPart = currentToken.split(' ')[1];
                const decoded = jwt.decode(tokenPart) as any;
                if (decoded) {
                    decodedUser = {
                        id: decoded.id || decoded.userId || decoded.sub,
                        email: decoded.email,
                        namaLengkap: decoded.namaLengkap || decoded.name || decoded.username
                    };
                }
            } catch (e) {
                console.warn('[Logger] Gagal decode token JWT:', e instanceof Error ? e.message : e);
            }
        }

        // 5. Intercept Response
        const startTime = Date.now();
        const originalSend = res.send;
        let responseBody: any = undefined;

        if (matchedConfig.logResponse) {
            res.send = function (body: any) {
                responseBody = body;
                return originalSend.apply(this, arguments as any);
            };
        }

        // 6. Listener ketika response selesai dikirim ke client
        res.on('finish', () => {
            const durationMs = Date.now() - startTime;

            let parsedResponse = responseBody;
            if (typeof responseBody === 'string') {
                try { parsedResponse = JSON.parse(responseBody); } catch (e) { }
            }

            // Normalisasi IPv6 ke IPv4 untuk localhost
            let clientIp =
                req.headers['x-forwarded-for']?.toString().split(',')[0].trim() ||
                req.socket.remoteAddress ||
                req.ip ||
                'UNKNOWN';

            if (clientIp === '::1' || clientIp === '::ffff:127.0.0.1') {
                clientIp = '127.0.0.1';
            }

            // Susun Payload
            const logPayload = {
                action: 'CREATE',
                data: {
                    correlationId: req.headers['x-correlation-id'] || `req-${Date.now()}`,
                    serviceOrigin: serviceName,
                    userId: decodedUser?.id?.toString() || null,
                    username: decodedUser?.email || decodedUser?.namaLengkap || 'GUEST',
                    clientIp: clientIp,
                    userAgent: req.headers['user-agent'] || 'UNKNOWN',
                    endpoint: currentPath,
                    method: method,
                    actionName: action,
                    httpStatus: res.statusCode,
                    durationMs: durationMs,
                    requestData: matchedConfig.logPayload ? req.body : null,
                    responseData: matchedConfig.logResponse ? parsedResponse : null,
                }
            };

            // Kirim ke Log Service secara Asinkronus
            axios.post(logServiceUrl, logPayload, {
                timeout: 3000,
                headers: {
                    'Authorization': currentToken,
                    'x-internal-key': internalApiKey,
                    'Content-Type': 'application/json'
                }
            }).catch((err: Error) => console.error('[Logger] Gagal mengirim log ke pusat:', err.message));
        });

        next();
    };
};

export const getCachedConfigs = () => cachedConfigs;