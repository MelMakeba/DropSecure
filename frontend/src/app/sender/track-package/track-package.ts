import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule, UpperCasePipe, DatePipe } from '@angular/common';
import * as L from 'leaflet';
import { Package } from '../../models/package.model';
import { StatusEvent, Packages } from '../../services/packages/packages';
import { FormsModule } from '@angular/forms';
import { Sidebar } from '../../shared/sidebar/sidebar';


@Component({
  selector: 'app-track-package',
  standalone: true,
  imports: [CommonModule, UpperCasePipe, DatePipe, FormsModule, Sidebar],
  templateUrl: './track-package.html',
  styleUrls: ['./track-package.css']
})
export class TrackPackage implements OnInit, AfterViewInit, OnDestroy {
  trackingInput = '';
  packageData: Package | null = null;
  statusHistory: StatusEvent[] = [];
  map: L.Map | null = null;
  courierMarker: L.Marker | null = null;
  error = '';

  constructor(private packagesService: Packages) {}

  ngOnInit() {
    // Optionally, auto-focus input or handle query param
  }

  onTrackSubmit(event: Event) {
    event.preventDefault();
    this.error = '';
    this.packageData = null;
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
    this.packagesService.getPackageByTrackingNumber(this.trackingInput).subscribe(pkg => {
      if (pkg) {
        this.packageData = pkg;
        setTimeout(() => this.initMap(), 0);
      } else {
        this.error = 'Package not found!';
      }
    });
  }

  ngAfterViewInit() {
    // Map is initialized after packageData is set
  }

  initMap() {
    if (!this.packageData) return;
    const lat = this.packageData.currentLat ?? -1.286389;
    const lng = this.packageData.currentLng ?? 36.817223;
    this.map = L.map('map').setView([lat, lng], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    this.courierMarker = L.marker([lat, lng], {
      icon: L.icon({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        shadowSize: [41, 41]
      })
    })
      .addTo(this.map)
      .bindPopup('Courier Current Location')
      .openPopup();
  }

  ngOnDestroy() {
    if (this.map) {
      this.map.remove();
    }
  }

 get loggedInSenderId(): string {
    const user = localStorage.getItem('dropsecure_user');
    if (!user) return '';
    try {
      const parsed = JSON.parse(user);
      return parsed?.id ?? '';
    } catch {
      return '';
    }
  }

  get loggedInSenderName(): string {
    const user = localStorage.getItem('dropsecure_user');
    return user ? JSON.parse(user).name : '';
  }


   navItems = [
    { label: 'Dashboard', icon: 'home-outline', route: '/sender/dashboard', roles: ['sender'] },
    { label: 'My Packages', icon: 'cube-outline', route: '/sender/dashboard', fragment: 'my-packages', roles: ['sender'] },
    { label: 'Received', icon: 'checkmark-done-outline', route: '/sender/dashboard', fragment: 'received', roles: ['sender'] },
    { label: 'Track', icon: 'locate-outline', route: '/sender/track', roles: ['sender', 'courier', 'admin'] },
  ];
}
