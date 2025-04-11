import { IdeaWallComponent } from './components/idea-wall/idea-wall.component';
import { LoginComponent } from './components/login/login.component';

export const appRoutes = [
    { path: '', component: IdeaWallComponent },
    { path: 'login', component: LoginComponent },
    { path: '**', redirectTo: '' }
  ];