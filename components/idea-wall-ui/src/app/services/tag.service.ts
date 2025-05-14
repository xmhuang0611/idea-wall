import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { Tag } from '../models/tag.model';
import { ApiResponse } from '../shared/models/api-response.model';
import { catchError } from 'rxjs/operators';
import { ApiErrorHandlerService } from '../shared/services/api-error-handler.service';

@Injectable({
  providedIn: 'root'
})
export class TagService {
  private apiUrl = '/api/tags';

  constructor(
    private http: HttpClient,
    private errorHandler: ApiErrorHandlerService
  ) {}

  getTags(params: {
    skip?: number;
    limit?: number;
  } = {}): Observable<ApiResponse<Tag[]>> {
    let httpParams = new HttpParams();
    
    if (params.skip) {
      httpParams = httpParams.set('skip', params.skip.toString());
    }
    if (params.limit) {
      httpParams = httpParams.set('limit', params.limit.toString());
    }

    return this.http.get<ApiResponse<Tag[]>>(this.apiUrl, { params: httpParams })
      .pipe(
        catchError(this.errorHandler.handleError)
      );
  }
} 