import { Module } from '@nestjs/common';
import { ContactService } from './contact.service';
import { ContactController } from './contact.controller';
import { EmailService } from 'src/shared/mailer/email.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { ApiResponseService } from 'src/shared/api-response.service';

@Module({
  providers: [ContactService, EmailService, PrismaService, ApiResponseService],
  controllers: [ContactController],
})
export class ContactModule {}
