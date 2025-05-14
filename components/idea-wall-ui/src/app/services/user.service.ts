import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { User, UserRole } from '../models/user.model';
import { ApiResponse } from '../shared/models/api-response.model';
import { ApiErrorHandlerService } from '../shared/services/api-error-handler.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = '/api/users';

  constructor(
    private http: HttpClient,
    private errorHandler: ApiErrorHandlerService
  ) {}

  getUsers(): Observable<ApiResponse<User[]>> {
    return this.http.get<ApiResponse<User[]>>(this.apiUrl)
      .pipe(
        catchError(this.errorHandler.handleError)
      );
  }

  updateUserRoles(userId: string, roles: UserRole[]): Observable<ApiResponse<User>> {
    return this.http.put<ApiResponse<User>>(`${this.apiUrl}/${userId}/roles`, { roles })
      .pipe(
        catchError(this.errorHandler.handleError)
      );
  }

  getUser(userId: string): Observable<ApiResponse<User>> {
    return this.http.get<ApiResponse<User>>(`${this.apiUrl}/${userId}`)
      .pipe(
        catchError(this.errorHandler.handleError)
      );
  }
} 