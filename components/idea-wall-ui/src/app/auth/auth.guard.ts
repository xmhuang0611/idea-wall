import { Injectable } from '@angular/core';
import { CanActivate } from '@angular/router';
import { TokenService } from './token.service';
import { OAuthService } from 'angular-oauth2-oidc';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private oauthService: OAuthService,
    private tokenService: TokenService
  ) {}

  canActivate(): boolean {
    if (this.oauthService.hasValidAccessToken()) {
      return true;
    }

    // Redirect to authentication server
    this.oauthService.initCodeFlow();
    return false;
  }
} 