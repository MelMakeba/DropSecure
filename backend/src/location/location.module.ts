import { Module } from '@nestjs/common';
import { LocationService } from './location.service';
import { LocationController } from './location.controller';
import { LocationGateway } from './location.gateway';
import { PrismaService } from 'src/prisma/prisma.service';
import { ApiResponseService } from 'src/shared/api-response.service';
import { AuthModule } from 'src/auth/auth.module';
import { PassportModule } from '@nestjs/passport';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Module({
  imports: [AuthModule, PassportModule],
  providers: [
    LocationService,
    LocationGateway,
    PrismaService,
    ApiResponseService,
    EventEmitter2,
  ],
  controllers: [LocationController],
  exports: [LocationService, LocationGateway],
})
export class LocationModule {}
