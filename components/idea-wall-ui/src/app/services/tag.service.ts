import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Tag } from '../models/tag.model';

interface ApiResponse<T> {
  status: 'success' | 'error';
  data: T;
  meta?: {
    page: number;
    page_size: number;
    total: number;
  };
  error?: {
    code: string;
    message: string;
  };
}

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

    return this.http.get<Tag[]>(this.apiUrl, { params: httpParams });
  }

  getTagById(id: number): Observable<Tag> {
    return this.http.get<Tag>(`${this.apiUrl}/${id}`);
  }
} 