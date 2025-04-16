import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Idea } from '../models/idea.model';

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
export class IdeaService {
  private apiUrl = '/api/ideas';

  constructor(private http: HttpClient) {}

  getIdeas(params: {
    page?: any;
    page_size?: any;
    category?: string;
    search?: string;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
  } = {}): Observable<ApiResponse<Idea[]>> {
    let httpParams = new HttpParams();
    
    if (params.page) {
      httpParams = httpParams.set('page', params.page.toString());
    }
    if (params.page_size) {
      httpParams = httpParams.set('page_size', params.page_size.toString());
    }
    if (params.category) {
      httpParams = httpParams.set('category', params.category);
    }
    if (params.search) {
      httpParams = httpParams.set('search', params.search);
    }
    if (params.sort_by) {
      httpParams = httpParams.set('sort_by', params.sort_by);
    }
    if (params.sort_order) {
      httpParams = httpParams.set('sort_order', params.sort_order);
    }

    return this.http.get<ApiResponse<Idea[]>>(this.apiUrl, { params: httpParams });
  }

  getIdeaById(id: string): Observable<ApiResponse<Idea>> {
    return this.http.get<ApiResponse<Idea>>(`${this.apiUrl}/${id}`);
  }

  createIdea(idea: Partial<Idea>): Observable<ApiResponse<Idea>> {
    return this.http.post<ApiResponse<Idea>>(this.apiUrl, idea);
  }

  updateIdea(id: string, idea: Partial<Idea>): Observable<ApiResponse<Idea>> {
    return this.http.put<ApiResponse<Idea>>(`${this.apiUrl}/${id}`, idea);
  }

  deleteIdea(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }

  voteIdea(id: string, voteStatus: number): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`/api/votes`, {
      vote_status: voteStatus,
      target_id: id,
      target_type: 'Idea'
    });
  }

  addComment(ideaId: string, comment: string, parentId?: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${ideaId}/comments`, {
      description: comment,
      parent_id: parentId
    });
  }
} 