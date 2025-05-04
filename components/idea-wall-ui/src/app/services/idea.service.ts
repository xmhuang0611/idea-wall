import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
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
  private voteUrl = '/api/votes';

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

    return this.http.get<ApiResponse<Idea[]>>(this.apiUrl, { params: httpParams })
      .pipe(
        catchError(this.handleError)
      );
  }

  getIdeaById(id: string): Observable<ApiResponse<Idea>> {
    return this.http.get<ApiResponse<Idea>>(`${this.apiUrl}/${id}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  createIdea(idea: Partial<Idea>): Observable<ApiResponse<Idea>> {
    return this.http.post<ApiResponse<Idea>>(this.apiUrl, idea)
      .pipe(
        catchError(this.handleError)
      );
  }

  updateIdea(id: string, idea: Partial<Idea>): Observable<ApiResponse<Idea>> {
    return this.http.put<ApiResponse<Idea>>(`${this.apiUrl}/${id}`, idea)
      .pipe(
        catchError(this.handleError)
      );
  }

  deleteIdea(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * 为创意点赞或取消点赞
   * @param id 创意ID
   * @param voteStatus 1表示点赞，0表示取消点赞
   * @returns 包含操作结果的Observable
   */
  voteIdea(id: string, voteStatus: number): Observable<ApiResponse<void>> {
    const voteData = {
      vote_status: voteStatus,
      target_id: id,
      target_type: 'Idea'
    };

    return this.http.post<ApiResponse<void>>(this.voteUrl, voteData)
      .pipe(
        tap(() => {
          console.log(`${voteStatus === 1 ? '点赞' : '取消点赞'}成功: ${id}`);
        }),
        catchError(this.handleError)
      );
  }

  addComment(ideaId: string, comment: string, parentId?: string): Observable<any> {
    const commentData = {
      description: comment,
      parent_id: parentId
    };

    return this.http.post(`${this.apiUrl}/${ideaId}/comments`, commentData)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * 处理HTTP请求错误
   * @param error HTTP错误响应
   * @returns 包含错误信息的Observable
   */
  private handleError(error: HttpErrorResponse) {
    let errorMessage = '';
    
    if (error.error instanceof ErrorEvent) {
      // 客户端错误
      errorMessage = `客户端错误: ${error.error.message}`;
    } else {
      // 服务端错误
      const serverError = error.error?.error?.message || error.statusText;
      errorMessage = `服务端错误: ${error.status} - ${serverError}`;
    }
    
    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
} 