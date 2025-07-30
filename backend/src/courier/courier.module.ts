import { Module } from '@nestjs/common';
import { CourierService } from './courier.service';
import { CourierController } from './courier.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { ApiResponseService } from 'src/shared/api-response.service';

@Module({
  providers: [CourierService, PrismaService, ApiResponseService],
  controllers: [CourierController],
  exports: [CourierService],
})
export class CourierModule {}
