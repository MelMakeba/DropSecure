import { Component, signal } from '@angular/core';
import { RouterOutlet} from '@angular/router';
import { HeaderComponent } from './shared/header/header.component';
import { Footer } from './shared/footer/footer';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, Footer],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('DropSecure');
}
