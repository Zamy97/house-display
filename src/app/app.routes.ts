import { Routes } from '@angular/router';
import { DisplayComponent } from './pages/display/display.component';
import { SettingsComponent } from './pages/settings/settings.component';

export const routes: Routes = [
  { path: '', component: DisplayComponent },
  { path: 'settings', component: SettingsComponent },
  { path: '**', redirectTo: '' },
];
