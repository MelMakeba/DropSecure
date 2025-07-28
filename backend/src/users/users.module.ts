import { Module } from '@nestjs/common';
import { UserService } from './users.service';
import { UserController } from './users.controller';
import { ApiResponseService } from 'src/shared/api-response.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  providers: [UserService, ApiResponseService, PrismaService],
  controllers: [UserController],
  exports: [UserService],
})
export class UsersModule {}
