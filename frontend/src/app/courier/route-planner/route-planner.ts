import { Component, Input, Output, EventEmitter, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';
import { RouterModule } from '@angular/router';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { IonicModule } from '@ionic/angular';
import { StatusHistory } from '../../services/StatusHistory/status-history';

export interface RouteStop {
  lat: number;
  lng: number;
  label: string;
  packageId: string;
  address: string;
  status: string;
  recipient: string;
  scheduledTime?: string;
}

@Component({
  selector: 'app-route-planner',
  standalone: true,
  imports: [CommonModule, RouterModule, Sidebar, IonicModule],
  templateUrl: './route-planner.html',
  styleUrls: ['./route-planner.css']
})
export class RoutePlanner implements AfterViewInit {
 constructor(private packageStatusService: StatusHistory) {}

  @Input() stops: RouteStop[] = [
    { lat: -1.286389, lng: 36.817223, label: 'Nairobi CBD', packageId: '1', address: '', status: '', recipient: '' },
    { lat: -1.292066, lng: 36.821945, label: 'Westlands', packageId: '2', address: '', status: '', recipient: '' },
    { lat: -1.300000, lng: 36.800000, label: 'Karen', packageId: '3', address: '', status: '', recipient: '' }
  ];
  @Output() optimizeRoute = new EventEmitter<void>();
  @Output() updateLocation = new EventEmitter<{ packageId: string, location: string }>();

  map: L.Map | undefined;



  sidebarCollapsed = false;

  get loggedInCourierId(): string {
    const user = localStorage.getItem('dropsecure_user');
    if (!user) return '';
    try {
      const parsed = JSON.parse(user);
      return parsed?.id ?? '';
    } catch {
      return '';
    }
  }

  get loggedInCourierName(): string {
    const user = localStorage.getItem('dropsecure_user');
    return user ? JSON.parse(user).name : '';
  }

  navItems = [
    { label: 'Dashboard', icon: 'home-outline', route: '/courier/dashboard', roles: ['courier'] },
    { label: 'Assignments', icon: 'mail-unread-outline', route: '/courier/assignments', roles: ['courier'] },
    { label: 'Route Planner', icon: 'navigate-outline', route: '/courier/route-planner', roles: ['courier'] },
    // { label: 'Earnings', icon: 'cash-outline', route: '/courier/earnings', roles: ['courier'] },
    // { label: 'Track', icon: 'locate-outline', route: '/courier/track', roles: ['courier', 'admin'] },
  ];

  ngAfterViewInit() {
    this.map = L.map('leaflet-map').setView([this.stops[0].lat, this.stops[0].lng], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    // Add markers
    if (this.map) {
      this.stops.forEach(stop => {
        L.marker([stop.lat, stop.lng]).addTo(this.map!)
          .bindPopup(stop.label);
      });
    }

    // Draw route polyline
    const latlngs = this.stops.map(stop => [stop.lat, stop.lng]) as [number, number][];
    L.polyline(latlngs, { color: '#D4AF37', weight: 5 }).addTo(this.map);
  }

  onOptimize() {
    this.optimizeRoute.emit();
  }

  onUpdateLocation(pkgId: string) {
    const location = prompt('Enter current location for package ' + pkgId);
    if (location) {
      // Optionally, update status as well
      const user = localStorage.getItem('dropsecure_user');
      const courier = user ? JSON.parse(user) : { id: '', name: '' };
      this.packageStatusService.changeStatus(
        pkgId,
        'in_transit', // or keep current status
        { id: courier.id, role: 'COURIER', name: courier.name },
        location,
        `Location updated by courier`
      ).subscribe(() => {
        this.updateLocation.emit({ packageId: pkgId, location });
      });
    }
}
}
