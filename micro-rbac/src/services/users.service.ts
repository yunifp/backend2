import { prisma } from '../lib/prisma';
import argon2 from 'argon2';
import { recordAuditTrail } from '../lib/audit';
import { User, UserStatus } from '@prisma/client';

const UserService = {
    async getAll(params: { page: number; limit: number; search?: string }) {
        const { page, limit, search } = params;
        const skip = (page - 1) * limit;

       
        const where: any = search ? {
            OR: [
                { username: { contains: search } },
                { hp: { contains: search } },
            ]
        } : {};

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                skip,
                take: limit,
                orderBy: { id: 'desc' }
            }),
            prisma.user.count({ where })
        ]);

        const sanitized = users.map(({ password, ...user }) => user);
        
        return { data: sanitized, total };
    },

    async getById(id: number) {
        const user = await prisma.user.findUnique({
            where: { id }
        });

        if (!user) return null;
        const { password, ...safeUser } = user;
        
        return {
            ...safeUser,
            permissions: []
        };
    },

    async create(req: any, data: any) {
        if (data.password) {
            data.password = await argon2.hash(data.password);
        }

        const result = await prisma.user.create({ 
            data 
        });

        const { password: _p, ...safeNewData } = result;

        recordAuditTrail({
            req,
            tableName: 'users',
            recordId: result.id,
            action: 'CREATE_USER',
            dbOperation: 'INSERT',
            oldData: null,
            newData: safeNewData
        });

        return safeNewData;
    },

    async update(req: any, id: number, data: any) {
        if (data.password) {
            data.password = await argon2.hash(data.password);
        }

        const oldUser = await prisma.user.findUnique({ where: { id } });
        if (!oldUser) throw new Error('USER_NOT_FOUND');

        const result = await prisma.user.update({
            where: { id },
            data
        });

        const { password: _oldPass, ...safeOldData } = oldUser;
        const { password: _newPass, ...safeNewData } = result;

        recordAuditTrail({
            req,
            tableName: 'users',
            recordId: id,
            action: 'UPDATE_USER',
            dbOperation: 'UPDATE',
            oldData: safeOldData,
            newData: safeNewData
        });

        return safeNewData;
    },

    async delete(req: any, id: number) {
        const oldUser = await prisma.user.findUnique({ where: { id } });
        if (!oldUser) throw new Error('USER_NOT_FOUND');

        const result = await prisma.user.delete({ where: { id } });

        const { password: _p, ...safeOldData } = oldUser;
        
        recordAuditTrail({
            req,
            tableName: 'users',
            recordId: id,
            action: 'DELETE_USER',
            dbOperation: 'DELETE',
            oldData: safeOldData,
            newData: null
        });

        return result;
    },

    async getDashboardStats() {
        const [active, pending, deactivated] = await Promise.all([
            prisma.user.count({ where: { status: UserStatus.ACTIVE } }),
            prisma.user.count({ where: { status: UserStatus.PENDING } }),
            prisma.user.count({ where: { status: UserStatus.DEACTIVATED } }),
        ]);

        return {
            users: {
                total: active + pending + deactivated,
                active,
                pending,
                deactivated
            }
        };
    },
};

export default UserService;