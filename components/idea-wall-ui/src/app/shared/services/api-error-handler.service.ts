import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root'
})
export class ApiErrorHandlerService {
  constructor(private toastService: ToastService) {}

  /**
   * Handle HTTP request errors
   * @param error HTTP error response
   * @returns Observable with error information
   */
  handleError = (error: HttpErrorResponse): Observable<never> => {
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