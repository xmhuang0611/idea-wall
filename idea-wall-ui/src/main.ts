import { AppComponent } from './app/app.component';
import { applicationConfig } from './app/app.config';
import { bootstrapApplication } from '@angular/platform-browser';

bootstrapApplication(AppComponent, applicationConfig).catch(err => console.error(err));