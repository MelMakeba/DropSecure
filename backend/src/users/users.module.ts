import { Module } from '@nestjs/common';
import { UserService } from './users.service';
import { UsersController } from './users.controller';
import { ApiResponseService } from 'src/shared/api-response.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  providers: [UserService, ApiResponseService, PrismaService],
  controllers: [UsersController],
  exports: [UserService],
})
export class UsersModule {}
