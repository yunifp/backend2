import { prisma } from '../lib/prisma';
import argon2 from 'argon2';
import { recordAuditTrail } from '../lib/audit'; // Pastikan path ini benar

const UserService = {
    async getAll(params: { page: number; limit: number; search?: string }) {
        const { page, limit, search } = params;
        const skip = (page - 1) * limit;

        // Filter pencarian
        const where: any = search ? {
            OR: [
                { username: { contains: search } },
                { email: { contains: search } },
                { namaLengkap: { contains: search } },
            ]
        } : {};

        // Ambil data dan total count secara paralel
        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                skip,
                take: limit,
                include: { userGroups: { include: { group: true } } },
                orderBy: { id: 'desc' }
            }),
            prisma.user.count({ where })
        ]);

        const sanitized = JSON.parse(JSON.stringify(users, (k, v) => typeof v === 'bigint' ? v.toString() : v));
        return { data: sanitized, total };
    },

    async getById(id: number) {
        const user = await prisma.user.findUnique({
            where: { id },
            include: {
                userGroups: {
                    include: {
                        group: {
                            include: {
                                groupMenus: {
                                    where: { isVisible: true },
                                    include: {
                                        menu: true,
                                        permissions: {
                                            include: { permission: true }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!user) return null;

        // =========================================================
        // WAJIB: LOGIKA FLATTENING AGAR SIDEBAR FRONTEND BISA BACA
        // =========================================================
        const menuMap = new Map<number, any>();

        user.userGroups.forEach((userGroupMapping) => {
            const group = userGroupMapping.group;
            if (!group) return;

            group.groupMenus.forEach((groupMenu) => {
                if (!groupMenu.menu) return;

                const menuId = groupMenu.menu.idMenu;
                const existingMenu = menuMap.get(menuId);

                // Ekstrak kode R, C, U, D
                const actionCodes = groupMenu.permissions.map(p => p.permission.code || p.permission.nama);
                
                // Get role with type assertion or default value
                const groupMenuRole = (groupMenu as any).role || 'R';

                if (existingMenu) {
                    existingMenu.permissions = Array.from(new Set([...existingMenu.permissions, ...actionCodes]));
                    if (groupMenuRole === 'RW' || groupMenuRole === 'W') existingMenu.role = groupMenuRole;
                } else {
                    menuMap.set(menuId, {
                        menuId: menuId,
                        parent: groupMenu.menu.parent,
                        namaMenu: groupMenu.menu.namaMenu,
                        link: groupMenu.menu.link,
                        icon: groupMenu.menu.icon,
                        urutan: groupMenu.menu.urutan,
                        permissions: actionCodes,
                        role: groupMenuRole
                    });
                }
            });
        });

        const formattedPermissions = Array.from(menuMap.values());

        const { userGroups, password, passwordTemp, ...safeUser } = user as any;

        const sanitizedUser = JSON.parse(JSON.stringify(safeUser, (k, v) => typeof v === 'bigint' ? v.toString() : v));

        sanitizedUser.permissions = formattedPermissions;

        return sanitizedUser;
    },

    // PERBAIKAN: Tambahkan parameter req
    async create(req: any, data: any) {
        const { idUserGroup, ...userData } = data;
        if (userData.password) userData.password = await argon2.hash(userData.password);

        const result = await prisma.$transaction(async (tx) => {
            const user = await tx.user.create({ data: userData });

            if (idUserGroup?.length) {
                await tx.userGroupMapping.createMany({
                    data: idUserGroup.map((groupId: number) => ({ userId: user.id, idUserGroup: groupId }))
                });
            }

            // Ambil data utuh beserta relasi barunya
            return tx.user.findUnique({
                where: { id: user.id },
                include: { userGroups: { include: { group: true } } }
            });
        });

        // Hapus property password (hash) agar tidak terekspos di log audit
        const { password: _newPass, ...safeNewData } = result || {} as any;

        // CATAT AUDIT CREATE
        recordAuditTrail({
            req,
            tableName: 'sys_users', // Sesuaikan nama tabel jika berbeda (misal: 'users')
            recordId: result!.id,
            action: 'CREATE_USER',
            dbOperation: 'INSERT',
            oldData: null,
            newData: safeNewData
        });

        return result;
    },

    // PERBAIKAN: Tambahkan parameter req
    async update(req: any, id: number, data: any) {
        const { idUserGroup, ...userData } = data;
        if (userData.password) userData.password = await argon2.hash(userData.password);

        // 1. Ambil data lama sebelum diubah
        const oldUser = await prisma.user.findUnique({
            where: { id },
            include: { userGroups: true }
        });

        const result = await prisma.$transaction(async (tx) => {
            await tx.user.update({ where: { id }, data: userData });

            if (idUserGroup) {
                await tx.userGroupMapping.deleteMany({ where: { userId: id } });
                await tx.userGroupMapping.createMany({
                    data: idUserGroup.map((groupId: number) => ({ userId: id, idUserGroup: groupId }))
                });
            }

            // Ambil data utuh setelah di-update agar relasi barunya ikut terbawa
            return tx.user.findUnique({
                where: { id },
                include: { userGroups: { include: { group: true } } }
            });
        });

        // Hapus property password (hash) agar tidak terekspos di log audit
        const { password: _oldPass, ...safeOldData } = oldUser || {} as any;
        const { password: _newPass, ...safeNewData } = result || {} as any;

        // CATAT AUDIT UPDATE
        recordAuditTrail({
            req,
            tableName: 'sys_users',
            recordId: id,
            action: 'UPDATE_USER',
            dbOperation: 'UPDATE',
            oldData: safeOldData,
            newData: safeNewData
        });

        return result;
    },

    // PERBAIKAN: Tambahkan parameter req
    async delete(req: any, id: number) {
        // 1. Ambil data lama sebelum dihapus
        const oldUser = await prisma.user.findUnique({
            where: { id },
            include: { userGroups: true }
        });
        const result = await prisma.user.delete({ where: { id } });
        const { password: _oldPass, ...safeOldData } = oldUser || {} as any;
        recordAuditTrail({
            req,
            tableName: 'sys_users',
            recordId: id,
            action: 'DELETE_USER',
            dbOperation: 'DELETE',
            oldData: safeOldData,
            newData: null
        });

        return result;
    },

    async getDashboardStats() {
        const [totalActive, totalInactive, totalRoles] = await Promise.all([
            prisma.user.count({ where: { statusAktif: 'Y' } }),
            prisma.user.count({ where: { statusAktif: 'N' } }),
            prisma.userGroup.count()
        ]);

        return {
            users: {
                total: totalActive + totalInactive,
                active: totalActive,
                inactive: totalInactive
            },
            roles: {
                total: totalRoles
            }
        };
    },
};

export default UserService;