import { Injectable } from '@angular/core';
import { JwtHelperService } from '@auth0/angular-jwt';
import { OAuthService } from 'angular-oauth2-oidc';
import { JwksValidationHandler } from 'angular-oauth2-oidc-jwks'
import { authConfig } from './auth.config';
import { Observable, of, Subject } from 'rxjs';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { LoginDialogComponent } from './login-dialog/login-dialog.component';
import { RoleDisplayService } from '../utils/role-display.service';
import { UserService } from '../services/user.service';
import { map, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private jwtHelper: JwtHelperService = new JwtHelperService();
  private decodedAccessToken: any;
  private useOauth = false;
  private localToken: string | null = null;
  private loginSubject = new Subject<boolean>();
  private dialogRef: DynamicDialogRef | null = null;

  constructor(
    private oauthService: OAuthService,
    private dialogService: DialogService,
    private roleDisplayService: RoleDisplayService,
    private userService: UserService
  ) {
    if (this.useOauth) {
      this.configureOAuth();
    } else {
      this.checkLocalToken();
    }
  }

  private configureOAuth(): void {
    this.oauthService.configure(authConfig);
    this.oauthService.setStorage(localStorage);
    this.oauthService.tokenValidationHandler = new JwksValidationHandler();
    this.oauthService.tryLogin({ disableOAuth2StateCheck: true });
    this.handleNewToken();
  }

  private checkLocalToken(): void {
    const token = localStorage.getItem('local_token');
    if (token) {
      this.localToken = token;
      this.decodedAccessToken = this.decodeLocalToken(token);
    }
  }

  public login(): void {
    if (this.useOauth) {
      this.oauthService.initImplicitFlow();
    } else {
      this.dialogRef = this.dialogService.open(LoginDialogComponent, {
        header: 'Login',
        width: '400px',
        contentStyle: { 
          overflow: 'hidden',
          padding: '0'
        },
        dismissableMask: true,
        baseZIndex: 1000,
        styleClass: 'login-dialog-container',
        showHeader: true,
        modal: true,
        breakpoints: {
          '576px': '90vw'
        }
      });

      this.dialogRef.onClose.subscribe(result => {
        if (result && result.userId && result.userName) {
          this.createLocalToken(result.userId, result.userName);
          this.loginSubject.next(true);
          window.location.reload();
        }
      });
    }
  }

  public getLoginStatus(): Observable<boolean> {
    return this.loginSubject.asObservable();
  }

  public logout(): void {
    if (this.useOauth) {
      this.oauthService.logOut();
    } else {
      localStorage.removeItem('local_token');
      this.localToken = null;
      this.decodedAccessToken = null;
      this.loginSubject.next(false);
    }
    window.location.reload();
  }

  public getToken(): string {
    if (this.useOauth) {
      return this.oauthService.getAccessToken();
    } else {
      return this.localToken || '';
    }
  }

  public getId(): any {
    return this.decodedAccessToken && this.decodedAccessToken.userid;
  }

  public getUserName(): string {
    return this.decodedAccessToken && (this.decodedAccessToken.user_name || '') || '';
  }

  public getUserRoles(): Observable<string[]> {
    const userId = this.getId();
    if (!userId) {
      return of([]);
    }

    return this.userService.getUser(userId).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data.roles.map(role => role.toString());
        }
        return [];
      }),
      catchError(() => {
        // Fallback to token roles if API call fails
        return of(this.decodedAccessToken?.roles || []);
      })
    );
  }

  public getUserDisplayRoles(): Observable<string[]> {
    return this.getUserRoles().pipe(
      map(roles => this.roleDisplayService.getDisplayNames(roles))
    );
  }

  public isLoggedIn(): boolean {
    if (this.useOauth) {
      return this.oauthService.hasValidAccessToken();
    } else {
      return !!this.localToken;
    }
  }

  private handleNewToken():void{
    const token = this.oauthService.getAccessToken();
    localStorage.setItem('id_token', token);
    this.decodedAccessToken = this.jwtHelper.decodeToken(token);
  }

  private createLocalToken(userId: string, userName: string): void {
    // Create a JWT format token
    const header = {
      alg: "RS256",
      typ: "JWT"
    };
    
    // Add required fields
    const payload = {
      sub: userId,
      userid: userId,
      user_name: userName,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60
    };
    
    // Encode header and payload
    const encodedHeader = btoa(JSON.stringify(header));
    const encodedPayload = btoa(JSON.stringify(payload));
    
    // Simple signature
    const signature = btoa(userId + userName);
    
    // Create JWT format: header.payload.signature
    const token = `${encodedHeader}.${encodedPayload}.${signature}`;
    
    localStorage.setItem('local_token', token);
    this.localToken = token;
    this.decodedAccessToken = payload;
  }

  private decodeLocalToken(token: string): any {
    try {
      // Split JWT
      const parts = token.split('.');
      if (parts.length < 2) {
        return null;
      }
      // Decode payload part
      return JSON.parse(atob(parts[1]));
    } catch (e) {
      return null;
    }
  }
} 