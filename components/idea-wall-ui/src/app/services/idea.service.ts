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

    console.log('Sending comment data:', commentData);

    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/${ideaId}/comments`, commentData)
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

  getComments(ideaId: string): Observable<ApiResponse<Comment[]>> {
    console.log('Getting comments for idea:', ideaId);
    
    if (!ideaId) {
      console.error('Invalid idea ID for getComments');
      return throwError(() => new Error('Invalid idea ID'));
    }
    
    return this.http.get<ApiResponse<Comment[]>>(`${this.apiUrl}/${ideaId}/comments`)
      .pipe(
        tap(response => {
          console.log('Raw comments response:', response);
          
          // 规范化响应格式
          if (!response) {
            console.error('Empty response received');
            return;
          }
          
          // 处理旧版API直接返回数组的情况
          if (Array.isArray(response)) {
            console.log('Direct array response, converting to standard format');
            // 转换为标准响应格式
            const standardResponse: ApiResponse<Comment[]> = {
              success: true,
              data: response
            };
            // @ts-ignore - 我们需要在运行时修改response的结构
            response = standardResponse;
          }
          
          // 检查success和data字段
          if (!response.success) {
            console.error('Comment fetch not successful:', response);
            if (!response.data) {
              // @ts-ignore
              response.data = [];
            }
            return;
          }
          
          // 检查data字段
          if (!response.data) {
            console.warn('No data field in response');
            response.data = []; // 确保data字段至少是空数组
            return;
          }
          
          // 确保data是数组
          if (!Array.isArray(response.data)) {
            console.error('Response data is not an array:', response.data);
            response.data = [];
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
            
            // 确保id字段存在
            if (!comment.id && (comment as any)._id) {
              comment.id = (comment as any)._id;
            }
          });
          
          console.log('Processed comments count:', response.data.length);
        }),
        catchError(error => {
          console.error('Error fetching comments:', error);
          // 返回一个带有空数组的成功响应，而不是错误
          // 这样UI层可以显示"没有评论"而不是错误状态
          return of({
            success: true,
            data: []
          });
        })
      );
  }

  /**
   * 刷新指定idea的评论数
   * @param ideaId Idea ID
   * @returns Observable with updated comment count
   */
  refreshCommentCount(ideaId: string): Observable<ApiResponse<number>> {
    console.log('Refreshing comment count for idea:', ideaId);
    
    if (!ideaId) {
      console.error('Invalid idea ID for refreshCommentCount');
      return throwError(() => new Error('Invalid idea ID'));
    }
    
    return this.http.get<ApiResponse<number>>(`${this.apiUrl}/${ideaId}/refresh-comment-count`)
      .pipe(
        tap(response => {
          console.log('Comment count refresh response:', response);
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