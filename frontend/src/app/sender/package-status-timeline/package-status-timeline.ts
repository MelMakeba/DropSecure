import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { StatusEvent } from '../../models/status-event.model';
@Component({
  selector: 'app-package-status-timeline',
  imports: [CommonModule],
  templateUrl: './package-status-timeline.html',
  styleUrls: ['./package-status-timeline.css']
})
export class PackageStatusTimeline {
  @Input() statusHistory: StatusEvent[] = [];


  updateStatus(newStatus: StatusEvent): void {
    this.statusHistory.push(newStatus);
  }
}
