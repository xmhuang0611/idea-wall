import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { ToastService } from '../shared/services/toast.service';
import { ApiResponse } from '../shared/models/api-response.model';
import { ApiErrorHandlerService } from '../shared/services/api-error-handler.service';

@Injectable({
  providedIn: 'root'
})
export class CommentService {
  private apiUrl = `/api/comments`;

  constructor(
    private http: HttpClient,
    private toastService: ToastService,
        private errorHandler: ApiErrorHandlerService
  ) { }

  deleteComment(commentId: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${commentId}`)
      .pipe(
        tap(response => {
          if (response.success) {
            this.toastService.showSuccess('Tag deleted successfully');
          }
        }),
        catchError(this.errorHandler.handleError)
      );
  }
} 