import { PrismaClient } from '@prisma/client';
import { recordAuditTrail } from '../lib/audit'; // Pastikan path ini benar

const prisma = new PrismaClient();

const UserGroupService = {
    async getAll() {
        return await prisma.userGroup.findMany({
            include: {
                _count: {
                    select: {
                        users: true,
                        groupMenus: true
                    }
                }
            }
        });
    },

    async getByFilter(filter: any) {
        return await prisma.userGroup.findMany({
            where: filter,
            include: {
                _count: {
                    select: { users: true }
                },
                groupMenus: {
                    include: { menu: true }
                }
            },
        });
    },

    async getById(id: number) {
        return await prisma.userGroup.findUnique({
            where: { idUserGroup: id },
            include: {
                groupMenus: {
                    include: { menu: true }
                }
            }
        });
    },

    // PERBAIKAN: Tambahkan parameter req
    async create(req: any, data: any) {
        const { menuIds, ...groupData } = data;

        const result = await prisma.$transaction(async (tx) => {
            // 1. Buat Group
            const group = await tx.userGroup.create({
                data: groupData,
            });

            // 2. Jika ada menuIds, langsung mapping ke GroupMenu
            if (menuIds && Array.isArray(menuIds)) {
                await tx.groupMenu.createMany({
                    data: menuIds.map((item: { idMenu: number, role: string }) => ({
                        idUserGroup: group.idUserGroup,
                        idMenu: item.idMenu,
                        role: item.role || 'R'
                    }))
                });
            }

            // Kembalikan group beserta mapping terbarunya untuk kebutuhan response/audit
            return await tx.userGroup.findUnique({
                where: { idUserGroup: group.idUserGroup },
                include: { groupMenus: true }
            });
        });

        // CATAT AUDIT CREATE
        recordAuditTrail({
            req,
            tableName: 'ref_user_group',
            recordId: result!.idUserGroup, // result pasti ada dari tx
            action: 'CREATE_USER_GROUP',
            dbOperation: 'INSERT',
            oldData: null,
            newData: result
        });

        return result;
    },

    // PERBAIKAN: Tambahkan parameter req
    async update(req: any, id: number, data: any) {
        const { menuIds, ...groupData } = data;

        // 1. Ambil data lama sebelum diupdate
        const oldGroup = await prisma.userGroup.findUnique({
            where: { idUserGroup: id },
            include: { groupMenus: true } // Ambil mapping lama juga
        });

        const result = await prisma.$transaction(async (tx) => {
            await tx.userGroup.update({
                where: { idUserGroup: id },
                data: groupData,
            });

            if (menuIds && Array.isArray(menuIds)) {
                await tx.groupMenu.deleteMany({
                    where: { idUserGroup: id }
                });

                await tx.groupMenu.createMany({
                    data: menuIds.map((item: { idMenu: number, role: string }) => ({
                        idUserGroup: id,
                        idMenu: item.idMenu,
                        role: item.role
                    }))
                });
            }

            // Kembalikan data terbaru setelah update selesai
            return await tx.userGroup.findUnique({
                where: { idUserGroup: id },
                include: { groupMenus: true }
            });
        });

        // CATAT AUDIT UPDATE
        recordAuditTrail({
            req,
            tableName: 'ref_user_group',
            recordId: id,
            action: 'UPDATE_USER_GROUP',
            dbOperation: 'UPDATE',
            oldData: oldGroup,
            newData: result
        });

        return result;
    },

    // PERBAIKAN: Tambahkan parameter req
    async delete(req: any, id: number) {
        // 1. Ambil data lama sebelum dihapus
        const oldGroup = await prisma.userGroup.findUnique({
            where: { idUserGroup: id },
            include: { groupMenus: true }
        });

        await prisma.$transaction(async (tx) => {
            await tx.groupMenu.deleteMany({
                where: { idUserGroup: id }
            });
            await tx.userGroupMapping.deleteMany({
                where: { idUserGroup: id }
            });
            await tx.userGroup.delete({
                where: { idUserGroup: id }
            });
        });

        // CATAT AUDIT DELETE (Dipanggil setelah transaksi sukses)
        recordAuditTrail({
            req,
            tableName: 'ref_user_group',
            recordId: id,
            action: 'DELETE_USER_GROUP',
            dbOperation: 'DELETE',
            oldData: oldGroup,
            newData: null
        });

        return { success: true, message: 'User Group berhasil dihapus' };
    },
};

export default UserGroupService;