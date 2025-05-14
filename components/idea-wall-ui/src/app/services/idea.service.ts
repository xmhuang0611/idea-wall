import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Idea } from '../models/idea.model';
import { ApiResponse } from '../shared/models/api-response.model';
import { ToastService } from '../shared/services/toast.service';
import { Comment } from '../models/comment.model';

@Injectable({
  providedIn: 'root'
})
export class IdeaService {
  private apiUrl = '/api/ideas';
  private voteUrl = '/api/votes';

  constructor(
    private http: HttpClient, 
    private toastService: ToastService
  ) {}

  getIdeas(params: {
    skip?: number;
    limit?: number;
    search?: string;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
    tags?: number[];
    creator_id?: string;
  } = {}): Observable<ApiResponse<Idea[]>> {
    let httpParams = new HttpParams();
    
    if (params.skip !== undefined) {
      httpParams = httpParams.set('skip', params.skip.toString());
    }
    if (params.limit !== undefined) {
      httpParams = httpParams.set('limit', params.limit.toString());
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
    if (params.tags && params.tags.length > 0) {
      params.tags.forEach(tag => {
        httpParams = httpParams.append('tags', tag.toString());
      });
    }
    if (params.creator_id) {
      httpParams = httpParams.set('creator_id', params.creator_id);
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
        tap(response => {
          if (response.success) {
            this.toastService.showSuccess('Idea created successfully');
          }
        }),
        catchError(this.handleError)
      );
  }

  updateIdea(ideaId: string, ideaData: any): Observable<ApiResponse<Idea>> {
    return this.http.put<ApiResponse<Idea>>(`${this.apiUrl}/${ideaId}`, ideaData)
      .pipe(
        tap(response => {
          if (response.success) {
            this.toastService.showSuccess('Idea updated successfully');
          }
        }),
        catchError(this.handleError)
      );
  }


  deleteIdea(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`)
      .pipe(
        tap(response => {
          if (response.success) {
            this.toastService.showSuccess('Idea deleted successfully');
          }
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Vote or unvote an idea
   * @param id Idea ID
   * @param voteStatus 1 means vote, 0 means unvote
   * @returns Observable with operation result
   */
  voteIdea(id: string, voteStatus: number): Observable<ApiResponse<void>> {
    const voteData = {
      vote_status: voteStatus,
      target_id: id,
      target_type: 'Idea'
    };

    return this.http.post<ApiResponse<void>>(this.voteUrl, voteData)
      .pipe(
        tap(response => {
          if (response.success) {
            const message = voteStatus === 1 ? 'Voted successfully' : 'Unvoted successfully';
            this.toastService.showSuccess(message);
          }
        }),
        catchError(this.handleError)
      );
  }

  addComment(ideaId: string, comment: string, parentId?: string): Observable<ApiResponse<any>> {
    const commentData = {
      description: comment,
      idea_id: ideaId,
      parent_id: parentId || null
    };

    console.log('Sending comment data:', commentData);

    return this.http.post<ApiResponse<any>>(`/api/comments`, commentData)
      .pipe(
        tap(response => {
          console.log('Server response for comment:', response);
          if (response.success) {
            this.toastService.showSuccess('Comment published successfully');
          }
        }),
        catchError(this.handleError)
      );
  }

  getComments(ideaId: string, skip: number = 0, limit: number = 20): Observable<ApiResponse<Comment[]>> {
    console.log('Getting comments for idea:', ideaId);
    
    if (!ideaId) {
      console.error('Invalid idea ID for getComments');
      return throwError(() => new Error('Invalid idea ID'));
    }
    
    let params = new HttpParams()
      .set('idea_id', ideaId)
      .set('skip', skip.toString())
      .set('limit', limit.toString());
    
    return this.http.get<ApiResponse<Comment[]>>(`/api/comments`, { params })
      .pipe(
        tap(response => {
          console.log('Comments response:', response);
          
          if (!response.success || !response.data) {
            console.error('Comment fetch not successful or no data:', response);
            return;
          }
          
          // 确保dates字段被正确转换为Date对象
          response.data.forEach(comment => {
            if (typeof comment.created_at === 'string') {
              comment.created_at = new Date(comment.created_at);
            }
            if (typeof comment.updated_at === 'string') {
              comment.updated_at = new Date(comment.updated_at);
            }
          });
          
          console.log('Processed comments count:', response.data.length);
        }),
        catchError(error => {
          console.error('Error fetching comments:', error);
          // 返回一个带有空数组的成功响应，而不是错误
          return of({
            success: true,
            data: []
          });
        })
      );
  }

  /**
   * Handle HTTP request errors
   * @param error HTTP error response
   * @returns Observable with error information
   */
  private handleError = (error: HttpErrorResponse) => {
    let errorMessage = '';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Client error: ${error.error.message}`;
    } else {
      // Server-side error - using new error format
      const serverError = error.error?.error?.message || error.statusText;
      errorMessage = serverError;
    }
    
    // Show error notification
    this.toastService.showError(errorMessage);
    
    return throwError(() => new Error(errorMessage));
  }
} 