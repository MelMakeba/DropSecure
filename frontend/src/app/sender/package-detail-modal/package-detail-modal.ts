import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';
import { Packages, StatusEvent } from '../../services/packages/packages';
import { Package } from '../../models/package.model';
import { PackageStatusTimeline } from '../package-status-timeline/package-status-timeline';
import { ReviewForm } from '../review-form/review-form';

@Component({
  selector: 'app-package-detail-modal',
  standalone: true,
  imports: [CommonModule, PackageStatusTimeline, ReviewForm],
  templateUrl: './package-detail-modal.html',
  styleUrls: ['./package-detail-modal.css'],
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms ease-in', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0 }))
      ])
    ])
  ]
})
export class PackageDetailModal implements OnChanges {
  @Input() show = false;
  @Input() package?: Package;
  @Output() close = new EventEmitter<void>();

  statusHistory: StatusEvent[] = [];

  constructor(private packageService: Packages) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['package'] && this.package?.id) {
      this.packageService.getStatusHistory(this.package.id).subscribe(history => {
        this.statusHistory = history;
      });
    }
  }

  closeModal() {
    this.close.emit();
  }

  handleReview(event: { rating: number; comment: string }) {
    // Save review to backend or show a success message
    // You can also emit this to the parent if needed
    console.log('Review submitted:', event);
  }
}
