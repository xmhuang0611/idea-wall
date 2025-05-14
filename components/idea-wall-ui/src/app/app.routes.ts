import { Routes } from '@angular/router';
import { AuthGuard } from './auth/auth.guard';
import { IdeaWallComponent } from './components/idea-wall/idea-wall.component';
import { SubmitIdeaComponent } from './components/submit-idea/submit-idea.component';
import { SettingsComponent } from './components/settings/settings.component';

export const routes: Routes = [
  { path: '', component: IdeaWallComponent },
  { path: 'idea/:id', component: IdeaWallComponent },
  { path: 'settings', component: SettingsComponent },
  { path: 'submit-idea', component: SubmitIdeaComponent, canActivate: [AuthGuard] },
  { path: 'submit-idea/:id', component: SubmitIdeaComponent, canActivate: [AuthGuard] },
  { path: '**', redirectTo: '' }
];