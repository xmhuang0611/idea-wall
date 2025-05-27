import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApiResponse } from '../shared/models/api-response.model';
import { ApiErrorHandlerService } from '../shared/services/api-error-handler.service';

export interface LogEntry {
  id: string;
  object_type: string;
  object_id: string;
  object_data: string;
  operation_type: string;
  created_at: string;
  creator_id: string;
  creator_name: string;
  updated_at: string;
  updater_id: string;
  updater_name: string;
}

export interface LogListParams {
  page?: number;
  page_size?: number;
  object_type?: string;
  object_id?: string;
  operation_type?: string;
  start_date?: Date;
  end_date?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class LogService {
  private apiUrl = '/api/logs';

  constructor(
    private http: HttpClient,
    private errorHandler: ApiErrorHandlerService
  ) {}

  /**
   * Get log list
   * @param params Query parameters
   * @returns Observable with logs list and pagination info
   */
  getLogs(params: LogListParams = {}): Observable<ApiResponse<LogEntry[]>> {
    let httpParams = new HttpParams();
    
    if (params.page) {
      httpParams = httpParams.set('page', params.page.toString());
    }
    if (params.page_size) {
      httpParams = httpParams.set('page_size', params.page_size.toString());
    }
    if (params.object_type) {
      httpParams = httpParams.set('object_type', params.object_type);
    }
    if (params.object_id) {
      httpParams = httpParams.set('object_id', params.object_id);
    }
    if (params.operation_type) {
      httpParams = httpParams.set('operation_type', params.operation_type);
    }
    if (params.start_date) {
      httpParams = httpParams.set('start_date', params.start_date.toISOString());
    }
    if (params.end_date) {
      httpParams = httpParams.set('end_date', params.end_date.toISOString());
    }

    return this.http.get<ApiResponse<LogEntry[]>>(this.apiUrl, { params: httpParams })
      .pipe(
        catchError(this.errorHandler.handleError)
      );
  }

  /**
   * Get single log details
   * @param logId Log ID
   * @returns Observable with log details
   */
  getLog(logId: string): Observable<ApiResponse<LogEntry>> {
    return this.http.get<ApiResponse<LogEntry>>(`${this.apiUrl}/${logId}`)
      .pipe(
        catchError(this.errorHandler.handleError)
      );
  }
} 