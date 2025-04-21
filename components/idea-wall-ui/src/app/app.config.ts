import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { appRoutes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './interceptors/auth.interceptor';
import { OAuthModuleConfig, provideOAuthClient } from 'angular-oauth2-oidc';
import { routes } from './app.routes';
import { AuthInterceptor } from './auth/auth.interceptor';

export const oauthModuleConfig: OAuthModuleConfig = {
  resourceServer: {
    allowedUrls: ['http://localhost:8080'],
    sendAccessToken: true
  }
};

export const applicationConfig: ApplicationConfig = {
  providers: [
    provideRouter(appRoutes),
    provideHttpClient(
      withInterceptors([authInterceptor])
    ),
    provideOAuthClient(),
    { provide: OAuthModuleConfig, useValue: oauthModuleConfig }
  ]
};