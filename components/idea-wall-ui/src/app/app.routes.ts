import { Routes } from '@angular/router';
import { IdeaWallComponent } from './components/idea-wall/idea-wall.component';
import { LoginComponent } from './components/login/login.component';

export const appRoutes: Routes = [
    { path: '', component: IdeaWallComponent },
    { path: 'ideas', component: IdeaWallComponent },
    { path: 'login', component: LoginComponent },
    { path: '**', redirectTo: '' }
  ];