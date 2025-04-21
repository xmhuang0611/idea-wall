import { Injectable } from '@angular/core';
import { OAuthService } from 'angular-oauth2-oidc';

@Injectable({
  providedIn: 'root'
})
export class TokenService {
  constructor(private oauthService: OAuthService) {}

  getAccessToken(): string {
    return this.oauthService.getAccessToken();
  }

  logout(): void {
    this.oauthService.logOut();
  }
} 