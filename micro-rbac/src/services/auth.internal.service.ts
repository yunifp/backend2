import { prisma } from '../lib/prisma';
import argon2 from 'argon2';
import { User } from '@prisma/client'; // Import type User dari Prisma

const transformUserToSession = (user: User) => {
    return {
        id: user.id,
        username: user.username ?? '', 
        hp: user.hp ?? '',
        role: user.role, 
        status: user.status, 
        createdAt: user.createdAt,
    };
};
export const validateAndGetSession = async (token: string) => {
    const dbToken = await prisma.refreshToken.findUnique({
        where: { token },
        include: {
            user: true
        }
    });

    if (!dbToken || dbToken.expiresAt < new Date()) {
        if (dbToken) await prisma.refreshToken.delete({ where: { id: dbToken.id } });
        return null;
    }

    return transformUserToSession(dbToken.user);
};

export const revokeToken = async (token: string) => {
    return await prisma.refreshToken.deleteMany({ where: { token } });
};
export const verifyAndCreateSession = async (data: any) => {
    const { username, password, refreshToken } = data;

    if (!username) throw new Error('USERNAME_REQUIRED');

    const user = await prisma.user.findUnique({
        where: { username },
    });

    if (!user) throw new Error('USER_NOT_FOUND');
    
    // Sesuaikan dengan enum UserStatus: ACTIVE (bukan 'Y' atau 'N')
    if (user.status !== 'ACTIVE') throw new Error('USER_INACTIVE');
    
    // Verifikasi password (pastikan password di DB tidak null)
    const isPasswordValid = await argon2.verify(user.password, password);
    if (!isPasswordValid) throw new Error('INVALID_PASSWORD');

    await prisma.refreshToken.create({
        data: {
            token: refreshToken,
            userId: user.id,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
    });

    return transformUserToSession(user);
};