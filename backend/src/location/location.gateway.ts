/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { LocationService } from './location.service';

@WebSocketGateway({ cors: true })
export class LocationGateway {
  @WebSocketServer()
  server: Server;

  constructor(private readonly locationService: LocationService) {}

  // Courier sends location update every 30s
  @SubscribeMessage('location-update')
  async handleLocationUpdate(@MessageBody() data: any) {
    const update = await this.locationService.updateCourierLocation(data);
    // Broadcast to all clients tracking this package
    if (this.server) {
      this.server.emit(`package-location-${data.packageId}`, update);
    }
    // Optionally emit package status change
    // this.server.emit('package-status-change', { ... });
    return update;
  }

  // Client subscribes to package location updates
  @SubscribeMessage('track-package-realtime')
  handleTrackPackage(@MessageBody() data: { packageId: string }) {
    // No-op: client just listens to `package-location-${packageId}` events
    return { message: `Subscribed to package ${data.packageId}` };
  }
}
