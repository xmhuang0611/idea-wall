import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { AvatarModule } from 'primeng/avatar';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TooltipModule } from 'primeng/tooltip';
import { ChipModule } from 'primeng/chip';
import { ReviewService } from '../../services/review.service';
import { Review, REVIEW_CRITERIA } from '../../models/review.model';

@Component({
  selector: 'app-review-list',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    TableModule,
    AvatarModule,
    ProgressSpinnerModule,
    TooltipModule,
    ChipModule
  ],
  template: `
    <div class="review-list-container">
      <p-card styleClass="mb-4">
        <ng-template pTemplate="title">
          <div class="text-xl font-bold">Review List</div>
        </ng-template>
        
        <ng-template pTemplate="subtitle" *ngIf="reviews.length > 0">
          <p class="text-500">Received {{reviews.length}} reviews, average score: {{calculateAverageScore()}}</p>
        </ng-template>
        
        <!-- Loading State -->
        <div *ngIf="isLoading" class="flex justify-content-center my-4">
          <p-progressSpinner></p-progressSpinner>
        </div>
        
        <!-- No Reviews -->
        <div *ngIf="!isLoading && reviews.length === 0" class="flex flex-column align-items-center my-4">
          <i class="pi pi-comments text-5xl text-primary-300 mb-3"></i>
          <p class="text-xl text-600">No Reviews</p>
          <p class="text-500">This idea has not received any reviews yet</p>
        </div>
        
        <!-- Reviews Table -->
        <div *ngIf="!isLoading && reviews.length > 0">
          <p-table [value]="reviews" [paginator]="reviews.length > 10" [rows]="10" styleClass="p-datatable-sm">
            <ng-template pTemplate="header">
              <tr>
                <th style="width: 15%">Reviewer</th>
                <th style="width: 10%">Innovation</th>
                <th style="width: 10%">Value Creation</th>
                <th style="width: 10%">Feasibility</th>
                <th style="width: 10%">Impact</th>
                <th style="width: 10%">ROI</th>
                <th style="width: 10%">Total</th>
                <th style="width: 25%">Comment</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-review>
              <tr>
                <td>
                  <div class="flex align-items-center">
                    <p-avatar 
                      [label]="getInitials(review.reviewer_name)" 
                      styleClass="mr-2"
                      [style]="{'background-color': generateAvatarColor(review.reviewer_id)}">
                    </p-avatar>
                    <span>{{review.reviewer_name}}</span>
                  </div>
                </td>
                <td>
                  <div class="score-cell" [pTooltip]="getScoreDescription('innovation', review.review_result.innovation.score)">
                    {{review.review_result.innovation.score}}
                  </div>
                </td>
                <td>
                  <div class="score-cell" [pTooltip]="getScoreDescription('value', review.review_result.value.score)">
                    {{review.review_result.value.score}}
                  </div>
                </td>
                <td>
                  <div class="score-cell" [pTooltip]="getScoreDescription('feasibility', review.review_result.feasibility.score)">
                    {{review.review_result.feasibility.score}}
                  </div>
                </td>
                <td>
                  <div class="score-cell" [pTooltip]="getScoreDescription('impact', review.review_result.impact.score)">
                    {{review.review_result.impact.score}}
                  </div>
                </td>
                <td>
                  <div class="score-cell" [pTooltip]="getScoreDescription('return_on_investment', review.review_result.return_on_investment.score)">
                    {{review.review_result.return_on_investment.score}}
                  </div>
                </td>
                <td>
                  <p-chip 
                    [label]="review.review_result.average_score + '/5'" 
                    [style]="{'background-color': getScoreColor(review.review_result.average_score)}"
                    styleClass="custom-chip">
                  </p-chip>
                </td>
                <td>
                  <div class="comment-cell">
                    <div *ngIf="review.review_result.innovation.comment" class="mb-1">
                      <strong>Innovation:</strong> {{review.review_result.innovation.comment}}
                    </div>
                    <div *ngIf="review.review_result.value.comment" class="mb-1">
                      <strong>Value:</strong> {{review.review_result.value.comment}}
                    </div>
                    <div *ngIf="review.review_result.feasibility.comment" class="mb-1">
                      <strong>Feasibility:</strong> {{review.review_result.feasibility.comment}}
                    </div>
                    <div *ngIf="review.review_result.impact.comment" class="mb-1">
                      <strong>Impact:</strong> {{review.review_result.impact.comment}}
                    </div>
                    <div *ngIf="review.review_result.return_on_investment.comment">
                      <strong>ROI:</strong> {{review.review_result.return_on_investment.comment}}
                    </div>
                  </div>
                </td>
              </tr>
            </ng-template>
          </p-table>
        </div>
      </p-card>
    </div>
  `,
  styles: [`
    .score-cell {
      padding: 0.2rem 0.5rem;
      width: 2rem;
      height: 2rem;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      background-color: var(--surface-200);
      margin: 0 auto;
      font-weight: bold;
    }
    
    .comment-cell {
      max-height: 60px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    
    :host ::ng-deep .custom-chip {
      color: white;
      font-weight: bold;
    }
  `]
})
export class ReviewListComponent implements OnInit, OnChanges {
  @Input() ideaId: string = '';
  
  reviews: Review[] = [];
  isLoading: boolean = false;
  criteria = REVIEW_CRITERIA;
  
  constructor(private reviewService: ReviewService) {}
  
  ngOnInit(): void {
    if (this.ideaId) {
      this.loadReviews();
    }
  }
  
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['ideaId'] && !changes['ideaId'].firstChange && this.ideaId) {
      this.loadReviews();
    }
  }
  
  loadReviews(): void {
    this.isLoading = true;
    this.reviewService.getReviews(this.ideaId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.reviews = response.data.map(review => ({
            ...review,
            created_at: new Date(review.created_at)
          }));
        }
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }
  
  calculateAverageScore(): string {
    if (this.reviews.length === 0) return '0';
    
    const totalSum = this.reviews.reduce((sum, review) => {
      return sum + (review.review_result.average_score || 0);
    }, 0);
    
    return (totalSum / this.reviews.length).toFixed(1);
  }
  
  getInitials(name: string): string {
    if (!name) return '?';
    return name.split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }
  
  generateAvatarColor(id: string): string {
    const colors = [
      '#3B82F6', '#10B981', '#F59E0B', '#EF4444', 
      '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'
    ];
    
    // Simple hash function to get a consistent color for the same id
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const index = Math.abs(hash % colors.length);
    return colors[index];
  }
  
  getScoreDescription(field: keyof typeof REVIEW_CRITERIA, score: number): string {
    if (!field || !score) return '';
    
    const criteria = REVIEW_CRITERIA[field];
    const level = criteria.levels.find(l => l.value === score);
    
    return level ? `${level.label}: ${level.description}` : '';
  }
  
  getScoreColor(score: number | undefined): string {
    if (!score) return '#9CA3AF'; // Grey for no score
    
    // Score is now 1-5 range
    if (score >= 4.5) return '#10B981'; // Green for excellent
    if (score >= 3.5) return '#3B82F6'; // Blue for good
    if (score >= 2.5) return '#F59E0B'; // Orange for average
    return '#EF4444'; // Red for poor
  }
  
  refresh(): void {
    this.loadReviews();
  }
} 