/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/no-misused-promises */
import { PrismaClient } from '../../generated/prisma';
const prisma = new PrismaClient();

async function main() {
  await prisma.pricingRule.create({
    data: {
      name: 'Standard 0-5kg',
      minWeight: 0,
      maxWeight: 5,
      baseCost: 100,
      costPerKg: 50,
      costPerKm: 0, // Set appropriate value
      weightMultiplier: 1, // Set appropriate value
      distanceMultiplier: 1, // Set appropriate value
      isActive: true,
    },
  });
}

main().finally(() => prisma.$disconnect());
