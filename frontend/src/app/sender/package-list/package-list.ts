import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Package } from '../../models/package.model';

@Component({
  selector: 'app-package-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './package-list.html',
  styleUrls: ['./package-list.css']
})
export class PackageList {
  @Input() type: 'sent' | 'received' = 'sent';
  @Input() packages: Package[] = [];
  @Output() select = new EventEmitter<Package>();

  get title() {
    return this.type === 'sent' ? 'Sent Packages' : 'Received Packages';
  }
}
