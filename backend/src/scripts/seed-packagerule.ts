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
      isActive: true,
    },
  });
}

main().finally(() => prisma.$disconnect());
