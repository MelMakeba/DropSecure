import { PrismaClient } from '../../generated/prisma';

async function seedCouriers() {
  const prisma = new PrismaClient();
  const fetchedCouriers = await prisma.user.findMany({
    where: { role: 'COURIER' },
  });
  for (const courier of fetchedCouriers) {
    const profile = await prisma.courierProfile.findUnique({
      where: { userId: courier.id },
    });
    if (!profile) {
      await prisma.courierProfile.create({ data: { userId: courier.id } });
    }
  }
  await prisma.$disconnect();
}
seedCouriers()
  .then(() => {
    console.log('Couriers seeded successfully!');
  })
  .catch((error) => {
    console.error('Error seeding couriers:', error);
    process.exit(1);
  });
