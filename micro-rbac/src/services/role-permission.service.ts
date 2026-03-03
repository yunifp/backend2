import { PrismaClient } from '@prisma/client';
import { recordAuditTrail } from '../lib/audit';

const prisma = new PrismaClient();

export class RolePermissionService {
    // 1. Ambil SEMUA daftar Group
    async getAllGroups() {
        return await prisma.userGroup.findMany({
            orderBy: { idUserGroup: 'asc' }
        });
    }

    // 2. Buat Group Baru
    async createUserGroup(req: any, namaUserGroup: string) {
        const result = await prisma.userGroup.create({
            data: { namaUserGroup }
        });

        recordAuditTrail({
            req,
            tableName: 'ref_user_group',
            recordId: result.idUserGroup,
            action: 'CREATE_GROUP',
            dbOperation: 'INSERT',
            oldData: null,
            newData: result
        });

        return result;
    }

    // 3. Update Nama Group
    async updateUserGroup(req: any, idUserGroup: number, namaUserGroup: string) {
        const oldData = await prisma.userGroup.findUnique({
            where: { idUserGroup }
        });

        const result = await prisma.userGroup.update({
            where: { idUserGroup },
            data: { namaUserGroup }
        });

        recordAuditTrail({
            req,
            tableName: 'ref_user_group',
            recordId: idUserGroup,
            action: 'UPDATE_GROUP',
            dbOperation: 'UPDATE',
            oldData,
            newData: result
        });

        return result; // PERBAIKAN: Tambahkan return agar tidak undefined di controller
    }

    // 4. Hapus Group
    async deleteUserGroup(req: any, idUserGroup: number) {
        const oldData = await prisma.userGroup.findUnique({
            where: { idUserGroup }
        });

        // Eksekusi hapus di database dulu
        const result = await prisma.$transaction(async (tx) => {
            // Hapus mapping menu & permission dulu jika tidak di-set cascade di DB
            await tx.groupMenu.deleteMany({ where: { idUserGroup } });
            return await tx.userGroup.delete({ where: { idUserGroup } });
        });

        // PERBAIKAN: Audit dikirim SETELAH transaksi sukses
        recordAuditTrail({
            req,
            tableName: 'ref_user_group',
            recordId: idUserGroup,
            action: 'DELETE_GROUP',
            dbOperation: 'DELETE',
            oldData,
            newData: null
        });

        return result;
    }

    // 5. Ambil Konfigurasi Role
    async getRoleConfig(idUserGroup: number) {
        // 1. Ambil SEMUA Menu & Permission yang tersedia untuk menu tersebut (MASTER)
        const masterMenus = await prisma.menu.findMany({
            orderBy: { urutan: 'asc' },
            include: {
                availablePermissions: {
                    include: {
                        permission: true
                    }
                }
            }
        });

        // 2. Ambil KONFIGURASI saat ini untuk Group tersebut (MAPPING)
        const currentMapping = await prisma.groupMenu.findMany({
            where: { idUserGroup },
            include: {
                permissions: {
                    select: { idPermission: true }
                }
            }
        });

        return {
            masterMenus,
            currentMapping
        };
    }

    // 6. Simpan Mapping (Transaction)
    async updateRoleMenuConfig(req: any, idUserGroup: number, menuConfigs: any[]) {
        // PERBAIKAN: Ambil data lama sebelum mapping dihapus
        const oldMapping = await prisma.groupMenu.findMany({
            where: { idUserGroup },
            include: { permissions: true } // Ambil relasi permission-nya juga
        });

        // Eksekusi Perubahan Mapping
        const result = await prisma.$transaction(async (tx) => {
            await tx.groupMenu.deleteMany({
                where: { idUserGroup }
            });

            for (const config of menuConfigs) {
                if (config.permissionIds && config.permissionIds.length > 0) {
                    const groupMenu = await tx.groupMenu.create({
                        data: {
                            idUserGroup,
                            idMenu: config.idMenu,
                            isVisible: config.isVisible !== undefined ? config.isVisible : true
                        }
                    });

                    await tx.groupMenuPermission.createMany({
                        data: config.permissionIds.map((pId: number) => ({
                            idGroupMenu: groupMenu.idGroupMenu,
                            idPermission: pId
                        }))
                    });
                }
            }
            return { success: true };
        });

        // PERBAIKAN: Ambil data baru setelah mapping disimpan
        const newMapping = await prisma.groupMenu.findMany({
            where: { idUserGroup },
            include: { permissions: true }
        });

        // Catat Audit Trail
        recordAuditTrail({
            req,
            tableName: 'sys_group_menus', // Nama logis untuk gabungan tabel mapping ini
            recordId: idUserGroup, // Gunakan ID Group sebagai referensi record-nya
            action: 'SAVE_MAPPING',
            dbOperation: 'UPDATE', // Terhitung sebagai Update karena mengganti mapping lama
            oldData: oldMapping,
            newData: newMapping
        });

        return result;
    }
}