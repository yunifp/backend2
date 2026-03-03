import { Request, Response } from 'express';
import * as AuthService from '../services/auth.service';



export const loginController = async (req: Request, res: Response) => {
    try {
        // Bisa ambil dari key 'identifier', 'email', atau 'username' di body frontend
        const identifier = req.body.identifier || req.body.email || req.body.username;
        const password = req.body.password;

        if (!identifier || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username/Email dan password wajib diisi'
            });
        }

        const { accessToken, refreshToken, user } = await AuthService.login(identifier, password);

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        return res.json({
            success: true,
            accessToken,
            refreshToken,
            user
        });

    } catch (error: any) {
        return res.status(error.status || 500).json({
            success: false,
            message: error.message
        });
    }
};

export const registerController = async (req: Request, res: Response) => {
    try {
        const { nim, email, username, password, hp } = req.body;

        if (!nim || !email || !username || !password) {
            return res.status(400).json({
                success: false,
                message: 'NIM, Email, Username, dan password wajib diisi'
            });
        }

        const user = await AuthService.register(nim, email, username, password, hp);

        return res.status(201).json({
            success: true,
            message: 'Registrasi berhasil, status akun PENDING',
            user
        });

    } catch (error: any) {
        return res.status(error.status || 500).json({
            success: false,
            message: error.message
        });
    }
};

export const refreshController = async (req: Request, res: Response) => {
    try {
        const token = req.cookies.refreshToken || req.body.refreshToken;
        if (!token) return res.status(401).json({ message: 'Refresh token missing' });

        const { accessToken } = await AuthService.refresh(token);
        return res.json({ success: true, accessToken });
    } catch (error: any) {
        return res.status(403).json({ success: false, message: error.message });
    }
};

export const logoutController = async (req: Request, res: Response) => {
    const token = req.cookies.refreshToken;
    if (token) await AuthService.logout(token);

    res.clearCookie('refreshToken');
    return res.json({ success: true, message: 'Logged out successfully' });
};

export const meController = async (req: Request, res: Response) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized: Missing or invalid token format'
            });
        }

        const token = authHeader.split(' ')[1];
        const userData = AuthService.verifyAccessToken(token);
        return res.json({
            success: true,
            user: userData
        });

    } catch (error: any) {
        const isExpired = error.message?.toLowerCase().includes('expired');
        const statusCode = isExpired ? 403 : 401;

        return res.status(statusCode).json({
            success: false,
            message: error.message || 'Authentication failed'
        });
    }
};

