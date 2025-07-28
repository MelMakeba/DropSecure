import { Module } from '@nestjs/common';
import { PackageService } from './packages.service';
import { PackageController } from './packages.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { EmailService } from 'src/shared/mailer/email.service';
import { UserService } from 'src/users/users.service';
import { ApiResponseService } from 'src/shared/api-response.service';

@Module({
  providers: [
    PackageService,
    PrismaService,
    EmailService,
    UserService,
    ApiResponseService,
  ],
  controllers: [PackageController],
  exports: [PackageService],
})
export class PackagesModule {}
