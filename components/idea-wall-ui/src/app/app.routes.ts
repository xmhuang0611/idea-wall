import { Routes } from '@angular/router';
import { AuthGuard } from './auth/auth.guard';

export const routes: Routes = [
  {
    path: '',
    // canActivate: [AuthGuard],
    loadChildren: () => import('./components/dashboard/dashboard.routes').then(m => m.DASHBOARD_ROUTES)
  },
  {
    path: '**',
    redirectTo: ''
  }
];