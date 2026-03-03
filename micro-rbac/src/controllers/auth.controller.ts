import { Request, Response } from 'express';
import * as InternalService from '../services/auth.internal.service';

export const verifyUserInternal = async (req: Request, res: Response) => {
    try {
        const userData = await InternalService.verifyAndCreateSession(req.body);
        res.json(userData);
    } catch (error: any) {
        let status = 500;
        let message = 'Internal Server Error';

        if (error.message === 'USER_NOT_FOUND') {
            status = 404;
            message = 'Akun tidak terdaftar';
        } else if (error.message === 'INVALID_PASSWORD') {
            status = 401;
            message = 'Email atau Password yang Anda masukan salah';
        } else if (error.message === 'USER_INACTIVE') {
            status = 403;
            message = 'Akun Anda dinonaktifkan. Silakan hubungi admin.';
        }

        res.status(status).json({ status: 'error', message });
    }
};

export const validateRefreshInternal = async (req: Request, res: Response) => {
    try {
        const session = await InternalService.validateAndGetSession(req.body.token);

        if (!session) {
            return res.status(401).json({
                status: 'error',
                message: 'Session invalid or expired'
            });
        }

        res.json(session);
    } catch (error: any) {
        res.status(500).json({
            status: 'error',
            message: error.message || 'Error validating session'
        });
    }
};

export const revokeTokenInternal = async (req: Request, res: Response) => {
    try {
        const { token } = req.body;
        if (!token) return res.status(400).json({ message: 'Token required' });

        await InternalService.revokeToken(token);
        res.json({ status: 'success', message: 'Token revoked' });
    } catch (error: any) {
        res.status(500).json({
            status: 'error',
            message: error.message || 'Error revoking token'
        });
    }
};