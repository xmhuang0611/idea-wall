import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = '/api';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private tokenSubject = new BehaviorSubject<string | null>(null);

  constructor(private http: HttpClient) {
    this.loadUserFromStorage();
  }

  private loadUserFromStorage(): void {
    const storedToken = localStorage.getItem('token');
    
    if (storedToken) {
      this.tokenSubject.next(storedToken);
    }
  }

  login(username: string, password: string): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded'
    });

    const body = new HttpParams()
      .set('username', username)
      .set('password', password);

    return this.http.post<any>(`${this.apiUrl}/auth/login`, body.toString(), { headers })
      .pipe(
        tap(response => {
          this.setUserData( response.access_token);
        })
      );
  }

  private setUserData( token: string): void {
    // 保存用户信息和token到localStorage
    localStorage.setItem('token', token);
    
    // 更新BehaviorSubject
    this.tokenSubject.next(token);
  }

  logout(): void {
    // 清除localStorage
    localStorage.removeItem('token');
    
    // 重置BehaviorSubject
    this.currentUserSubject.next(null);
    this.tokenSubject.next(null);
  }

  // 获取当前用户信息
  getCurrentUser(): Observable<User | null> {
    return this.currentUserSubject.asObservable();
  }

  // 获取当前用户（同步方式）
  getCurrentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  // 获取token
  getToken(): Observable<string | null> {
    return this.tokenSubject.asObservable();
  }

  // 获取token（同步方式）
  getTokenValue(): string | null {
    return this.tokenSubject.value;
  }

  // 检查是否已登录
  isLoggedIn(): boolean {
    return !!this.currentUserSubject.value && !!this.tokenSubject.value;
  }

  // 刷新用户信息
  refreshUserInfo(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/users/me`).pipe(
      tap(user => {
        const currentToken = this.getTokenValue();
        if (currentToken) {
        }
      })
    );
  }
} 