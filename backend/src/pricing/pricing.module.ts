import { Module } from '@nestjs/common';
import { PricingService } from './pricing.service';
import { PricingController } from './pricing.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  providers: [PricingService, PrismaService],
  controllers: [PricingController],
})
export class PricingModule {}
