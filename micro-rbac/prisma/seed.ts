import { PrismaClient, Role, UserStatus } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting seeding process...');

    console.log('Cleaning old data...');
    await prisma.refreshToken.deleteMany({});
    await prisma.user.deleteMany({});

    const hashedPassword = await argon2.hash('Admin123#');

   console.log('Creating Admin User...');
    const admin = await prisma.user.create({
        data: {
            nim: 'ADMIN001',
            email: 'admin@system.com',
            username: 'admin',
            password: hashedPassword,
            hp: '08123456789',
            role: Role.ADMIN,
            status: UserStatus.ACTIVE 
        },
    });

    console.log('Creating Regular User...');
    await prisma.user.create({
        data: {
            nim: '1234567890',
            email: 'yunif@example.com',
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