import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/idea-wall/idea-wall.component').then(m => m.IdeaWallComponent)
  },
  {
    path: '**',
    redirectTo: ''
  }
];