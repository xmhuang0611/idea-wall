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

  /**
   * Get feeling icon class
   */
  getFeelingIcon(feeling: number): string {
    const icons = ['pi pi-times-circle', 'pi pi-frown', 'pi pi-minus-circle', 'pi pi-smile', 'pi pi-star'];
    return icons[feeling - 1] || 'pi pi-circle';
  }

  /**
   * Get feeling color
   */
  getFeelingColor(feeling: number): string {
    const colors = ['#e74c3c', '#f39c12', '#f1c40f', '#2ecc71', '#9b59b6'];
    return colors[feeling - 1] || '#6c757d';
  }
} 