import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SenderDashboardService } from './../../services/dashboards/sender/sender-dashboard';

@Component({
  selector: 'app-dashboard-cards',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-cards.html',
  styleUrls: ['./dashboard-cards.css']
})
export class DashboardCards implements OnInit {
  @Input()
  senderId!: string; // Pass the logged-in sender's ID

  total = 0;
  delivered = 0;
  inTransit = 0;
  pending = 0;

  constructor(private dashboardService: SenderDashboardService) {}

  ngOnInit() {
    if (this.senderId) {
      this.dashboardService.getStats(this.senderId).subscribe(stats => {
        this.total = stats.total;
        this.delivered = stats.delivered;
        this.inTransit = stats.inTransit;
        this.pending = stats.pending;
      });
    }
  }
}
