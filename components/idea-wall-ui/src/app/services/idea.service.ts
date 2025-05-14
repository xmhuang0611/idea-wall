import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Idea } from '../models/idea.model';
import { ApiResponse } from '../shared/models/api-response.model';
import { ToastService } from '../shared/services/toast.service';
import { Comment } from '../models/comment.model';
import { ApiErrorHandlerService } from '../shared/services/api-error-handler.service';

@Injectable({
  providedIn: 'root'
})
export class IdeaService {
  private apiUrl = '/api/ideas';
  private voteUrl = '/api/votes';

  constructor(
    private http: HttpClient, 
    private toastService: ToastService,
    private errorHandler: ApiErrorHandlerService
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
        catchError(this.errorHandler.handleError)
      );
  }

  getIdeaById(id: string): Observable<ApiResponse<Idea>> {
    return this.http.get<ApiResponse<Idea>>(`${this.apiUrl}/${id}`)
      .pipe(
        catchError(this.errorHandler.handleError)
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
        catchError(this.errorHandler.handleError)
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
        catchError(this.errorHandler.handleError)
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
        catchError(this.errorHandler.handleError)
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
        catchError(this.errorHandler.handleError)
      );
  }

  addComment(ideaId: string, comment: string, parentId?: string): Observable<ApiResponse<any>> {
    const commentData = {
      description: comment,
      idea_id: ideaId,
      parent_id: parentId || null
    };

    return this.http.post<ApiResponse<any>>(`/api/comments`, commentData)
      .pipe(
        tap(response => {
          if (response.success) {
            this.toastService.showSuccess('Comment published successfully');
          }
        }),
        catchError(this.errorHandler.handleError)
      );
  }

  getComments(ideaId: string, skip: number = 0, limit: number = 20): Observable<ApiResponse<Comment[]>> {
    if (!ideaId) {
      return throwError(() => new Error('Invalid idea ID'));
    }
    
    let params = new HttpParams()
      .set('idea_id', ideaId)
      .set('skip', skip.toString())
      .set('limit', limit.toString());
    
    return this.http.get<ApiResponse<Comment[]>>(`/api/comments`, { params })
      .pipe(
        catchError(this.errorHandler.handleError)
      );
  }
} 