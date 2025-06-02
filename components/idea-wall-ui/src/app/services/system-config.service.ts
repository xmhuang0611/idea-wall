import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { ApiResponse } from '../shared/models/api-response.model';
import { ToastService } from '../shared/services/toast.service';
import { ApiErrorHandlerService } from '../shared/services/api-error-handler.service';

export interface SystemConfig {
  key: string;
  description: string;
  value: string;
  updatedAt: string;
  updaterName: string;
}

export interface CreateConfigDto {
  key: string;
  description: string;
  value: string;
}

export interface UpdateConfigDto {
  value: string;
}

@Injectable({
  providedIn: 'root'
})
export class SystemConfigService {
  private apiUrl = `/api/configs`;

  constructor(
    private http: HttpClient,
    private toastService: ToastService,
    private errorHandler: ApiErrorHandlerService
  ) {}

  /**
   * Get all system configurations with pagination
   */
  getConfigs(): Observable<ApiResponse<SystemConfig[]>> {
    return this.http.get<ApiResponse<SystemConfig[]>>(this.apiUrl)
      .pipe(
        catchError(this.errorHandler.handleError)
      );
  }

  /**
   * Get a single system configuration by key
   */
  getConfig(key: string): Observable<ApiResponse<SystemConfig>> {
    return this.http.get<ApiResponse<SystemConfig>>(`${this.apiUrl}/${key}`)
      .pipe(
        catchError(this.errorHandler.handleError)
      );
  }

  /**
   * Create a new system configuration
   */
  createConfig(config: CreateConfigDto): Observable<ApiResponse<SystemConfig>> {
    return this.http.post<ApiResponse<SystemConfig>>(this.apiUrl, config)
      .pipe(
        tap(response => {
          if (response.success) {
            this.toastService.showSuccess('Configuration created successfully');
          } else {
            this.toastService.showError(`Failed to create configuration: ${response.error?.message}`);
          }
        }),
        catchError(this.errorHandler.handleError)
      );
  }

  /**
   * Update a system configuration
   */
  updateConfig(key: string, config: UpdateConfigDto): Observable<ApiResponse<SystemConfig>> {
    return this.http.put<ApiResponse<SystemConfig>>(`${this.apiUrl}/${key}`, config)
      .pipe(
        tap(response => {
          if (response.success) {
            this.toastService.showSuccess('Configuration updated successfully');
          } else {
            this.toastService.showError(`Failed to update configuration: ${response.error?.message}`);
          }
        }),
        catchError(this.errorHandler.handleError)
      );
  }

  /**
   * Delete a system configuration
   */
  deleteConfig(key: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${key}`)
      .pipe(
        tap(response => {
          if (response.success) {
            this.toastService.showSuccess('Configuration deleted successfully');
          } else {
            this.toastService.showError(`Failed to delete configuration: ${response.error?.message}`);
          }
        }),
        catchError(this.errorHandler.handleError)
      );
  }
} 