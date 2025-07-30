import { Module } from '@nestjs/common';
import { LocationService } from './location.service';
import { LocationController } from './location.controller';
import { LocationGateway } from './location.gateway';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  providers: [LocationService, LocationGateway, PrismaService],
  controllers: [LocationController],
})
export class LocationModule {}
