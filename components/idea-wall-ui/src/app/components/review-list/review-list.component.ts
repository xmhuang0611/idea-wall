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
      <!-- Header -->
      <div class="list-header mb-3">
        <h3 class="list-title">Reviews ({{ reviews.length }})</h3>
        <button 
          pButton 
          icon="pi pi-plus" 
          label="Add Review" 
          class="p-button-rounded p-button-primary" 
          [disabled]="!canAddReview()"
          [pTooltip]="canAddReview() ? 'Add your review for this idea' : 'You have already submitted a review'"
          (click)="openAddReviewForm()">
        </button>
      </div>

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
                <th style="width: 15%">Reviewer</th>
                <th style="width: 10%">Avg Score</th>
                <th style="width: 15%">Innovation</th>
                <th style="width: 15%">Value Creation</th>
                <th style="width: 15%">Feasibility</th>
                <th style="width: 15%">Impact</th>
                <th style="width: 15%">ROI</th>
                <th style="width: 10%">Date</th>
                <th style="width: 8%">Actions</th>
              </tr>
            </ng-template>

            <!-- Table Body -->
            <ng-template pTemplate="body" let-review>
              <tr>
                <!-- Reviewer Column -->
                <td>
                  <div class="reviewer-info">
                    <i class="pi pi-user text-primary mr-2"></i>
                    <span class="reviewer-name">{{ review.reviewer_name }}</span>
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
                      *ngIf="canEditReview(review)"
                      pButton 
                      icon="pi pi-pencil" 
                      class="p-button-rounded p-button-outlined p-button-sm"
                      pTooltip="Edit Review"
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

      <!-- Add Review Dialog -->
      <p-dialog 
        header="Add Review" 
        [(visible)]="showAddDialog"
        [modal]="true"
        [style]="{width: '90vw', maxWidth: '800px'}"
        [closable]="true"
        [draggable]="false"
        [resizable]="false"
        styleClass="review-add-dialog">
        <app-review-form
          *ngIf="showAddDialog"
          [ideaId]="ideaId"
          [targetType]="targetType"
          (reviewSubmitted)="onReviewSubmitted()"
          (cancel)="closeAddDialog()">
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
  @Output() reviewsUpdated = new EventEmitter<void>();

  showEditDialog = false;
  showAddDialog = false;
  selectedReview: Review | null = null;

  constructor(private authService: AuthService) {}

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
    // Allow editing if current user is the reviewer
    return review.creator_id === this.authService.getId();
  }

  editReview(review: Review): void {
    this.selectedReview = review;
    this.showEditDialog = true;
  }

  openAddReviewForm(): void {
    this.showAddDialog = true;
  }

  closeEditDialog(): void {
    this.showEditDialog = false;
    this.selectedReview = null;
  }

  closeAddDialog(): void {
    this.showAddDialog = false;
  }

  onReviewSubmitted(): void {
    this.showEditDialog = false;
    this.showAddDialog = false;
    this.selectedReview = null;
    this.reviewsUpdated.emit();
  }

  /**
   * Check if current user can add a review (hasn't already submitted one)
   */
  canAddReview(): boolean {
    if (!this.authService.getId()) {
      return false;
    }
    
    const currentUserId = this.authService.getId();
    const hasExistingReview = this.reviews.some(review => review.creator_id === currentUserId);
    return !hasExistingReview;
  }
} 