import { Routes } from '@angular/router';
import { LandingPageComponent } from './shared/home-page/landing-page.component';
import { AboutPageComponent } from './about-page/about-page.component';
import { ContactPage } from './contact-page/contact-page';

export const routes: Routes = [
  { path: '', component: LandingPageComponent },
  { path: 'about', component: AboutPageComponent },
  {path: 'contact', component: ContactPage},
  // ...other routes will be added here step by step
];
