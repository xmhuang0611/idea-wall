import { Routes } from '@angular/router';
import { DashboardComponent } from './dashboard.component';

export const DASHBOARD_ROUTES: Routes = [
  {
    path: '',
    component: DashboardComponent,
    children: [
      {
        path: 'ideas',
        loadComponent: () => import('../idea-wall/idea-wall.component').then(m => m.IdeaWallComponent)
      },
      {
        path: '',
        redirectTo: 'ideas',
        pathMatch: 'full'
      }
    ]
  }
]; 