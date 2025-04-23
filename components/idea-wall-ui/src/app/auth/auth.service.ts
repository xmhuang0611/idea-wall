import { Injectable } from '@angular/core';
import { JwtHelperService } from '@auth0/angular-jwt';
import { OAuthService } from 'angular-oauth2-oidc';
import { JwksValidationHandler } from 'angular-oauth2-oidc-jwks'
import { authConfig } from './auth.config';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private jwtHelper: JwtHelperService = new JwtHelperService();
  private decodedAccessToken: any;

  constructor(
    private oauthService: OAuthService
  ) {
    this.configureOAuth();
  }

  private configureOAuth(): void {
    this.oauthService.configure(authConfig);
    this.oauthService.setStorage(localStorage);
    this.oauthService.tokenValidationHandler = new JwksValidationHandler();
    this.oauthService.tryLogin({ disableOAuth2StateCheck: true });
     this.handleNewToken();
  }

  public login(): void {
    this.oauthService.initImplicitFlow();
  }

  public logout(): void {
    this.oauthService.logOut();
  }

  public getToken(): string {
    return this.oauthService.getAccessToken();
  }

  public getId(): any {
    return this.decodedAccessToken && this.decodedAccessToken.userid;
  }

  public isLoggedIn(): boolean {
    return this.oauthService.hasValidAccessToken();
  }


  private handleNewToken():void{
const token = this.oauthService.getAccessToken();
localStorage.setItem('id_token', token);
this.decodedAccessToken = this.jwtHelper.decodeToken(token);
  }
} 