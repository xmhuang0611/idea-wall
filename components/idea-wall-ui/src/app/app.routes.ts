import { Routes } from '@angular/router';
import { AuthGuard } from './auth/auth.guard';
import { AdminGuard } from './auth/admin.guard';
import { IdeaWallComponent } from './components/idea-wall/idea-wall.component';
import { IdeaFormComponent } from './components/idea-form/idea-form.component';
import { SettingsComponent } from './components/settings/settings.component';
import { UserManagementComponent } from './components/settings/user-management/user-management.component';
import { TagManagementComponent } from './components/settings/tag-management/tag-management.component';
import { SessionListComponent } from './components/session/session-list/session-list.component';
import { SessionFormComponent } from './components/session/session-form/session-form.component';
import { SessionDetailComponent } from './components/session/session-detail/session-detail.component';

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
      { path: 'tags', component: TagManagementComponent }
    ]
  },
  { path: 'idea-form', component: IdeaFormComponent, canActivate: [AuthGuard] },
  { path: 'idea-form/:id', component: IdeaFormComponent, canActivate: [AuthGuard] },
  { path: 'sessions', component: SessionListComponent },
  { path: 'sessions/create', component: SessionFormComponent, canActivate: [AuthGuard] },
  { path: 'sessions/:id/edit', component: SessionFormComponent, canActivate: [AuthGuard] },
  { path: 'sessions/:id', component: SessionDetailComponent },
  { path: '**', redirectTo: '' }
];