import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Review, ReviewResult } from '../models/review.model';
import { Idea, SessionReview, LeanCanvas } from '../models/idea.model';
import { ApiResponse } from '../shared/models/api-response.model';
import { ToastService } from '../shared/services/toast.service';
import { ApiErrorHandlerService } from '../shared/services/api-error-handler.service';

@Injectable({
  providedIn: 'root'
})
export class ReviewService {
  private apiUrl = '/api/reviews';

  constructor(
    private http: HttpClient,
    private toastService: ToastService,
    private errorHandler: ApiErrorHandlerService
  ) { }

  /**
   * Get reviews for an idea
   * @param ideaId Idea ID
   * @param targetType Review target type ("Session" or "Incubator")
   * @returns Observable with reviews list
   */
  getReviews(ideaId: string, targetType: string = 'Session'): Observable<ApiResponse<Review[]>> {
    let params = new HttpParams()
      .set('idea_id', ideaId)
      .set('target_type', targetType);

    return this.http.get<ApiResponse<Review[]>>(this.apiUrl, { params })
      .pipe(
        catchError(this.errorHandler.handleError)
      );
  }

  /**
   * Update an existing review
   * @param reviewId Review ID
   * @param reviewResult Updated review result data
   * @returns Observable with operation result
   */
  updateReview(reviewId: string, reviewResult: ReviewResult): Observable<ApiResponse<Review>> {
    const reviewData = {
      review_result: reviewResult
    };

    const url = `${this.apiUrl}/${reviewId}`;

    return this.http.put<ApiResponse<Review>>(url, reviewData)
      .pipe(
        tap(response => {
          if (response.success) {
            this.toastService.showSuccess('Review updated successfully');
          }
        }),
        catchError(this.errorHandler.handleError)
      );
  }

  // Session Review Methods

  /**
   * Submit an idea for session review
   * @param ideaId Idea ID
   * @param sessionReviewData Session review data
   * @returns Observable with operation result
   */
  submitSessionReview(ideaId: string, sessionReviewData: Partial<SessionReview>): Observable<ApiResponse<Idea>> {
    return this.http.put<ApiResponse<Idea>>(`${this.apiUrl}/session/${ideaId}`, sessionReviewData)
      .pipe(
        tap(response => {
          if (response.success) {
            this.toastService.showSuccess('Idea submitted for session review successfully');
          }
        }),
        catchError(this.errorHandler.handleError)
      );
  }

  /**
   * Add a review for a session review
   * @param ideaId Idea ID
   * @param reviewResult Review result data
   * @returns Observable with operation result
   */
  addSessionReview(ideaId: string, reviewResult: ReviewResult): Observable<ApiResponse<Idea>> {
    const reviewData = {
      review_result: reviewResult
    };

    const url = `${this.apiUrl}/session/${ideaId}/reviews`;

    return this.http.post<ApiResponse<Idea>>(url, reviewData)
      .pipe(
        tap(response => {
          if (response.success) {
            this.toastService.showSuccess('Review submitted successfully');
          }
        }),
        catchError(this.errorHandler.handleError)
      );
  }

  /**
   * Make final decision for session review
   * @param ideaId Idea ID
   * @param decision Final decision (APPROVED/REJECTED/NEED_IMPROVEMENT)
   * @param comments Decision comments
   * @returns Observable with operation result
   */
  makeSessionFinalDecision(
    ideaId: string, 
    decision: string, 
    comments: string
  ): Observable<ApiResponse<Idea>> {
    const decisionData = {
      decision: decision,
      comments: comments
    };

    return this.http.post<ApiResponse<Idea>>(
      `${this.apiUrl}/session/${ideaId}/final-decision`, 
      decisionData
    ).pipe(
      tap(response => {
        if (response.success) {
          this.toastService.showSuccess('Final decision submitted successfully');
        }
      }),
      catchError(this.errorHandler.handleError)
    );
  }

  /**
   * Resubmit an idea for session review when status is NEED_IMPROVEMENT
   * @param ideaId Idea ID
   * @param sessionReviewData Updated session review data
   * @returns Observable with operation result
   */
  resubmitSessionReview(ideaId: string, sessionReviewData: Partial<SessionReview>): Observable<ApiResponse<Idea>> {
    return this.http.put<ApiResponse<Idea>>(`${this.apiUrl}/session/${ideaId}/resubmit`, sessionReviewData)
      .pipe(
        tap(response => {
          if (response.success) {
            this.toastService.showSuccess('Idea resubmitted for session review successfully');
          }
        }),
        catchError(this.errorHandler.handleError)
      );
  }

  // Incubator Review Methods

  /**
   * Submit an idea for incubator review
   * @param ideaId Idea ID
   * @param leanCanvasData Lean canvas data
   * @returns Observable with operation result
   */
  submitIncubatorReview(ideaId: string, leanCanvasData: LeanCanvas): Observable<ApiResponse<Idea>> {
    return this.http.put<ApiResponse<Idea>>(`${this.apiUrl}/incubator/${ideaId}`, leanCanvasData)
      .pipe(
        tap(response => {
          if (response.success) {
            this.toastService.showSuccess('Idea submitted for incubator review successfully');
          }
        }),
        catchError(this.errorHandler.handleError)
      );
  }

  /**
   * Add a review for an incubator review
   * @param ideaId Idea ID
   * @param reviewResult Review result data
   * @returns Observable with operation result
   */
  addIncubatorReview(ideaId: string, reviewResult: ReviewResult): Observable<ApiResponse<Idea>> {
    const reviewData = {
      review_result: reviewResult
    };

    const url = `${this.apiUrl}/incubator/${ideaId}/reviews`;

    return this.http.post<ApiResponse<Idea>>(url, reviewData)
      .pipe(
        tap(response => {
          if (response.success) {
            this.toastService.showSuccess('Review submitted successfully');
          }
        }),
        catchError(this.errorHandler.handleError)
      );
  }

  /**
   * Make final decision for incubator review
   * @param ideaId Idea ID
   * @param decision Final decision (APPROVED/REJECTED/NEED_IMPROVEMENT)
   * @param comments Decision comments
   * @returns Observable with operation result
   */
  makeIncubatorFinalDecision(
    ideaId: string, 
    decision: string, 
    comments: string
  ): Observable<ApiResponse<Idea>> {
    const decisionData = {
      decision: decision,
      comments: comments
    };

    return this.http.post<ApiResponse<Idea>>(
      `${this.apiUrl}/incubator/${ideaId}/final-decision`, 
      decisionData
    ).pipe(
      tap(response => {
        if (response.success) {
          this.toastService.showSuccess('Final decision submitted successfully');
        }
      }),
      catchError(this.errorHandler.handleError)
    );
  }
} 