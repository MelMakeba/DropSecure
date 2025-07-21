import { Component, signal } from '@angular/core';
import { AuthPages } from '../../auth-pages/auth-pages';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [AuthPages, IonicModule],
  templateUrl: './landing-page.component.html',
  styleUrls: ['./landing-page.component.css']
})
export class LandingPageComponent {

  showAuth = signal(false);
  authMode = signal<'login'|'register'|'forgot'>('login');

  constructor( private router: Router ) {}
  
  openAuth( mode: 'login' | 'register' | 'forgot' = 'login' ) {
    this.authMode.set(mode);
    this.showAuth.set(true);
  }

  closeAuth() {
    this.showAuth.set(false);
  }

}
