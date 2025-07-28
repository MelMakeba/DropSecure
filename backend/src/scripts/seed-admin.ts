/* eslint-disable @typescript-eslint/no-misused-promises */
import { PrismaClient } from '../../generated/prisma';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seedAdmin() {
  const adminEmail = 'melissamakeba@gmail.com';
  const existing = await prisma.user.findFirst({
    where: { email: adminEmail, role: 'ADMIN' },
  });
  if (existing) {
    console.log('Admin already exists.');
    return;
  }
  const hashed = await bcrypt.hash('admin123', 10);
  await prisma.user.create({
    data: {
      email: adminEmail,
      password: hashed,
      firstName: 'Super',
      lastName: 'Admin',
      phone: '+254113066448',
      role: 'ADMIN',
      isEmailVerified: true,
      isActive: true,
    },
  });
  console.log('Admin seeded!');
}

seedAdmin()
  .catch((e) => {
    console.error('Error seeding admin:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
