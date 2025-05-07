import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { Tag } from '../models/tag.model';
import { ApiResponse } from '../shared/models/api-response.model';
import { map, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class TagService {
  private apiUrl = '/api/tags';

  constructor(private http: HttpClient) {}

  getTags(params: {
    skip?: number;
    limit?: number;
  } = {}): Observable<Tag[]> {
    let httpParams = new HttpParams();
    
    if (params.skip) {
      httpParams = httpParams.set('skip', params.skip.toString());
    }
    if (params.limit) {
      httpParams = httpParams.set('limit', params.limit.toString());
    }

    return this.http.get<ApiResponse<Tag[]>>(this.apiUrl, { params: httpParams })
      .pipe(
        map(response => response.data || [])
      );
  }

  getTagById(id: number): Observable<Tag> {
    return this.http.get<ApiResponse<Tag>>(`${this.apiUrl}/${id}`)
      .pipe(
        map(response => {
          if (!response.data) {
            throw new Error('Tag not found');
          }
          return response.data;
        }),
        catchError(error => throwError(() => error))
      );
  }
} 