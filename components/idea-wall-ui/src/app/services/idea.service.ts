import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Idea } from '../models/idea.model';
import { ApiResponse } from '../shared/models/api-response.model';
import { ToastService } from '../shared/services/toast.service';

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
        tap(response => {
          if (response.success) {
            this.toastService.showSuccess('Idea created successfully');
          }
        }),
        catchError(this.handleError)
      );
  }

  updateIdea(id: string, idea: Partial<Idea>): Observable<ApiResponse<Idea>> {
    return this.http.put<ApiResponse<Idea>>(`${this.apiUrl}/${id}`, idea)
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
      parent_id: parentId
    };

    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/${ideaId}/comments`, commentData)
      .pipe(
        tap(response => {
          if (response.success) {
            this.toastService.showSuccess('Comment published successfully');
          }
        }),
        catchError(this.handleError)
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