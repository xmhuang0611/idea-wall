import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class FeelingUtilService {
  
  constructor() { }
  
  /**
   * Get feeling emoji image path
   */
  getFeelingImage(feeling: number): string {
    return `assets/images/${feeling}-${this.getFeelingEmoji(feeling)}.png`;
  }

  /**
   * Get feeling label
   */
  getFeelingLabel(feeling: number): string {
    const labels = ['Terrible', 'Unhappy', 'Thoughtable', 'Happy', 'Unbelievable'];
    return labels[feeling - 1] || '';
  }

  /**
   * Get feeling emoji code
   */
  getFeelingEmoji(feeling: number): string {
    const emojis = ['1f92c', '1f621', '1f615', '1f604', '1f929'];
    return emojis[feeling - 1] || '';
  }
} 