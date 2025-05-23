import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { User, UserRole } from '../models/user.model';
import { ApiResponse } from '../shared/models/api-response.model';
import { ApiErrorHandlerService } from '../shared/services/api-error-handler.service';
import { ToastService } from '../shared/services/toast.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = '/api/users';

  constructor(
    private http: HttpClient,
    private errorHandler: ApiErrorHandlerService,
    private toastService: ToastService
  ) {}

  getUsers(): Observable<ApiResponse<User[]>> {
    return this.http.get<ApiResponse<User[]>>(this.apiUrl)
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

  createUser(user: { user_id: string; user_name: string; roles: UserRole[] }): Observable<ApiResponse<User>> {
    return this.http.post<ApiResponse<User>>(this.apiUrl, user)
      .pipe(
        tap(response => {
          if (response.success) {
            this.toastService.showSuccess('User created successfully');
          } else {
            this.toastService.showError(`Failed to create user: ${response.error?.message}`);
          }
        }),
        catchError(error => {
          return this.errorHandler.handleError(error);
        })
      );
  }

  updateUserRoles(userId: string, roles: UserRole[]): Observable<ApiResponse<User>> {
    return this.http.put<ApiResponse<User>>(`${this.apiUrl}/${userId}/roles`, { roles })
      .pipe(
        tap(response => {
          if (response.success) {
            this.toastService.showSuccess('User updated successfully');
          } else {
            this.toastService.showError(`Failed to update user: ${response.error?.message}`);
          }
        }),
        catchError(this.errorHandler.handleError)
      );
  }

  deleteUser(userId: string, userName: string): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(`${this.apiUrl}/${userId}`)
      .pipe(
        tap(response => {
          if (response.success) {
            this.toastService.showSuccess(`User "${userName}" deleted successfully`);
          } else {
            this.toastService.showError(`Failed to delete user: ${response.error?.message}`);
          }
        }),
        catchError(this.errorHandler.handleError)
      );
  }
} 