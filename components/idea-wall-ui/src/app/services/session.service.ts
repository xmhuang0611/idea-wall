import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { IdeaSession, SessionReview, SessionFinalDecision, BasicInfo } from '../models/session.model';
import { ApiResponse } from '../shared/models/api-response.model';
import { ToastService } from '../shared/services/toast.service';
import { ApiErrorHandlerService } from '../shared/services/api-error-handler.service';
import { AuthService } from '../auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class SessionService {
  private apiUrl = '/api/sessions';
  private reviewsApiUrl = '/api/reviews';

  constructor(
    private http: HttpClient,
    private toastService: ToastService,
    private errorHandler: ApiErrorHandlerService,
    private authService: AuthService
  ) {}

  getSessions(params: {
    skip?: number;
    limit?: number;
    search?: string;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
    status?: string;
    creator_id?: string;
    idea_id?: string;
  } = {}): Observable<ApiResponse<IdeaSession[]>> {
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
    if (params.status) {
      httpParams = httpParams.set('status', params.status);
    }
    if (params.creator_id) {
      httpParams = httpParams.set('creator_id', params.creator_id);
    }
    if (params.idea_id) {
      httpParams = httpParams.set('idea_id', params.idea_id);
    }

    return this.http.get<ApiResponse<IdeaSession[]>>(this.apiUrl, { params: httpParams })
      .pipe(
        catchError(this.errorHandler.handleError)
      );
  }

  getSessionById(id: string): Observable<ApiResponse<IdeaSession>> {
    return this.http.get<ApiResponse<IdeaSession>>(`${this.apiUrl}/${id}`)
      .pipe(
        catchError(this.errorHandler.handleError)
      );
  }

  getSessionByIdeaId(ideaId: string): Observable<ApiResponse<IdeaSession>> {
    return this.http.get<ApiResponse<IdeaSession>>(`${this.apiUrl}?idea_id=${ideaId}`)
      .pipe(
        catchError(this.errorHandler.handleError)
      );
  }

  createSession(ideaId: string, session: Partial<IdeaSession>): Observable<ApiResponse<IdeaSession>> {
    const basicInfo: BasicInfo = {
      idea_title: session.title || '',
      submitter_id: this.authService.getId(),
      submitter_name: this.authService.getUserName(),
      submitter_job: session.submitter_job || '',
      manager: session.manager || '',
      stream: session.stream || '',
      clients: session.clients || ''
    };

    const sessionData = {
      idea_id: ideaId,
      title: session.title,
      problem_statements: session.problem_statements,
      solutions: session.solutions,
      value: session.value,
      basic_info: basicInfo
    };

    return this.http.post<ApiResponse<IdeaSession>>(this.apiUrl, sessionData)
      .pipe(
        tap(response => {
          if (response.success) {
            this.toastService.showSuccess('Session created successfully');
          }
        }),
        catchError(this.errorHandler.handleError)
      );
  }

  updateSession(sessionId: string, sessionData: Partial<IdeaSession>): Observable<ApiResponse<IdeaSession>> {
    if (sessionData.submitter_job || sessionData.manager || sessionData.stream || sessionData.clients) {
      this.getSessionById(sessionId).subscribe(response => {
        if (response.success && response.data && response.data.basic_info) {
          const currentBasicInfo = response.data.basic_info;
          
          const basicInfo: BasicInfo = {
            idea_title: currentBasicInfo.idea_title,
            submitter_id: currentBasicInfo.submitter_id,
            submitter_name: currentBasicInfo.submitter_name,
            submitter_job: sessionData.submitter_job || currentBasicInfo.submitter_job || '',
            manager: sessionData.manager || currentBasicInfo.manager || '',
            stream: sessionData.stream || currentBasicInfo.stream || '',
            clients: sessionData.clients || currentBasicInfo.clients || ''
          };

          const { submitter_job, manager, stream, clients, ...restData } = sessionData;
          sessionData = {
            ...restData,
            basic_info: basicInfo
          };
        }
      });
    }

    return this.http.put<ApiResponse<IdeaSession>>(`${this.apiUrl}/${sessionId}`, sessionData)
      .pipe(
        tap(response => {
          if (response.success) {
            this.toastService.showSuccess('Session updated successfully');
          }
        }),
        catchError(this.errorHandler.handleError)
      );
  }

  getSessionReviews(sessionId: string): Observable<ApiResponse<SessionReview[]>> {
    return this.http.get<ApiResponse<SessionReview[]>>(`${this.reviewsApiUrl}/sessions/${sessionId}/reviews`)
      .pipe(
        catchError(this.errorHandler.handleError)
      );
  }

  submitReview(sessionId: string, review: Partial<SessionReview>): Observable<ApiResponse<SessionReview>> {
    return this.http.post<ApiResponse<SessionReview>>(`${this.reviewsApiUrl}/sessions/${sessionId}/reviews`, review)
      .pipe(
        tap(response => {
          if (response.success) {
            this.toastService.showSuccess('Review submitted successfully');
          }
        }),
        catchError(this.errorHandler.handleError)
      );
  }

  submitFinalDecision(
    sessionId: string, 
    decision: SessionFinalDecision
  ): Observable<ApiResponse<IdeaSession>> {
    return this.http.post<ApiResponse<IdeaSession>>(`${this.reviewsApiUrl}/sessions/${sessionId}/final-decision`, decision)
      .pipe(
        tap(response => {
          if (response.success) {
            this.toastService.showSuccess('Final decision submitted successfully');
          }
        }),
        catchError(this.errorHandler.handleError)
      );
  }

  getSessionVersions(sessionId: string): Observable<ApiResponse<IdeaSession[]>> {
    return this.http.get<ApiResponse<IdeaSession[]>>(`${this.apiUrl}/${sessionId}/versions`)
      .pipe(
        catchError(this.errorHandler.handleError)
      );
  }
} 