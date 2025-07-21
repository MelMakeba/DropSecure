import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-review-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './review-form.html',
  styleUrls: ['./review-form.css']
})
export class ReviewForm {
  @Input() packageId?: string;
  @Output() submitReview = new EventEmitter<{ rating: number; comment: string }>();

  rating = 0;
  comment = '';

  setRating(star: number) {
    this.rating = star;
  }

  onSubmit() {
    if (this.rating > 0 && this.comment.trim()) {
      this.submitReview.emit({ rating: this.rating, comment: this.comment });
      this.rating = 0;
      this.comment = '';
    }
  }
}
