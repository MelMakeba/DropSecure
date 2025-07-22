import { Routes } from '@angular/router';
import { LandingPageComponent } from './shared/home-page/landing-page.component';
import { AboutPageComponent } from './about-page/about-page.component';
import { ContactPage } from './contact-page/contact-page';
import { Sender } from './sender/sender';
import { TrackPackage } from './sender/track-package/track-package';
import { SentPackages } from './sender/sent-packages/sent-packages';
import { ReceivedPackages } from './sender/received-packages/received-packages';
import { CourierDashboard } from './courier/courier-dashboard/courier-dashboard';
import { Assignments} from './courier/assignments/assignments';

export const routes: Routes = [
  { path: '', component: LandingPageComponent },
  { path: 'about', component: AboutPageComponent },
  {path: 'contact', component: ContactPage},
  {path: 'sender/dashboard', component: Sender}, 
  {path: 'sender/track', component: TrackPackage},
  {path: 'sender/sent-packages', component: SentPackages},
  {path: 'sender/received-packages', component: ReceivedPackages}, 
  {path: 'courier/dashboard', component: CourierDashboard},
  {path: 'courier/assignments', component: Assignments}
  // ...other routes will be added here step by step
];
