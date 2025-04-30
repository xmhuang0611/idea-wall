import { Injectable } from '@angular/core';
import { JwtHelperService } from '@auth0/angular-jwt';
import { OAuthService } from 'angular-oauth2-oidc';
import { JwksValidationHandler } from 'angular-oauth2-oidc-jwks'
import { authConfig } from './auth.config';
import { Observable, of, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private jwtHelper: JwtHelperService = new JwtHelperService();
  private decodedAccessToken: any;
  private useOauth = false;
  private localToken: string | null = null;
  private loginSubject = new Subject<boolean>();

  constructor(
    private oauthService: OAuthService
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
      // 简单的提示用户输入 ID 和用户名
      const userId = prompt('请输入用户ID') || '';
      const userName = prompt('请输入用户名') || '';
      
      if (userId && userName) {
        this.createLocalToken(userId, userName);
        this.loginSubject.next(true);
      }
    }
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
    return this.decodedAccessToken && this.decodedAccessToken.user_name || '';
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
    // 创建一个符合后端解析要求的 JWT 格式 token
    const header = {
      alg: "HS256",
      typ: "JWT"
    };
    
    // 添加必要的字段，确保 userid 和 sub 都存在（sub 是标准的 JWT 用户标识字段）
    const payload = {
      sub: userId,  // 标准 JWT 中的用户标识字段
      userid: userId,
      user_name: userName,
      iat: Math.floor(Date.now() / 1000),  // 签发时间
      exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60  // 24小时过期（秒级时间戳）
    };
    
    // 编码 header 和 payload
    const encodedHeader = btoa(JSON.stringify(header));
    const encodedPayload = btoa(JSON.stringify(payload));
    
    // 简单的签名（不需要真实验证，但保持格式一致）
    const signature = btoa(userId + userName);
    
    // 创建标准 JWT 格式: header.payload.signature
    const token = `${encodedHeader}.${encodedPayload}.${signature}`;
    
    localStorage.setItem('local_token', token);
    this.localToken = token;
    this.decodedAccessToken = payload;
  }

  private decodeLocalToken(token: string): any {
    try {
      // 分割 JWT
      const parts = token.split('.');
      if (parts.length < 2) {
        return null;
      }
      // 只需要解码 payload 部分
      return JSON.parse(atob(parts[1]));
    } catch (e) {
      return null;
    }
  }
} 