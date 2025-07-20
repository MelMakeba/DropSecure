import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-contact-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './contact-page.html',
  styleUrl: './contact-page.css'
})
export class ContactPage {
  name = '';
  email = '';
  phone = '';
  subject = '';
  message = ''; 
  successMsg= '';
  errorMsg = '';

  constructor(private router: Router) {}

  onSubmit() {
    if (this.name && this.email && this.subject && this.message) {
      this.successMsg = 'Message sent successfully!';
      this.errorMsg = '';
      // Reset form (for demo)
      this.name = this.email = this.phone = this.subject = this.message = '';
    } else {
      this.successMsg = '';
      this.errorMsg = 'Please fill in all required fields.';
    }
  }

  goHome(){
    this.router.navigate(['/']);
  }
}
