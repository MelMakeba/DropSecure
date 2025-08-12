/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { LocationService } from './location.service';
import { OnEvent } from '@nestjs/event-emitter';

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:4200', 'https://dropsecure.onrender.com'],
    credentials: true,
  },
  namespace: '/location',
})
export class LocationGateway {
  @WebSocketServer()
  server: Server;

  constructor(private locationService: LocationService) {}

  @OnEvent('location.updated')
  handleLocationEvent(data: any) {
    this.emitLocationUpdate(data);
  }

  // Join a package tracking room
  @SubscribeMessage('joinPackageTracking')
  @UseGuards(JwtAuthGuard)
  handleJoinTracking(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { packageId: string },
  ) {
    client.join(`package-${data.packageId}`);
    client.emit('joined', { packageId: data.packageId });
  }

  // Leave a package tracking room
  @SubscribeMessage('leavePackageTracking')
  handleLeaveTracking(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { packageId: string },
  ) {
    client.leave(`package-${data.packageId}`);
  }

  // Emit location update to all clients tracking this package
  emitLocationUpdate(data: {
    packageId: string;
    courierId: string;
    latitude: number;
    longitude: number;
    address?: string;
    timestamp: Date;
    packageDetails?: any;
  }) {
    this.server.to(`package-${data.packageId}`).emit('locationUpdate', data);
  }

  // Emit status update to all clients tracking this package
  emitStatusUpdate(data: {
    packageId: string;
    status: string;
    timestamp: Date;
    packageDetails?: any;
  }) {
    this.server.to(`package-${data.packageId}`).emit('statusUpdate', data);
  }

  // Handle courier connection for real-time updates
  @SubscribeMessage('courierConnect')
  @UseGuards(JwtAuthGuard)
  handleCourierConnect(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { courierId: string; packageIds: string[] },
  ) {
    // Join courier to all their assigned packages
    data.packageIds.forEach((packageId) => {
      client.join(`package-${packageId}`);
    });

    client.emit('courierConnected', {
      courierId: data.courierId,
      connectedPackages: data.packageIds,
    });
  }

  // Courier sends location update every 30s
  @SubscribeMessage('location-update')
  async handleLocationUpdate(
    @MessageBody()
    data: {
      courierId: string;
      packageId: string;
      latitude: number;
      longitude: number;
      address?: string;
      notes?: string;
    },
  ): Promise<{
    courierId: string;
    packageId: string;
    latitude: number;
    longitude: number;
    address?: string;
    notes?: string;
    id: string;
    timestamp: Date;
  }> {
    const rawUpdate = await this.locationService.updateCourierLocation(data);

    // Validate required fields
    if (!rawUpdate.courierId) {
      throw new Error('Invalid courier data: courierId is required');
    }

    // Transform the data to match expected type
    const update = {
      ...rawUpdate,
      courierId: rawUpdate.courierId,
      address: rawUpdate.address || undefined,
      notes: rawUpdate.notes || undefined,
    };

    if (this.server) {
      this.server.emit(`package-location-${data.packageId}`, update);
    }

    return update;
  }

  // Client subscribes to package location updates
  @SubscribeMessage('track-package-realtime')
  handleTrackPackage(@MessageBody() data: { packageId: string }) {
    // No-op: client just listens to `package-location-${packageId}` events
    return { message: `Subscribed to package ${data.packageId}` };
  }
}
