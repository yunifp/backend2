import { Request, Response } from 'express';
import * as InternalService from '../services/auth.internal.service';

/**
 * Controller untuk verifikasi login dan pembuatan session
 */
export const verifyUserInternal = async (req: Request, res: Response) => {
    try {
        // Pastikan req.body mengandung username, password, dan refreshToken
        const userData = await InternalService.verifyAndCreateSession(req.body);
        
        res.json({
            status: 'success',
            data: userData
        });
    } catch (error: any) {
        let status = 500;
        let message = 'Internal Server Error';

        // Sesuaikan dengan Error Throw yang ada di Service terbaru
        if (error.message === 'USERNAME_REQUIRED') {
            status = 400;
            message = 'Username wajib diisi';
        } else if (error.message === 'USER_NOT_FOUND') {
            status = 404;
            message = 'Akun tidak ditemukan';
        } else if (error.message === 'INVALID_PASSWORD') {
            status = 401;
            // Pesan dibuat umum untuk keamanan (Security Best Practice)
            message = 'Username atau Password yang Anda masukkan salah';
        } else if (error.message === 'USER_INACTIVE_OR_PENDING') {
            status = 403;
            message = 'Akun Anda belum aktif atau sedang ditangguhkan. Silakan hubungi admin.';
        }

        res.status(status).json({ 
            status: 'error', 
            message 
        });
    }
};

/**
 * Controller untuk validasi Refresh Token (Session)
 */
export const validateRefreshInternal = async (req: Request, res: Response) => {
    try {
        const { token } = req.body;
        
        if (!token) {
            return res.status(400).json({
                status: 'error',
                message: 'Token is required'
            });
        }

        const session = await InternalService.validateAndGetSession(token);

        if (!session) {
            return res.status(401).json({
                status: 'error',
                message: 'Sesi telah berakhir, silakan login kembali'
            });
        }

        res.json({
            status: 'success',
            data: session
        });
    } catch (error: any) {
        res.status(500).json({
            status: 'error',
            message: error.message || 'Terjadi kesalahan saat validasi sesi'
        });
    }
};

/**
 * Controller untuk Logout / Revoke Token
 */
export const revokeTokenInternal = async (req: Request, res: Response) => {
    try {
        const { token } = req.body;
        
        if (!token) {
            return res.status(400).json({ 
                status: 'error',
                message: 'Token is required' 
            });
        }

        await InternalService.revokeToken(token);
        
        res.json({ 
            status: 'success', 
            message: 'Berhasil logout' 
        });
    } catch (error: any) {
        res.status(500).json({
            status: 'error',
            message: error.message || 'Gagal menghapus sesi'
        });
    }
};