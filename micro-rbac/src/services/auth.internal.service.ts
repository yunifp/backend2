import { prisma } from '../lib/prisma';
import argon2 from 'argon2';
import { User } from '@prisma/client';

export const verifyAndCreateSession = async (data: any) => {
    const { identifier, password, refreshToken } = data;

    if (!identifier) throw new Error('IDENTIFIER_REQUIRED');

    const user = await prisma.user.findFirst({
        where: {
            OR: [
                { username: identifier },
                { email: identifier },
                { nim: identifier }
            ]
        },
    });

    if (!user) throw new Error('USER_NOT_FOUND');
    if (user.status !== 'ACTIVE') throw new Error('USER_INACTIVE');
    
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

const transformUserToSession = (user: User) => {
    return {
        id: user.id,
        nim: user.nim ?? '',
        email: user.email ?? '',
        username: user.username ?? '', 
        hp: user.hp ?? '',
        role: user.role, 
        status: user.status, 
        createdAt: user.createdAt,
    };
};

export const registerUser = async (data: any) => {
    const { nim, email, username, password, hp } = data;
    
    if (!nim || !email || !username || !password) {
        throw new Error('REQUIRED_FIELDS_MISSING');
    }

    const existingUser = await prisma.user.findFirst({
        where: {
            OR: [
                { username },
                { email },
                { nim }
            ]
        },
    });

    if (existingUser) {
        if (existingUser.username === username) throw new Error('USERNAME_ALREADY_EXISTS');
        if (existingUser.email === email) throw new Error('EMAIL_ALREADY_EXISTS');
        if (existingUser.nim === nim) throw new Error('NIM_ALREADY_EXISTS');
    }

    const hashedPassword = await argon2.hash(password);
    const newUser = await prisma.user.create({
        data: {
            nim,
            email,
            username,
            password: hashedPassword,
            hp: hp || null
        }
    });

    return transformUserToSession(newUser);
};

export const validateAndGetSession = async (token: string) => {
    const dbToken = await prisma.refreshToken.findUnique({
        where: { token },
        include: { user: true }
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