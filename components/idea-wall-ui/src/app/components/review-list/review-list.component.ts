import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { Review } from '../../models/review.model';
import { ReviewFormComponent } from '../review-form/review-form.component';
import { AuthService } from 'src/app/auth/auth.service';

@Component({
  selector: 'app-review-list',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    ButtonModule,
    CardModule,
    TagModule,
    DialogModule,
    TooltipModule,
    ConfirmDialogModule,
    ReviewFormComponent
  ],
  template: `
    <div class="review-list-container">
      <!-- No Reviews State -->
      <div *ngIf="reviews.length === 0" class="no-reviews-card">
        <p-card>
          <div class="text-center p-4">
            <i class="pi pi-file-excel text-3xl text-500 mb-3"></i>
            <p class="text-500 m-0">No reviews available yet.</p>
          </div>
        </p-card>
      </div>

      <!-- Reviews Table -->
      <div *ngIf="reviews.length > 0" class="reviews-table-card">
        <p-card>
          <p-table [value]="reviews" [paginator]="reviews.length > 10" [rows]="10" 
                   [rowsPerPageOptions]="[5, 10, 20]" styleClass="p-datatable-sm">
            
            <!-- Table Header -->
            <ng-template pTemplate="header">
              <tr>
                <th style="width: 12%">Reviewer</th>
                <th style="width: 8%">Avg Score</th>
                <th style="width: 13%">Innovation</th>
                <th style="width: 13%">Value Creation</th>
                <th style="width: 13%">Feasibility</th>
                <th style="width: 13%">Impact</th>
                <th style="width: 13%">ROI</th>
                <th style="width: 15%">Date</th>
                <th style="width: 8%">Actions</th>
              </tr>
            </ng-template>

            <!-- Table Body -->
            <ng-template pTemplate="body" let-review>
              <tr>
                <!-- Reviewer Column -->
                <td>
                  <div class="reviewer-info">
                    <span class="reviewer-name">{{ review.creator_name }}</span>
                  </div>
                </td>

                <!-- Average Score Column -->
                <td>
                  <div class="avg-score">
                    <span class="score-badge">{{ review.review_result.average_score | number:'1.1-1' }}/5.0</span>
                  </div>
                </td>

                <!-- Innovation Column -->
                <td>
                  <div class="criterion-detail">
                    <div class="score-display">
                      <span class="score-number">{{ review.review_result.innovation.score }}/5</span>
                    </div>
                    <div class="comment-display" *ngIf="review.review_result.innovation.comment">
                      <small>{{ review.review_result.innovation.comment }}</small>
                    </div>
                    <div class="no-comment" *ngIf="!review.review_result.innovation.comment">
                      <small class="text-muted">No comment</small>
                    </div>
                  </div>
                </td>

                <!-- Value Creation Column -->
                <td>
                  <div class="criterion-detail">
                    <div class="score-display">
                      <span class="score-number">{{ review.review_result.value.score }}/5</span>
                    </div>
                    <div class="comment-display" *ngIf="review.review_result.value.comment">
                      <small>{{ review.review_result.value.comment }}</small>
                    </div>
                    <div class="no-comment" *ngIf="!review.review_result.value.comment">
                      <small class="text-muted">No comment</small>
                    </div>
                  </div>
                </td>

                <!-- Feasibility Column -->
                <td>
                  <div class="criterion-detail">
                    <div class="score-display">
                      <span class="score-number">{{ review.review_result.feasibility.score }}/5</span>
                    </div>
                    <div class="comment-display" *ngIf="review.review_result.feasibility.comment">
                      <small>{{ review.review_result.feasibility.comment }}</small>
                    </div>
                    <div class="no-comment" *ngIf="!review.review_result.feasibility.comment">
                      <small class="text-muted">No comment</small>
                    </div>
                  </div>
                </td>

                <!-- Impact Column -->
                <td>
                  <div class="criterion-detail">
                    <div class="score-display">
                      <span class="score-number">{{ review.review_result.impact.score }}/5</span>
                    </div>
                    <div class="comment-display" *ngIf="review.review_result.impact.comment">
                      <small>{{ review.review_result.impact.comment }}</small>
                    </div>
                    <div class="no-comment" *ngIf="!review.review_result.impact.comment">
                      <small class="text-muted">No comment</small>
                    </div>
                  </div>
                </td>

                <!-- ROI Column -->
                <td>
                  <div class="criterion-detail">
                    <div class="score-display">
                      <span class="score-number">{{ review.review_result.return_on_investment.score }}/5</span>
                    </div>
                    <div class="comment-display" *ngIf="review.review_result.return_on_investment.comment">
                      <small>{{ review.review_result.return_on_investment.comment }}</small>
                    </div>
                    <div class="no-comment" *ngIf="!review.review_result.return_on_investment.comment">
                      <small class="text-muted">No comment</small>
                    </div>
                  </div>
                </td>

                <!-- Date Column -->
                <td>
                  <span class="review-date">{{ formatDate(review.created_at) }}</span>
                </td>

                <!-- Actions Column -->
                <td>
                  <div class="action-buttons">
                    <button 
                      *ngIf="review.creator_id === authService.getId()"
                      pButton 
                      icon="pi pi-pencil" 
                      class="p-button-rounded p-button-outlined p-button-sm"
                      [pTooltip]="getEditReviewTooltip(review)"
                      [disabled]="!canEditReview(review)"
                      (click)="editReview(review)">
                    </button>
                  </div>
                </td>
              </tr>
            </ng-template>
          </p-table>
        </p-card>
      </div>

      <!-- Edit Review Dialog -->
      <p-dialog 
        header="Edit Review" 
        [(visible)]="showEditDialog"
        [modal]="true"
        [style]="{width: '90vw', maxWidth: '800px'}"
        [closable]="true"
        [draggable]="false"
        [resizable]="false"
        styleClass="review-edit-dialog">
        <app-review-form
          *ngIf="showEditDialog && selectedReview"
          [ideaId]="ideaId"
          [targetType]="targetType"
          [existingReview]="selectedReview"
          (reviewSubmitted)="onReviewSubmitted()"
          (cancel)="closeEditDialog()">
        </app-review-form>
      </p-dialog>
    </div>
  `,
  styleUrls: ['./review-list.component.scss']
})
export class ReviewListComponent implements OnInit {
  @Input() reviews: Review[] = [];
  @Input() ideaId: string = '';
  @Input() targetType: string = 'Session';
  @Input() currentUserName: string = ''; // For checking edit permissions
  @Input() ideaStatus: string = ''; // For checking if idea is in correct status for editing
  @Output() reviewsUpdated = new EventEmitter<void>();

  showEditDialog = false;
  selectedReview: Review | null = null;

  constructor(public authService: AuthService) {}

  ngOnInit(): void {
    // Initialize component
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  canEditReview(review: Review): boolean {
    // Allow editing if current user is the reviewer AND idea is in session review status
    const isOwner = review.creator_id === this.authService.getId();
    const isInSessionReview = this.ideaStatus === 'IN_SESSION_REVIEW';
    return isOwner && isInSessionReview;
  }

  editReview(review: Review): void {
    this.selectedReview = review;
    this.showEditDialog = true;
  }

  closeEditDialog(): void {
    this.showEditDialog = false;
    this.selectedReview = null;
  }

  onReviewSubmitted(): void {
    this.showEditDialog = false;
    this.selectedReview = null;
    this.reviewsUpdated.emit();
  }

  getEditReviewTooltip(review: Review): string {
    const isOwner = review.creator_id === this.authService.getId();
    const isInSessionReview = this.ideaStatus === 'IN_SESSION_REVIEW';
    
    if (!isOwner) {
      return 'You can only edit your own reviews';
    }
    
    if (!isInSessionReview) {
      return 'Reviews can only be edited when idea is in session review status';
    }
    
    return 'Edit Review';
  }
} 