import { Routes } from '@angular/router';
import { AuthGuard } from './auth/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/idea-wall/idea-wall.component').then(m => m.IdeaWallComponent)
  },
  {
    path: 'submit-idea',
    loadComponent: () => import('./components/submit-idea/submit-idea.component').then(m => m.SubmitIdeaComponent),
    canActivate: [AuthGuard]
  },
  {
    path: '**',
    redirectTo: ''
  }
];