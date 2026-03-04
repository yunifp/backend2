import { Request, Response } from 'express';
import * as InternalService from '../services/auth.internal.service';

export const registerInternal = async (req: Request, res: Response) => {
    try {
        const userData = await InternalService.registerUser(req.body);
        
        res.status(201).json({
            status: 'success',
            data: userData
        });
    } catch (error: any) {
        let status = 500;
        let message = 'Internal Server Error';

        if (error.message === 'USERNAME_AND_PASSWORD_REQUIRED') {
            status = 400;
            message = 'Username dan password wajib diisi';
        } else if (error.message === 'USERNAME_ALREADY_EXISTS') {
            status = 409;
            message = 'Username sudah terdaftar';
        }

        res.status(status).json({ 
            status: 'error', 
            message 
        });
    }
};

export const verifyUserInternal = async (req: Request, res: Response) => {
    try {
        const userData = await InternalService.verifyAndCreateSession(req.body);
        
        res.json({
            status: 'success',
            data: userData
        });
    } catch (error: any) {
        let status = 500;
        let message = 'Internal Server Error';
        console.log(error)

        if (error.message === 'IDENTIFIER_REQUIRED') {
            status = 400;
            message = 'Identifier (Username/Email/NIM) wajib diisi';
        } else if (error.message === 'USER_NOT_FOUND') {
            status = 404;
            message = 'Akun tidak ditemukan';
        } else if (error.message === 'INVALID_PASSWORD') {
            status = 401;
            message = 'Username atau Password yang Anda masukkan salah';
        } else if (error.message === 'USER_INACTIVE') { 
            status = 403;
            message = 'Akun Anda belum aktif atau sedang ditangguhkan. Silakan hubungi admin.';
        }

        res.status(status).json({ 
            status: 'error', 
            message 
        });
    }
};

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

