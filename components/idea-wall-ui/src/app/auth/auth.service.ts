import { Injectable } from '@angular/core';
import { OAuthService } from 'angular-oauth2-oidc';
import { BehaviorSubject, Observable, filter } from 'rxjs';
import { authConfig } from './auth.config';
import { TokenService } from './token.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(
    private oauthService: OAuthService,
    private tokenService: TokenService
  ) {
    this.configureOAuth();
  }

  private configureOAuth(): void {
    this.oauthService.configure(authConfig);
    
    // Setup automatic token refresh
    this.oauthService.setupAutomaticSilentRefresh();
    
    // Load discovery document and try to login
    this.oauthService.loadDiscoveryDocumentAndTryLogin().then(() => {
      if (this.oauthService.hasValidAccessToken()) {
        this.isAuthenticatedSubject.next(true);
      }
    });

    // Subscribe to token events
    this.oauthService.events
      .pipe(filter(e => e.type === 'token_received'))
      .subscribe(_ => {
        this.isAuthenticatedSubject.next(true);
      });

    this.oauthService.events
      .pipe(filter(e => e.type === 'token_expires'))
      .subscribe(_ => {
        this.isAuthenticatedSubject.next(false);
      });
  }

  public login(): void {
    this.oauthService.initCodeFlow();
  }

  public logout(): void {
    this.tokenService.logout();
    this.isAuthenticatedSubject.next(false);
  }

  public getAccessToken(): string {
    return this.oauthService.getAccessToken();
  }

  public getIdentityClaims(): any {
    return this.oauthService.getIdentityClaims();
  }

  public hasValidAccessToken(): boolean {
    return this.oauthService.hasValidAccessToken();
  }

  public getTokenExpiration(): Date {
    return new Date(this.oauthService.getAccessTokenExpiration());
  }
} 