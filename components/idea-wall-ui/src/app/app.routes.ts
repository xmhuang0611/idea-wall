import { Routes } from '@angular/router';
import { AuthGuard } from './auth/auth.guard';

export const routes: Routes = [
  {
    path: '',
    // canActivate: [AuthGuard],
    loadComponent: () => import('./components/idea-wall/idea-wall.component').then(m => m.IdeaWallComponent)
  },
  {
    path: '**',
    redirectTo: ''
  }
];