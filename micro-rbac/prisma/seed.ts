import { PrismaClient, Role, UserStatus } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting seeding process...');

    // 1. Bersihkan data lama
    // Penting: Hapus RefreshToken dulu karena ada relasi (Foreign Key) ke User
    console.log('Cleaning old data...');
    await prisma.refreshToken.deleteMany({});
    await prisma.user.deleteMany({});

    // 2. Buat Password Hash
    const hashedPassword = await argon2.hash('Admin123#');

    // 3. Buat User Admin
    console.log('Creating Admin User...');
    const admin = await prisma.user.create({
        data: {
            username: 'admin', // Sesuai schema baru (unique)
            password: hashedPassword,
            hp: '08123456789',
            role: Role.ADMIN,   // Menggunakan Enum dari @prisma/client
            status: UserStatus.ACTIVE // Menggunakan Enum dari @prisma/client
        },
    });

    // 4. Buat User Biasa (Opsional untuk testing)
    console.log('Creating Regular User...');
    await prisma.user.create({
        data: {
            username: 'yunif_putra',
            password: hashedPassword,
            hp: '08987654321',
            role: Role.USER,
            status: UserStatus.PENDING
        },
    });

    console.log(`✅ Seeding finished. Admin created with username: ${admin.username}`);
}

main()
    .catch((e) => {
        console.error('❌ Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });