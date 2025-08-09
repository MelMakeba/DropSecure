import { Module } from '@nestjs/common';
import { CourierService } from './courier.service';
import { CourierController } from './courier.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { ApiResponseService } from 'src/shared/api-response.service';
import { PackageService } from 'src/packages/packages.service';
import { EmailService } from 'src/shared/mailer/email.service';

@Module({
  providers: [
    CourierService,
    PrismaService,
    ApiResponseService,
    PackageService,
    EmailService,
  ],
  controllers: [CourierController],
  exports: [CourierService],
})
export class CourierModule {}
