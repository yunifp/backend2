import axios from 'axios';
import jwt, { TokenExpiredError } from 'jsonwebtoken';

const getRbacUrl = () => process.env.RBAC_SERVICE_URL || 'http://localhost:3002';
const getAccessSecret = () => process.env.JWT_ACCESS_SECRET || 'access_secret';
const getRefreshSecret = () => process.env.JWT_REFRESH_SECRET || 'refresh_secret';
const getInternalKey = () => process.env.INTERNAL_API_KEY || 'kskjdfh23r9sdf8sdf7sdf7sdf7sdf7sdf';

const rbacClient = axios.create({
    baseURL: getRbacUrl(),
    headers: { 'Content-Type': 'application/json' }
});

rbacClient.interceptors.request.use((config) => {
    config.headers['x-internal-key'] = getInternalKey();
    return config;
});


export const login = async (identifier: string, password: string) => {
    try {
        const refreshToken = jwt.sign({ identifier }, getRefreshSecret(), { expiresIn: '7d' });
        const response = await rbacClient.post('/verify-user', {
            identifier, // Payload ini ditangkap di RBAC verifyAndCreateSession
            password,
            refreshToken
        });
        const { data: userData } = response.data;

        const accessToken = jwt.sign(
            {
                id: userData.id,
                nim: userData.nim,
                email: userData.email,
                username: userData.username,
                role: userData.role,     
                hp: userData.hp,         
            },
            getAccessSecret(),
            { expiresIn: '30m' }
        );

        return { accessToken, refreshToken, user: userData };
    } catch (error: any) {
        const errorMessage = error.response?.data?.message || 'Layanan autentikasi tidak tersedia';
        const statusCode = error.response?.status || 500;
        const customError: any = new Error(errorMessage);
        customError.status = statusCode;
        throw customError;
    }
};

export const register = async (nim: string, email: string, username: string, password: string, hp?: string) => {
    try {
        const response = await rbacClient.post('/register', {
            nim,
            email,
            username,
            password,
            hp
        });

        return response.data.data;
    } catch (error: any) {
        const errorMessage = error.response?.data?.message || 'Gagal mendaftar pengguna baru';
        const statusCode = error.response?.status || 500;
        const customError: any = new Error(errorMessage);
        customError.status = statusCode;
        throw customError;
    }
};

export const refresh = async (oldRefreshToken: string) => {
    try {
        const decoded: any = jwt.verify(oldRefreshToken, getRefreshSecret());

        const response = await rbacClient.post('/validate-refresh-token', {
            token: oldRefreshToken
        });

        const { data: userData } = response.data;

        const accessToken = jwt.sign(
            { 
                id: userData.id, 
                username: userData.username, 
                role: userData.role, 
                hp: userData.hp,
                permissions: userData.permissions || [] 
            },
            getAccessSecret(),
            { expiresIn: '20m' }
        );

        return { accessToken };
    } catch (error: any) {
        console.error("Refresh Token Error:", error.response?.data || error.message);
        throw new Error('Invalid or expired refresh token');
    }
};


export const logout = async (token: string) => {
    try {
        await rbacClient.post('/revoke-token', { token });
    } catch (error) {
        console.error("Logout Revoke Error:", error);
    }
};


export const verifyAccessToken = (token: string) => {
    try {
        return jwt.verify(token, getAccessSecret());
    } catch (error: any) {
        console.error("Access Token Verification Error:", error.message);

        if (error instanceof TokenExpiredError) {
            const expiredError: any = new Error('Token expired');
            (expiredError as any).status = 403; 
            throw expiredError;
        }
        const invalidError: any = new Error('Invalid token');
        (invalidError as any).status = 401;
        throw invalidError;
    }
};