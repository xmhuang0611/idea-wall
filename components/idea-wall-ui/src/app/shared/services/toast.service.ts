import { Injectable } from '@angular/core';
import { MessageService } from 'primeng/api';

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  constructor(private messageService: MessageService) { }

  /**
   * Display error toast
   * @param message Error message
   * @param duration Duration (milliseconds), default 5000ms
   */
  showError(message: string, duration: number = 5000): void {
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: message,
      life: duration
    });
  }

  /**
   * Display success toast
   * @param message Success message
   * @param duration Duration (milliseconds), default 3000ms
   */
  showSuccess(message: string, duration: number = 3000): void {
    this.messageService.add({
      severity: 'success',
      summary: 'Success',
      detail: message,
      life: duration
    });
  }

  /**
   * Display info toast
   * @param message Information message
   * @param duration Duration (milliseconds), default 3000ms
   */
  showInfo(message: string, duration: number = 3000): void {
    this.messageService.add({
      severity: 'info',
      summary: 'Information',
      detail: message,
      life: duration
    });
  }

  /**
   * Display warning toast
   * @param message Warning message
   * @param duration Duration (milliseconds), default 4000ms
   */
  showWarning(message: string, duration: number = 4000): void {
    this.messageService.add({
      severity: 'warn',
      summary: 'Warning',
      detail: message,
      life: duration
    });
  }

  /**
   * Clear all current toast messages
   */
  clear(): void {
    this.messageService.clear();
  }
} 