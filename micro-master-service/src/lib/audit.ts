import axios from 'axios';
import { Request } from 'express';
import { config } from '../config';

interface AuditParams {
    req: Request;
    tableName: string;
    recordId: string | number;
    action: string;
    dbOperation: 'INSERT' | 'UPDATE' | 'DELETE';
    oldData?: any;
    newData?: any;
}

const serializeBigInt = (data: any) => {
    return JSON.parse(
        JSON.stringify(data, (_, value) =>
            typeof value === 'bigint' ? value.toString() : value
        )
    );
};

export const recordAuditTrail = async (params: AuditParams) => {
    const { req, tableName, recordId, action, dbOperation, oldData, newData } = params;

    const currentPath = req.originalUrl ? req.originalUrl.split('?')[0] : req.path;

    // Siapkan kredensial untuk nembak API
    const internalApiKey = config.internalApiKey || '';
    const bearerToken = req.headers['authorization'] || '';
    const logServiceUrl = config.services.logs;

    try {
        // ==========================================
        // 1. GET CONFIG LANGSUNG DARI LOG SERVICE
        // ==========================================
        const configResponse = await axios.post(`${logServiceUrl}/logs/configs`,
            { action: 'GET_ALL', limit: 1000 },
            {
                headers: {
                    'Authorization': bearerToken,
                    'x-internal-key': internalApiKey,
                    'Content-Type': 'application/json'
                }
            }
        );

        const configs = configResponse.data?.data || [];

        // 2. LOGIKA MATCHING CONFIG
        const isLoggingEnabled = configs.some((c: any) => {
            const isActionMatch = c.action === 'ALL' || c.action === action;
            const isPathMatch = c.targetPath.endsWith('*')
                ? currentPath.startsWith(c.targetPath.replace('*', ''))
                : currentPath.replace(/\/$/, '') === c.targetPath.replace(/\/$/, '');

            return c.isActive && isActionMatch && isPathMatch;
        });

        // Jika tidak diaktifkan di config, batalkan pengiriman audit
        if (!isLoggingEnabled) {
            // console.log(`[Audit] Action ${action} pada path ${currentPath} tidak diaktifkan di config.`);
            return;
        }

        // ==========================================
        // 3. SUSUN PAYLOAD DAN KIRIM AUDIT
        // ==========================================
        const payload = {
            action: 'CREATE',
            data: {
                correlationId: req.headers['x-correlation-id'] || `audit-${Date.now()}`,
                tableName,
                recordId: recordId.toString(),
                action,
                dbOperation,
                oldData: oldData ? serializeBigInt(oldData) : null,
                newData: newData ? serializeBigInt(newData) : null,
            }
        };

        // Kirim (Fire and forget, tidak perlu di-await agar tidak nge-blok response user)
        axios.post(`${logServiceUrl}/logs/audits`, payload, {
            timeout: 3000,
            headers: {
                'Authorization': bearerToken,
                'x-internal-key': internalApiKey,
                'Content-Type': 'application/json'
            }
        }).catch(err => {
            console.error('[Audit] Gagal kirim audit ke pusat:', err.response?.data?.message || err.message);
        });

    } catch (error: any) {
        // Catch error jika gagal fetch config atau internal error lainnya
        console.error('[Audit] Internal Error atau gagal fetch Config:', error.response?.data?.message || error.message);
    }
};