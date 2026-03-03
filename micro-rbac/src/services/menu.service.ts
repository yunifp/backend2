import { prisma } from '../lib/prisma';
import { recordAuditTrail } from '../lib/audit';

const MenuService = {
    async getAll(page: number = 1, limit: number = 10, search?: string) {
        const skip = (page - 1) * limit;
        const whereClause: any = {};

        if (search) {
            whereClause.OR = [
                { namaMenu: { contains: search } },
                { link: { contains: search } }
            ];
        }

        const [data, total] = await Promise.all([
            prisma.menu.findMany({
                where: whereClause,
                include: {
                    availablePermissions: {
                        include: { permission: true }
                    },
                    groupMenus: {
                        include: {
                            permissions: { include: { permission: true } }
                        }
                    }
                },
                skip,
                take: limit,
                orderBy: { urutan: 'asc' },
            }),
            prisma.menu.count({ where: whereClause })
        ]);

        return {
            data,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
        };
    },

    async getById(id: number) {
        return await prisma.menu.findUnique({
            where: { idMenu: id },
            include: {
                availablePermissions: {
                    include: { permission: true }
                },
                groupMenus: {
                    include: {
                        permissions: { include: { permission: true } }
                    }
                }
            }
        });
    },

    async create(req: any, payload: any) {
        const { permissions, ...menuData } = payload;

        const result = await prisma.$transaction(async (tx) => {
            const menu = await tx.menu.create({
                data: {
                    ...menuData,
                    urutan: Number(menuData.urutan) || 0,
                    parent: menuData.parent ? Number(menuData.parent) : null,
                }
            });

            if (permissions && Array.isArray(permissions)) {
                const refPerms = await tx.refPermission.findMany({
                    where: { code: { in: permissions } }
                });

                await tx.menuPermission.createMany({
                    data: refPerms.map(p => ({
                        idMenu: menu.idMenu,
                        idPermission: p.idPermission
                    }))
                });
            }

            return menu;
        });

        recordAuditTrail({
            req,
            tableName: 'ref_menu',
            recordId: result.idMenu,
            action: 'CREATE',
            dbOperation: 'INSERT',
            oldData: null,
            newData: result
        });

        return result;
    },

    async update(req: any, id: number, payload: any) {
        const { permissions, ...menuData } = payload;
        const oldMenu = await prisma.menu.findUnique({
            where: { idMenu: id }
        });

        const result = await prisma.$transaction(async (tx) => {
            const menu = await tx.menu.update({
                where: { idMenu: id },
                data: {
                    ...menuData,
                    urutan: menuData.urutan ? Number(menuData.urutan) : undefined,
                    parent: menuData.parent !== undefined ? (menuData.parent ? Number(menuData.parent) : null) : undefined,
                }
            });

            if (permissions && Array.isArray(permissions)) {
                const refPerms = await tx.refPermission.findMany({
                    where: { code: { in: permissions } }
                });
                const selectedPermIds = refPerms.map(p => p.idPermission);

                await tx.menuPermission.deleteMany({
                    where: {
                        idMenu: id,
                        idPermission: { notIn: selectedPermIds }
                    }
                });

                for (const permId of selectedPermIds) {
                    await tx.menuPermission.upsert({
                        where: {
                            idMenu_idPermission: { idMenu: id, idPermission: permId }
                        },
                        update: {},
                        create: { idMenu: id, idPermission: permId }
                    });
                }

                const relatedGroupMenus = await tx.groupMenu.findMany({
                    where: { idMenu: id }
                });

                for (const gm of relatedGroupMenus) {
                    await tx.groupMenuPermission.deleteMany({
                        where: {
                            idGroupMenu: gm.idGroupMenu,
                            idPermission: { notIn: selectedPermIds }
                        }
                    });
                }
            }

            return menu;
        });

        recordAuditTrail({
            req,
            tableName: 'ref_menu',
            recordId: id,
            action: 'UPDATE',
            dbOperation: 'UPDATE',
            oldData: oldMenu,
            newData: result
        });

        return result;
    },

    async delete(req: any, id: number) {
        const oldMenu = await prisma.menu.findUnique({ where: { idMenu: id } });

        const result = await prisma.menu.delete({
            where: { idMenu: id },
            include: {
                availablePermissions: {
                    include: { permission: true }
                },
                groupMenus: {
                    include: {
                        permissions: { include: { permission: true } }
                    }
                }
            },
        });

        recordAuditTrail({
            req,
            tableName: 'ref_menu',
            recordId: id,
            action: 'DELETE',
            dbOperation: 'DELETE',
            oldData: oldMenu,
            newData: null
        });

        return result;
    },

    async getAllPermissions() {
        return await prisma.refPermission.findMany({
            orderBy: { nama: 'asc' }
        });
    }
};

export default MenuService;