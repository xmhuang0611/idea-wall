import { Routes } from '@angular/router';
import { AuthGuard } from './auth/auth.guard';
import { AdminGuard } from './auth/admin.guard';
import { IdeaWallComponent } from './components/idea-wall/idea-wall.component';
import { IdeaFormComponent } from './components/idea-form/idea-form.component';
import { SettingsComponent } from './components/settings/settings.component';
import { UserManagementComponent } from './components/settings/user-management/user-management.component';
import { TagManagementComponent } from './components/settings/tag-management/tag-management.component';
import { LogViewComponent } from './components/settings/log-view/log-view.component';
import { IdeaSessionComponent } from './components/idea-session/idea-session.component';
import { SessionReviewFormComponent } from './components/session-review-form/session-review-form.component';
import { IdeaSessionDetailsComponent } from './components/idea-session-details/idea-session-details.component';

export const routes: Routes = [
  { path: '', component: IdeaWallComponent },
  { path: 'idea/:id', component: IdeaWallComponent },
  { 
    path: 'settings', 
    component: SettingsComponent,
    canActivate: [AdminGuard],
    children: [
      { path: '', redirectTo: 'users', pathMatch: 'full' },
      { path: 'users', component: UserManagementComponent },
      { path: 'tags', component: TagManagementComponent },
      { path: 'logs', component: LogViewComponent }
    ]
  },
  { path: 'idea-form', component: IdeaFormComponent, canActivate: [AuthGuard] },
  { path: 'idea-form/:id', component: IdeaFormComponent, canActivate: [AuthGuard] },
  { path: 'idea-session', component: IdeaSessionComponent },
  { path: 'session-review/:id', component: SessionReviewFormComponent, canActivate: [AuthGuard] },
  { path: 'idea-session/:id', component: IdeaSessionDetailsComponent },
  { path: '**', redirectTo: '' }
];