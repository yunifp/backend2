import { prisma } from '../lib/prisma';
import argon2 from 'argon2';

// Helper untuk mengambil include yang sesuai dengan Schema Baru
const authUserInclude = {
    userGroups: {
        include: {
            group: {
                include: {
                    groupMenus: {
                        where: {
                            isVisible: true // Hanya ambil menu yang diset terlihat
                        },
                        include: {
                            menu: true,
                            // Skema Baru: Ambil permissions dari tabel mapping GroupMenuPermission
                            permissions: {
                                include: {
                                    permission: true // Ambil detail dari RefPermission (code & nama)
                                }
                            }
                        }
                    }
                }
            }
        }
    }
};

/**
 * Transformasi data user dari Prisma ke format Session yang bersih
 */
const transformUserToSession = (user: any) => {
    // Mengumpulkan semua menu dari berbagai group yang dimiliki user
    const menuMap = new Map();

    user.userGroups.forEach((ugm: any) => {
        ugm.group.groupMenus.forEach((gm: any) => {
            if (!gm.menu) return;

            const existing = menuMap.get(gm.idMenu);
            // Ambil array kode permission (e.g. ["C", "R", "U"])
            const currentPerms = gm.permissions.map((p: any) => p.permission.code);

            if (existing) {
                // Jika user punya multiple group, gabungkan permission-nya (Union)
                const combined = Array.from(new Set([...existing.permissions, ...currentPerms]));
                menuMap.set(gm.idMenu, { ...existing, permissions: combined });
            } else {
                menuMap.set(gm.idMenu, {
                    menuId: gm.idMenu,
                    parent: gm.menu.parent,
                    namaMenu: gm.menu.namaMenu,
                    link: gm.menu.link,
                    linkEndpoint: gm.menu.linkEndpoint,
                    icon: gm.menu.icon,
                    urutan: gm.menu.urutan,
                    // Simpan sebagai array agar mudah di cek di frontend: perms.includes('C')
                    permissions: currentPerms,
                    // Shortcut string "CRUD" jika Anda masih membutuhkannya
                    role: currentPerms.join('')
                });
            }
        });
    });

    // Urutkan berdasarkan urutan menu
    const sortedPermissions = Array.from(menuMap.values()).sort((a, b) => (a.urutan || 0) - (b.urutan || 0));

    return {
        id: user.id,
        email: user.email,
        username: user.username,
        namaLengkap: user.namaLengkap,
        hp: user.hp,
        jabatan: user.jabatan,
        photo: user.photo,
        statusAktif: user.statusAktif,
        deviceId: user.deviceId,
        // Ini yang akan disimpan di local storage/session
        permissions: sortedPermissions
    };
};

export const verifyAndCreateSession = async (data: any) => {
    const { email, password, refreshToken } = data;

    const user = await prisma.user.findUnique({
        where: { email },
        include: authUserInclude
    });

    if (!user) throw new Error('USER_NOT_FOUND');
    if (user.statusAktif === 'N') throw new Error('USER_INACTIVE');
    if (!user.password) throw new Error('PASSWORD_NOT_SET');

    const isPasswordValid = await argon2.verify(user.password, password);
    if (!isPasswordValid) throw new Error('INVALID_PASSWORD');

    // Simpan Refresh Token ke DB
    await prisma.refreshToken.create({
        data: {
            token: refreshToken,
            userId: user.id,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
    });

    return transformUserToSession(user);
};

export const validateAndGetSession = async (token: string) => {
    const dbToken = await prisma.refreshToken.findUnique({
        where: { token },
        include: {
            user: {
                include: authUserInclude
            }
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