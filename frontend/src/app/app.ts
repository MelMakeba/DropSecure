import { Component, signal } from '@angular/core';
import { RouterOutlet} from '@angular/router';
import { HeaderComponent } from './shared/header/header.component';
import { Footer } from './shared/footer/footer';
import { AuthService } from './services/auth/auth';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, Footer, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('DropSecure');

  get isAdminOrCourier(): boolean {
    const user = this.authService.getCurrentUser();
    return user?.role === 'ADMIN' || user?.role === 'COURIER';
  }

  constructor(private authService: AuthService) {}
}
