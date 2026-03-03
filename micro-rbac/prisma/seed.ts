import { PrismaClient, Role, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const saltRounds = 10;
  const hashedAdminPassword = await bcrypt.hash('admin123', saltRounds);
  const hashedUserPassword = await bcrypt.hash('user123', saltRounds);

  console.log('Sedang membersihkan database...');
  await prisma.user.deleteMany();

  console.log('Memulai seeding data pengguna...');

  const admin = await prisma.user.create({
    data: {
      username: 'admin@system.com',
      password: hashedAdminPassword,
      phoneNumber: '081234567890',
      role: Role.ADMIN,
      status: UserStatus.ACTIVE,
    },
  });

  // 3. Buat User Biasa (Contoh pakai NIM)
  const student = await prisma.user.create({
    data: {
      username: '202410001', // Contoh NIM
      password: hashedUserPassword,
      phoneNumber: '08987654321',
      role: Role.USER,
      status: UserStatus.ACTIVE,
    },
  });

  // 4. Buat User Pending (Untuk testing flow approval)
  await prisma.user.create({
    data: {
      username: 'newuser@mail.com',
      password: hashedUserPassword,
      phoneNumber: '08551234567',
      role: Role.USER,
      status: UserStatus.PENDING,
    },
  });

  console.log({ admin, student });
  console.log('Seeding selesai!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 