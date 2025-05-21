import { Routes } from '@angular/router';
import { AuthGuard } from './auth/auth.guard';
import { IdeaWallComponent } from './components/idea-wall/idea-wall.component';
import { IdeaFormComponent } from './components/idea-form/idea-form.component';
import { SettingsComponent } from './components/settings/settings.component';

export const routes: Routes = [
  { path: '', component: IdeaWallComponent },
  { path: 'idea/:id', component: IdeaWallComponent },
  { path: 'settings', component: SettingsComponent },
  { path: 'idea-form', component: IdeaFormComponent, canActivate: [AuthGuard] },
  { path: 'idea-form/:id', component: IdeaFormComponent, canActivate: [AuthGuard] },
  { path: '**', redirectTo: '' }
];