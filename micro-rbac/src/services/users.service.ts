import { prisma } from '../lib/prisma';
import argon2 from 'argon2';
import { recordAuditTrail } from '../lib/audit';
import { User, UserStatus } from '@prisma/client';

const UserService = {
   async getAll(params: { page: number; limit: number; search?: string; role?: string; status?: UserStatus | string }) {
        const { page, limit, search, role, status } = params;
        const skip = (page - 1) * limit;

        const where: any = {};

        if (search) {
            where.OR = [
                { username: { contains: search } },
                { email: { contains: search } },
                { nim: { contains: search } },
            ];
        }

        if (role) {
            where.role = role;
        }

        if (status) {
            where.status = status;
        }

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    nim: true,
                    email: true,
                    username: true,
                    hp: true,
                    role: true,
                    status: true,
                    createdAt: true
                }
            }),
            prisma.user.count({ where })
        ]);

        return { data: users, total };
    },

    async updateStatus(id: number, status: UserStatus) {
        const existingUser = await prisma.user.findUnique({ where: { id } });
        if (!existingUser) throw new Error('User tidak ditemukan');

        const updatedUser = await prisma.user.update({
            where: { id },
            data: { status },
            select: {
                id: true,
                username: true,
                email: true,
                status: true
            }
        });

        return updatedUser;
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