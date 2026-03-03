import { prisma } from '../lib/prisma';

const GroupMenuService = {
    async getMenusByGroupId(idUserGroup: number) {
        return await prisma.groupMenu.findMany({
            where: { idUserGroup },
            include: { menu: true }
        });
    },

    async syncMenus(idUserGroup: number, menuIds: number[]) {
        return await prisma.$transaction(async (tx) => {
            await tx.groupMenu.deleteMany({
                where: { idUserGroup }
            });

            if (menuIds && menuIds.length > 0) {
                const dataToInsert = menuIds.map((idMenu: number) => ({
                    idUserGroup,
                    idMenu,
                    role: 'ALL'
                }));
                
                await tx.groupMenu.createMany({
                    data: dataToInsert
                });
            }

            return true;
        });
    },

    async assignMenu(data: any) {
        const existing = await prisma.groupMenu.findFirst({
            where: {
                idUserGroup: data.idUserGroup,
                idMenu: data.idMenu
            }
        });

        if (existing) throw new Error('MENU_ALREADY_ASSIGNED');

        return await prisma.groupMenu.create({
            data
        });
    },

    async removeMenu(idGroupMenu: number) {
        return await prisma.groupMenu.delete({
            where: { idGroupMenu }
        });
    }
};

export default GroupMenuService;