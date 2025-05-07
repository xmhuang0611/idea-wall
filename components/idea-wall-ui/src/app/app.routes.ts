import { Routes } from '@angular/router';
import { AuthGuard } from './auth/auth.guard';
import { IdeaWallComponent } from './components/idea-wall/idea-wall.component';
import { SubmitIdeaComponent } from './components/submit-idea/submit-idea.component';

export const routes: Routes = [
  { path: '', component: IdeaWallComponent },
  { path: 'submit-idea', component: SubmitIdeaComponent },
  { path: 'submit-idea/:id', component: SubmitIdeaComponent },
  { path: '**', redirectTo: '' }
];