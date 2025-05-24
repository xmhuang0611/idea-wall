import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Review, ReviewResult } from '../models/review.model';
import { ApiResponse } from '../shared/models/api-response.model';
import { ToastService } from '../shared/services/toast.service';
import { ApiErrorHandlerService } from '../shared/services/api-error-handler.service';
import { Idea } from '../models/idea.model';

@Injectable({
  providedIn: 'root'
})
export class ReviewService {
  private apiUrl = '/api/reviews';
  private ideasApiUrl = '/api/ideas';

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
   * Add a review for an idea session
   * @param ideaId Idea ID
   * @param targetType Review target type ("Session" or "Incubator")
   * @param reviewResult Review result data
   * @returns Observable with operation result
   */
  addReview(ideaId: string, targetType: string, reviewResult: ReviewResult): Observable<ApiResponse<Idea>> {
    const reviewData = {
      review_result: reviewResult
    };

    const url = `${this.ideasApiUrl}/${ideaId}/session-review/reviews`;

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
} 